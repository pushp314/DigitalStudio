package services

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"gorm.io/gorm"
)

type ImportMode string

const (
	ImportDryRun  ImportMode = "dry_run"
	ImportCreate  ImportMode = "create"
	ImportUpdate  ImportMode = "update"
	ImportUpsert  ImportMode = "upsert"
)

type ImportRow struct {
	RowNumber int                    `json:"rowNumber"`
	Data      map[string]interface{} `json:"data"`
	Valid     bool                   `json:"valid"`
	Action    string                 `json:"action"` // create, update, skip, error
	Errors    []string               `json:"errors,omitempty"`
}

type ImportResult struct {
	TotalRows int         `json:"totalRows"`
	ValidRows int         `json:"validRows"`
	Created   int         `json:"created"`
	Updated   int         `json:"updated"`
	Failed    int         `json:"failed"`
	Skipped   int         `json:"skipped"`
	Rows      []ImportRow `json:"rows"`
}

var slugRegex = regexp.MustCompile(`[^a-z0-9-]+`)

func generateSlug(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	slug = slugRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = fmt.Sprintf("product-%d", time.Now().UnixMilli())
	}
	return slug
}

// ParseCSV parses a CSV file into rows of data.
func ParseCSV(reader io.Reader) ([]map[string]string, error) {
	r := csv.NewReader(reader)
	r.TrimLeadingSpace = true
	r.LazyQuotes = true

	headers, err := r.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV headers: %w", err)
	}

	for i := range headers {
		headers[i] = strings.TrimSpace(headers[i])
	}

	var rows []map[string]string
	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // Skip malformed rows
		}

		row := make(map[string]string)
		for i, val := range record {
			if i < len(headers) {
				row[headers[i]] = strings.TrimSpace(val)
			}
		}
		rows = append(rows, row)
	}

	return rows, nil
}

// ParseJSONProducts parses a JSON array of product objects.
func ParseJSONProducts(reader io.Reader) ([]map[string]interface{}, error) {
	var products []map[string]interface{}
	decoder := json.NewDecoder(reader)
	if err := decoder.Decode(&products); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}
	return products, nil
}

