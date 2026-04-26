package handlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
	"net/http"
	"strconv"
	"strings"
	"time"
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
	// Audit Trail: Log the fulfillment of a secure download request
	services.WriteAuditLog(config.DB, services.AuditEvent{
		ActorUserID:  func() *uint { id := userID.(uint); return &id }(),
		EventType:    "asset.download_initiated",
		ResourceType: "product",
		ResourceID:   &product.ID,
		Message:      "Secure presigned URL generated for entitlement holder",
		Metadata: map[string]interface{}{
			"productId": product.ID,
			"title":     product.Title,
			"userRole":  c.GetString("userRole"),
		},
	})

	// Managed Storage Path (R2 / S3)
	if product.StorageKey != "" {
		url, err := services.Storage.GenerateSignedDownloadURL(c.Request.Context(), product.StorageKey, 15*time.Minute)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security payload"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"downloadUrl": url,
			"expiresIn":   "15m",
			"filename":    product.OriginalFilename,
		})
		return
	}

	// Legacy / External Fallback
	if product.FileURL != "" {
		c.JSON(http.StatusOK, gin.H{
			"downloadUrl": product.FileURL,
			"expiresIn":   "public_fallback",
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
	SEOTitle             string                  `json:"seoTitle"`
	SEODescription       string                  `json:"seoDescription"`
	OGImage              string                  `json:"ogImage"`
	Price                float64                 `json:"price"`
	Category             string                  `json:"category"`
	CategoryID           *uint                   `json:"categoryId"`
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
	ModerationStatus     models.ModerationStatus `json:"moderationStatus"`

	// Storage Fields
	StorageProvider  string `json:"storageProvider"`
	StorageKey       string `json:"storageKey"`
	OriginalFilename string `json:"originalFilename"`
	IsPrivateAsset   *bool  `json:"isPrivateAsset"`
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
	// Generate cache key from query params
	cacheKey := "products:list:" + c.Request.URL.RawQuery

	var cachedProducts []models.Product
	if err := services.Cache.Get(c.Request.Context(), cacheKey, &cachedProducts); err == nil {
		c.JSON(http.StatusOK, cachedProducts)
		return
	}

	keyword := strings.TrimSpace(c.Query("keyword"))
	category := strings.TrimSpace(c.Query("category"))
	categorySlug := strings.TrimSpace(c.Query("categorySlug"))
	priceMin := strings.TrimSpace(c.Query("priceMin"))
	priceMax := strings.TrimSpace(c.Query("priceMax"))
	productType := strings.TrimSpace(c.Query("productType"))
	statusFlag := strings.TrimSpace(c.Query("statusFlag"))
	featured := strings.EqualFold(c.Query("featured"), "true")
	includeAll := strings.EqualFold(c.Query("includeAll"), "true")
	limitValue := strings.TrimSpace(c.Query("limit"))
	pageValue := strings.TrimSpace(c.Query("page"))
	pageSizeValue := strings.TrimSpace(c.Query("pageSize"))
	techStack := strings.TrimSpace(c.Query("techStack"))

	var products []models.Product
	query := config.DB.Preload("Tags").Preload("CategoryRel")

	if !canViewAllProducts(c, includeAll) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}

	if keyword != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR long_description ILIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if categorySlug != "" {
		query = query.Joins("JOIN product_categories ON product_categories.id = products.category_id").Where("product_categories.slug = ?", categorySlug)
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
	if techStack != "" {
		query = query.Where("tech_stacks @> ?", fmt.Sprintf("[\"%s\"]", techStack))
	}

	// Pagination
	limit := 20
	if limitValue != "" {
		if l, err := strconv.Atoi(limitValue); err == nil && l > 0 {
			limit = l
		}
	}
	if pageSizeValue != "" {
		if ps, err := strconv.Atoi(pageSizeValue); err == nil && ps > 0 {
			limit = ps
		}
	}

	page := 1
	if pageValue != "" {
		if p, err := strconv.Atoi(pageValue); err == nil && p > 0 {
			page = p
		}
	}

	offset := (page - 1) * limit
	query = query.Limit(limit).Offset(offset)

	if err := query.Order("created_at desc").Find(&products).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	enrichProducts(&products)

	// Cache result (TTL 5 minutes for lists as they are more dynamic)
	_ = services.Cache.Set(c.Request.Context(), cacheKey, products, 5*time.Minute)

	c.JSON(http.StatusOK, products)
}

func GetOwnedProducts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var products []models.Product
	config.DB.Model(&models.Product{}).
		Preload("CategoryRel").
		Select("products.*").
		Joins("JOIN order_items ON order_items.product_id = products.id").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.user_id = ? AND (orders.payment_status = ? OR orders.status = ?)", userID, "paid", "paid").
		Group("products.id").
		Find(&products)

	enrichProducts(&products)
	c.JSON(http.StatusOK, products)
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")
	cacheKey := "product:" + id

	var product models.Product
	// Try cache first
	if err := services.Cache.Get(c.Request.Context(), cacheKey, &product); err == nil {
		c.JSON(http.StatusOK, product)
		return
	}

	query := config.DB.Preload("Tags").Preload("CategoryRel")
	if !canViewAllProducts(c, strings.EqualFold(c.Query("includeAll"), "true")) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}
	if err := query.First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	enrichProduct(&product)

	// Save to cache (TTL 30 minutes)
	_ = services.Cache.Set(c.Request.Context(), cacheKey, product, 30*time.Minute)

	c.JSON(http.StatusOK, product)
}

