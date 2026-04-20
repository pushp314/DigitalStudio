package handlers

import (
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
)

// ... (other handlers)

func DownloadSecureAsset(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	productID := c.Param("id")
	var product models.Product
	if err := config.DB.First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	// 1. Check if user is Pro
	if isPro, ok := c.Get("isPro"); ok && isPro == true {
		goto generateUrl
	}

	// 2. Check if user owned the product
	{
		var count int64
		config.DB.Table("order_items").
			Joins("JOIN orders ON orders.id = order_items.order_id").
			Where("order_items.product_id = ? AND orders.user_id = ? AND (orders.payment_status = ? OR orders.status = ?)", productID, userID, "paid", "paid").
			Count(&count)

		if count > 0 {
			goto generateUrl
		}
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "Active entitlement or purchase required for this asset"})
	return

generateUrl:
	if fileKey, managed := services.StorageKeyFromURL(product.FileURL); managed {
		if services.IsManagedPrivateAssetKey(fileKey) {
			url, err := services.GeneratePresignedURL(fileKey)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security payload"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"downloadUrl": url,
				"expiresIn":   "15m",
			})
			return
		}

		publicURL := strings.TrimSpace(product.FileURL)
		c.JSON(http.StatusOK, gin.H{
			"downloadUrl": publicURL,
			"expiresIn":   "public",
		})
		return
	}

	if parsed, err := url.Parse(strings.TrimSpace(product.FileURL)); err == nil && parsed.Scheme == "https" && parsed.Host != "" {
		c.JSON(http.StatusOK, gin.H{
			"downloadUrl": parsed.String(),
			"expiresIn":   "external",
		})
		return
	}

	c.JSON(http.StatusConflict, gin.H{"error": "Secure asset is not configured for managed delivery"})
}

type CreateProductReq struct {
	Title                string                  `json:"title" binding:"required"`
	Slug                 string                  `json:"slug"`
	Description          string                  `json:"description"`
	LongDescription      string                  `json:"longDescription"`
	Price                float64                 `json:"price"`
	Category             string                  `json:"category"`
	Type                 models.ProductType      `json:"productType"`
	StatusFlags          string                  `json:"statusFlags"`
	Image                string                  `json:"image"`
	LiveDemo             string                  `json:"liveDemo"`
	GithubRepo           string                  `json:"githubRepo"`
	FileURL              string                  `json:"fileURL"`
	Version              string                  `json:"version"`
	RequiresSubscription bool                    `json:"requiresSubscription"`
	VideoURL             string                  `json:"videoUrl"`
	CourseOutline        string                  `json:"courseOutline"`
	Duration             string                  `json:"duration"`
	SnippetLanguage      string                  `json:"snippetLanguage"`
	Snippet              string                  `json:"snippet"`
	TechStacks           []string                `json:"techStack"`
	Documentation        []string                `json:"documentation"`
	Tags                 []string                `json:"tags"`
	PreviewImages        []models.ProductPreview `json:"previewImages"`
	Features             []string                `json:"features"`
	Pages                []string                `json:"pages"`
}

type reviewMetric struct {
	ProductID  uint
	Rating     float64
	NumReviews int64
}

type salesMetric struct {
	ProductID uint
	NumSales  int64
	Revenue   float64
}

func ListProducts(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	category := strings.TrimSpace(c.Query("category"))
	priceMin := strings.TrimSpace(c.Query("priceMin"))
	priceMax := strings.TrimSpace(c.Query("priceMax"))
	productType := strings.TrimSpace(c.Query("productType"))
	statusFlag := strings.TrimSpace(c.Query("statusFlag"))
	featured := strings.EqualFold(c.Query("featured"), "true")
	includeAll := strings.EqualFold(c.Query("includeAll"), "true")
	limitValue := strings.TrimSpace(c.Query("limit"))

	var products []models.Product
	query := config.DB.Preload("Tags")

	if !canViewAllProducts(c, includeAll) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}

	if keyword != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR long_description ILIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if productType != "" {
		query = query.Where("type = ?", productType)
	}
	if priceMin != "" {
		query = query.Where("price >= ?", priceMin)
	}
	if priceMax != "" {
		query = query.Where("price <= ?", priceMax)
	}
	if featured {
		query = query.Where("status_flags ILIKE ?", "%featured%")
	}
	if statusFlag != "" {
		query = query.Where("status_flags ILIKE ?", "%"+statusFlag+"%")
	}
	if limitValue != "" {
		if limit, err := strconv.Atoi(limitValue); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	if err := query.Order("created_at desc").Find(&products).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	enrichProducts(&products)
	c.JSON(http.StatusOK, products)
}

func GetOwnedProducts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var productIDs []uint
	config.DB.Table("order_items").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.user_id = ? AND (orders.payment_status = ? OR orders.status = ?)", userID, "paid", "paid").
		Pluck("DISTINCT product_id", &productIDs)

	c.JSON(http.StatusOK, productIDs)
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	query := config.DB.Preload("Tags")
	if !canViewAllProducts(c, strings.EqualFold(c.Query("includeAll"), "true")) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}
	if err := query.First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	enrichProduct(&product)
	c.JSON(http.StatusOK, product)
}