// ValidateAndImportProducts validates and optionally imports products.
func ValidateAndImportProducts(rows []map[string]interface{}, mode ImportMode, adminUserID uint) (*ImportResult, error) {
	result := &ImportResult{
		TotalRows: len(rows),
		Rows:      make([]ImportRow, 0, len(rows)),
	}

	// Use a transaction for non-dry-run imports to ensure atomicity
	var tx *gorm.DB
	if mode != ImportDryRun {
		tx = config.DB.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()
	} else {
		tx = config.DB // Use read-only or standard DB for dry run
	}

	for i, row := range rows {
		importRow := ImportRow{
			RowNumber: i + 1,
			Data:      row,
			Valid:     true,
			Action:    "skip",
		}

		// Validate required fields
		title := getStringField(row, "title")
		if title == "" {
			importRow.Valid = false
			importRow.Errors = append(importRow.Errors, "title is required")
		}

		priceStr := getStringField(row, "price")
		price, err := strconv.ParseFloat(priceStr, 64)
		if err != nil && priceStr != "" {
			importRow.Valid = false
			importRow.Errors = append(importRow.Errors, "invalid price format")
		}

		slug := getStringField(row, "slug")
		if slug == "" && title != "" {
			slug = generateSlug(title)
			row["slug"] = slug
		}

		// Check for duplicate slug
		if slug != "" {
			var existing models.Product
			existsErr := tx.Where("slug = ?", slug).First(&existing).Error

			if existsErr == nil {
				// Product exists
				switch mode {
				case ImportCreate:
					importRow.Action = "skip"
					importRow.Errors = append(importRow.Errors, "product with this slug already exists")
					result.Skipped++
				case ImportUpdate, ImportUpsert:
					importRow.Action = "update"
					row["_existing_id"] = existing.ID
				default:
					importRow.Action = "skip"
				}
			} else if errors.Is(existsErr, gorm.ErrRecordNotFound) {
				switch mode {
				case ImportUpdate:
					importRow.Action = "skip"
					importRow.Errors = append(importRow.Errors, "product not found for update")
					result.Skipped++
				default:
					importRow.Action = "create"
				}
			}
		}

		if !importRow.Valid {
			importRow.Action = "error"
			result.Failed++
		} else {
			result.ValidRows++
		}

		// If not dry-run and valid, execute the import
		if mode != ImportDryRun && importRow.Valid && importRow.Action != "skip" {
			product := models.Product{
				Title:       title,
				Slug:        slug,
				Description: getStringField(row, "shortDescription"),
				LongDescription: getStringField(row, "fullDescription"),
				Price:       price,
				Category:    getStringField(row, "category"),
				StatusFlags: getStringFieldDefault(row, "status", "active"),
				Image:       getStringField(row, "thumbnail"),
				LiveDemo:    getStringField(row, "previewUrl"),
				FileURL:     getStringField(row, "fileUrl"),
				Version:     getStringFieldDefault(row, "version", "1.0.0"),
				
				// New Storage Support
				StorageProvider:  getStringField(row, "storageProvider"),
				StorageKey:       getStringField(row, "storageKey"),
				OriginalFilename: getStringField(row, "originalFilename"),
			}

			productType := getStringFieldDefault(row, "productType", "template")
			product.Type = models.ProductType(productType)

			// Handle category relation
			if catName := getStringField(row, "category"); catName != "" {
				var cat models.ProductCategory
				if tx.Where("slug = ? OR name = ?", strings.ToLower(catName), catName).First(&cat).Error == nil {
					product.CategoryID = &cat.ID
				}
			}

			switch importRow.Action {
			case "update":
				if existingID, ok := row["_existing_id"].(uint); ok {
					product.ID = existingID
					if err := tx.Model(&product).Updates(product).Error; err != nil {
						tx.Rollback()
						return nil, fmt.Errorf("failed to update row %d: %w", i+1, err)
					}
					result.Updated++
				}
			case "create":
				product.AuthorID = adminUserID
				if err := tx.Create(&product).Error; err != nil {
					tx.Rollback()
					return nil, fmt.Errorf("failed to create row %d: %w", i+1, err)
				}
				result.Created++
			}

			// Handle tags — create and associate with product
			if tagsStr := getStringField(row, "tags"); tagsStr != "" && product.ID > 0 {
				tagNames := strings.Split(tagsStr, ",")
				var tags []models.Tag
				for _, tn := range tagNames {
					tn = strings.TrimSpace(tn)
					if tn == "" {
						continue
					}
					var tag models.Tag
					tx.Where("name = ?", tn).FirstOrCreate(&tag, models.Tag{Name: tn})
					tags = append(tags, tag)
				}
				if len(tags) > 0 {
					tx.Model(&product).Association("Tags").Replace(tags)
				}
			}
		}

		result.Rows = append(result.Rows, importRow)
	}

	// Commit the transaction if we are in an active import mode
	if mode != ImportDryRun {
		if err := tx.Commit().Error; err != nil {
			return nil, fmt.Errorf("failed to commit import batch: %w", err)
		}
	}

	return result, nil
}

// CSVRowsToGenericMaps converts CSV string maps to generic interface maps.
func CSVRowsToGenericMaps(rows []map[string]string) []map[string]interface{} {
	out := make([]map[string]interface{}, len(rows))
	for i, row := range rows {
		m := make(map[string]interface{})
		for k, v := range row {
			m[k] = v
		}
		out[i] = m
	}
	return out
}

func getStringField(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		switch val := v.(type) {
		case string:
			return strings.TrimSpace(val)
		case float64:
			return strconv.FormatFloat(val, 'f', -1, 64)
		default:
			return fmt.Sprintf("%v", val)
		}
	}
	return ""
}

func getStringFieldDefault(m map[string]interface{}, key string, def string) string {
	v := getStringField(m, key)
	if v == "" {
		return def
	}
	return v
}
