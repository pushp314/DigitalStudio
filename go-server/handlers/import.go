package handlers

import (
	"bytes"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
)

// AdminImportProducts handles CSV or JSON product import.
func AdminImportProducts(c *gin.Context) {
	mode := services.ImportMode(c.DefaultPostForm("mode", "dry_run"))
	fileType := c.DefaultPostForm("fileType", "csv")
	adminUserID := c.GetUint("userID")

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "File upload required")
		return
	}
	defer file.Close()

	// Read file content
	data, err := io.ReadAll(file)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to read file")
		return
	}

	var rows []map[string]interface{}

	switch fileType {
	case "csv":
		csvRows, err := services.ParseCSV(bytes.NewReader(data))
		if err != nil {
			respondError(c, http.StatusBadRequest, "Failed to parse CSV: "+err.Error())
			return
		}
		rows = services.CSVRowsToGenericMaps(csvRows)
	case "json":
		jsonRows, err := services.ParseJSONProducts(bytes.NewReader(data))
		if err != nil {
			respondError(c, http.StatusBadRequest, "Failed to parse JSON: "+err.Error())
			return
		}
		rows = jsonRows
	default:
		respondError(c, http.StatusBadRequest, "Unsupported file type. Use 'csv' or 'json'.")
		return
	}

	result, err := services.ValidateAndImportProducts(rows, mode, adminUserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Import failed: "+err.Error())
		return
	}

	// Record import job
	job := models.ImportJob{
		AdminUserID: adminUserID,
		FileName:    header.Filename,
		FileType:    fileType,
		Mode:        string(mode),
		TotalRows:   result.TotalRows,
		ValidRows:   result.ValidRows,
		Created:     result.Created,
		Updated:     result.Updated,
		Failed:      result.Failed,
		Skipped:     result.Skipped,
		Status:      "completed",
	}

	// Collect errors for storage
	var errorDetails []map[string]interface{}
	for _, row := range result.Rows {
		if len(row.Errors) > 0 {
			errorDetails = append(errorDetails, map[string]interface{}{
				"row":    row.RowNumber,
				"errors": row.Errors,
				"data":   row.Data,
			})
		}
	}
	job.Errors = errorDetails

	config.DB.Create(&job)

	c.JSON(http.StatusOK, gin.H{
		"result": result,
		"jobId":  job.ID,
	})
}

// AdminGetImportHistory returns past import jobs.
func AdminGetImportHistory(c *gin.Context) {
	var jobs []models.ImportJob
	config.DB.Order("created_at desc").Limit(50).Find(&jobs)
	c.JSON(http.StatusOK, jobs)
}

// AdminGetImportJob returns a specific import job with errors.
func AdminGetImportJob(c *gin.Context) {
	id := c.Param("id")
	var job models.ImportJob
	if err := config.DB.First(&job, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Import job not found")
		return
	}
	c.JSON(http.StatusOK, job)
}

// AdminDownloadImportTemplate serves a sample CSV template.
func AdminDownloadImportTemplate(c *gin.Context) {
	csvContent := "title,slug,shortDescription,price,category,productType,status,thumbnail,fileUrl,previewUrl,tags,version\n"
	csvContent += "\"My App\",\"my-app\",\"A great app\",49.99,\"Templates\",\"template\",\"active\",\"https://example.com/thumb.jpg\",\"https://example.com/file.zip\",\"https://example.com/demo\",\"react,nextjs\",\"1.0.0\"\n"

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=product_import_template.csv")
	c.Header("Content-Length", strconv.Itoa(len(csvContent)))
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Write([]byte(csvContent))
}