func GetProductBySlug(c *gin.Context) {
	productSlug := strings.TrimSpace(c.Param("slug"))
	if productSlug == "" {
		respondError(c, http.StatusBadRequest, "Product slug is required")
		return
	}

	cacheKey := "product:slug:" + productSlug
	var product models.Product
	if err := services.Cache.Get(c.Request.Context(), cacheKey, &product); err == nil {
		c.JSON(http.StatusOK, product)
		return
	}

	query := config.DB.Preload("Tags").Preload("CategoryRel")
	if !canViewAllProducts(c, strings.EqualFold(c.Query("includeAll"), "true")) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}
	if err := query.Where("slug = ?", productSlug).First(&product).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	enrichProduct(&product)
	_ = services.Cache.Set(c.Request.Context(), cacheKey, product, 30*time.Minute)

	c.JSON(http.StatusOK, product)
}

func CreateProduct(c *gin.Context) {
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	isAdmin := userRole == models.RoleAdmin

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
		AuthorID:             userID.(uint),
		Title:                req.Title,
		Slug:                 productSlug,
		Description:          req.Description,
		LongDescription:      req.LongDescription,
		SEOTitle:             req.SEOTitle,
		SEODescription:       req.SEODescription,
		OGImage:              req.OGImage,
		Price:                req.Price,
		Category:             req.Category,
		CategoryID:           req.CategoryID,
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

		// Storage fields
		StorageProvider:  req.StorageProvider,
		StorageKey:       req.StorageKey,
		OriginalFilename: req.OriginalFilename,
	}
	if req.IsPrivateAsset != nil {
		product.IsPrivateAsset = *req.IsPrivateAsset
	}

	if product.Type == "" {
		product.Type = models.ProductTypeTemplate
	}

	// Governance: Non-admins are forced into Pending status
	if !isAdmin {
		product.ModerationStatus = models.ModStatusPending
		product.StatusFlags = "active" // Default start
		product.RevenueShare = 0       // Must be set by admin
	} else {
		product.ModerationStatus = models.ModStatusApproved // Admins bypass
		if strings.TrimSpace(product.StatusFlags) == "" {
			product.StatusFlags = "active"
		}
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

	// Invalidate caches
	_ = services.Cache.InvalidateByPrefix(c.Request.Context(), "products:list")

	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	isAdmin := userRole == models.RoleAdmin

	var product models.Product
	if err := config.DB.Preload("Tags").First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	// Governance: Only Author or Admin can update
	if product.AuthorID != userID.(uint) && !isAdmin {
		respondError(c, http.StatusForbidden, "You do not have authorization to modify this digital asset.")
		return
	}
	oldSlug := product.Slug

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
	product.SEOTitle = req.SEOTitle
	product.SEODescription = req.SEODescription
	product.OGImage = req.OGImage
	if req.Price != 0 {
		product.Price = req.Price
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.CategoryID != nil {
		product.CategoryID = req.CategoryID
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
	if req.StorageProvider != "" {
		product.StorageProvider = req.StorageProvider
	}
	if req.StorageKey != "" {
		product.StorageKey = req.StorageKey
	}
	if req.OriginalFilename != "" {
		product.OriginalFilename = req.OriginalFilename
	}
	if req.IsPrivateAsset != nil {
		product.IsPrivateAsset = *req.IsPrivateAsset
	}

	// Governance: Authors can unpublish (set to pending), but only admins can approve
	if req.ModerationStatus != "" {
		if isAdmin {
			product.ModerationStatus = req.ModerationStatus
		} else if req.ModerationStatus == models.ModStatusPending {
			product.ModerationStatus = models.ModStatusPending
		}
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

	// Invalidate caches
	_ = services.Cache.Delete(c.Request.Context(), "product:"+id)
	_ = services.Cache.Delete(c.Request.Context(), "product:slug:"+oldSlug)
	_ = services.Cache.Delete(c.Request.Context(), "product:slug:"+product.Slug)
	_ = services.Cache.InvalidateByPrefix(c.Request.Context(), "products:list")

	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")
	isAdmin := userRole == models.RoleAdmin

	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	// Governance: Only Author or Admin can delete
	if product.AuthorID != userID.(uint) && !isAdmin {
		respondError(c, http.StatusForbidden, "Unauthorized deletion attempt. Logged.")
		return
	}

	if err := config.DB.Delete(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Invalidate caches
	_ = services.Cache.Delete(c.Request.Context(), "product:"+id)
	_ = services.Cache.Delete(c.Request.Context(), "product:slug:"+product.Slug)
	_ = services.Cache.InvalidateByPrefix(c.Request.Context(), "products:list")

	c.JSON(http.StatusOK, gin.H{"message": "Product record purged successfully"})
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