func CreateProduct(c *gin.Context) {
	var req CreateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	productSlug := req.Slug
	if productSlug == "" {
		productSlug = slug.Make(req.Title)
	}

	product := models.Product{
		Title:                req.Title,
		Slug:                 productSlug,
		Description:          req.Description,
		LongDescription:      req.LongDescription,
		Price:                req.Price,
		Category:             req.Category,
		Type:                 req.Type,
		StatusFlags:          req.StatusFlags,
		Image:                req.Image,
		LiveDemo:             req.LiveDemo,
		GithubRepo:           req.GithubRepo,
		FileURL:              req.FileURL,
		Version:              req.Version,
		RequiresSubscription: req.RequiresSubscription,
		VideoURL:             req.VideoURL,
		CourseOutline:        req.CourseOutline,
		Duration:             req.Duration,
		SnippetLanguage:      req.SnippetLanguage,
		Snippet:              req.Snippet,
		TechStacks:           req.TechStacks,
		Documentation:        req.Documentation,
		PreviewImages:        req.PreviewImages,
		Features:             req.Features,
		Pages:                req.Pages,
	}

	if product.Type == "" {
		product.Type = models.ProductTypeTemplate
	}
	if strings.TrimSpace(product.StatusFlags) == "" {
		product.StatusFlags = "active"
	}

	applyProductTags(&product, req.Tags)

	if err := config.DB.Create(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	if len(product.Tags) > 0 {
		if err := config.DB.Model(&product).Association("Tags").Replace(product.Tags); err != nil {
			respondError(c, http.StatusInternalServerError, err.Error())
			return
		}
	}

	enrichProduct(&product)
	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.Preload("Tags").First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	var req CreateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Title != "" {
		product.Title = req.Title
	}
	if req.Slug != "" {
		product.Slug = req.Slug
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.LongDescription != "" {
		product.LongDescription = req.LongDescription
	}
	if req.Price != 0 {
		product.Price = req.Price
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.Type != "" {
		product.Type = req.Type
	}
	if req.StatusFlags != "" {
		product.StatusFlags = req.StatusFlags
	}
	if req.Image != "" {
		product.Image = req.Image
	}
	if req.LiveDemo != "" {
		product.LiveDemo = req.LiveDemo
	}
	if req.GithubRepo != "" {
		product.GithubRepo = req.GithubRepo
	}
	if req.FileURL != "" {
		product.FileURL = req.FileURL
	}
	if req.Version != "" {
		product.Version = req.Version
	}
	product.RequiresSubscription = req.RequiresSubscription
	product.VideoURL = req.VideoURL
	product.CourseOutline = req.CourseOutline
	product.Duration = req.Duration
	product.SnippetLanguage = req.SnippetLanguage
	product.Snippet = req.Snippet
	product.TechStacks = req.TechStacks
	product.Documentation = req.Documentation
	product.PreviewImages = req.PreviewImages
	product.Features = req.Features
	product.Pages = req.Pages

	if req.Tags != nil {
		applyProductTags(&product, req.Tags)
	}

	if err := config.DB.Save(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	if req.Tags != nil {
		if err := config.DB.Model(&product).Association("Tags").Replace(product.Tags); err != nil {
			respondError(c, http.StatusInternalServerError, err.Error())
			return
		}
	}

	enrichProduct(&product)
	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Product{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

func applyProductTags(product *models.Product, tagNames []string) {
	if product == nil {
		return
	}
	if len(tagNames) == 0 {
		product.Tags = nil
		return
	}

	product.Tags = nil
	for _, tagName := range tagNames {
		trimmed := strings.TrimSpace(tagName)
		if trimmed == "" {
			continue
		}
		var tag models.Tag
		config.DB.FirstOrCreate(&tag, models.Tag{Name: trimmed})
		product.Tags = append(product.Tags, tag)
	}
}

func canViewAllProducts(c *gin.Context, includeAll bool) bool {
	if !includeAll {
		return false
	}
	user, err := optionalAuthenticatedUser(c)
	if err != nil || user == nil {
		return false
	}

	return user.Role == models.RoleAdmin
}

func enrichProducts(products *[]models.Product) {
	if products == nil || len(*products) == 0 {
		return
	}

	productIDs := make([]uint, 0, len(*products))
	for idx := range *products {
		product := &(*products)[idx]
		product.PreviewURL = product.LiveDemo
		productIDs = append(productIDs, product.ID)
	}

	var reviewMetrics []reviewMetric
	config.DB.Model(&models.Review{}).
		Select("product_id, avg(rating) as rating, count(*) as num_reviews").
		Where("product_id IN ? AND status = ?", productIDs, "approved").
		Group("product_id").
		Scan(&reviewMetrics)

	var salesMetrics []salesMetric
	config.DB.Table("order_items").
		Select("order_items.product_id, sum(order_items.quantity) as num_sales, sum(order_items.price * order_items.quantity) as revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("order_items.product_id IN ? AND (orders.payment_status = ? OR orders.status = ?)", productIDs, "paid", "paid").
		Group("order_items.product_id").
		Scan(&salesMetrics)

	reviewMap := make(map[uint]reviewMetric, len(reviewMetrics))
	for _, metric := range reviewMetrics {
		reviewMap[metric.ProductID] = metric
	}

	salesMap := make(map[uint]salesMetric, len(salesMetrics))
	for _, metric := range salesMetrics {
		salesMap[metric.ProductID] = metric
	}

	for idx := range *products {
		product := &(*products)[idx]
		if metric, ok := reviewMap[product.ID]; ok {
			product.Rating = metric.Rating
			product.NumReviews = metric.NumReviews
		}
		if metric, ok := salesMap[product.ID]; ok {
			product.NumSales = metric.NumSales
			product.Revenue = metric.Revenue
		}
	}
}

func enrichProduct(product *models.Product) {
	if product == nil {
		return
	}

	products := []models.Product{*product}
	enrichProducts(&products)
	*product = products[0]
}
