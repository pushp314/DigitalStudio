package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func ListProducts(c *gin.Context) {
	keyword := c.Query("keyword")
	category := c.Query("category")
	priceMin := c.Query("priceMin")
	priceMax := c.Query("priceMax")

	var products []models.Product
	query := config.DB.Preload("Tags")

	if keyword != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if priceMin != "" {
		query = query.Where("price >= ?", priceMin)
	}
	if priceMax != "" {
		query = query.Where("price <= ?", priceMax)
	}

	if err := query.Find(&products).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	enrichProducts(&products)
	c.JSON(http.StatusOK, products)
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.Preload("Tags").First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	enrichProduct(&product)
	c.JSON(http.StatusOK, product)
}

type CreateProductReq struct {
	Title                string             `json:"title" binding:"required"`
	Slug                 string             `json:"slug"`
	Description          string             `json:"description"`
	LongDescription      string             `json:"longDescription"`
	Price                float64            `json:"price"`
	Category             string             `json:"category"`
	Type                 models.ProductType `json:"productType"`
	StatusFlags          string             `json:"statusFlags"`
	Image                string             `json:"image"`
	LiveDemo             string             `json:"liveDemo"`
	GithubRepo           string             `json:"githubRepo"`
	FileURL              string             `json:"fileURL"`
	Version              string             `json:"version"`
	RequiresSubscription bool               `json:"requiresSubscription"`
	TechStacks           []string           `json:"techStack"`
	Documentation        []string           `json:"documentation"`
	Tags                 []string           `json:"tags"`
	PreviewImages        []string           `json:"previewImages"`
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
		TechStacks:           req.TechStacks,
		Documentation:        req.Documentation,
		PreviewImages:        req.PreviewImages,
	}

	if product.Type == "" {
		product.Type = models.ProductTypeTemplate
	}

	for _, tagName := range req.Tags {
		var tag models.Tag
		config.DB.FirstOrCreate(&tag, models.Tag{Name: tagName})
		product.Tags = append(product.Tags, tag)
	}

	if err := config.DB.Create(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
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

	if req.Title != "" { product.Title = req.Title }
	if req.Slug != "" { product.Slug = req.Slug }
	if req.Description != "" { product.Description = req.Description }
	if req.LongDescription != "" { product.LongDescription = req.LongDescription }
	if req.Price != 0 { product.Price = req.Price }
	if req.Category != "" { product.Category = req.Category }
	if req.Type != "" { product.Type = req.Type }
	if req.StatusFlags != "" { product.StatusFlags = req.StatusFlags }
	if req.Image != "" { product.Image = req.Image }
	if req.LiveDemo != "" { product.LiveDemo = req.LiveDemo }
	if req.GithubRepo != "" { product.GithubRepo = req.GithubRepo }
	if req.FileURL != "" { product.FileURL = req.FileURL }
	if req.Version != "" { product.Version = req.Version }
	product.RequiresSubscription = req.RequiresSubscription
	product.TechStacks = req.TechStacks
	product.Documentation = req.Documentation
	product.PreviewImages = req.PreviewImages

	if len(req.Tags) > 0 {
		var newTags []models.Tag
		for _, tagName := range req.Tags {
			var tag models.Tag
			config.DB.FirstOrCreate(&tag, models.Tag{Name: tagName})
			newTags = append(newTags, tag)
		}
		config.DB.Model(&product).Association("Tags").Replace(newTags)
	}

	if err := config.DB.Save(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
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

type reviewMetric struct {
	ProductID  uint
	Rating     float64
	NumReviews int64
}

type salesMetric struct {
	ProductID uint
	NumSales  int64
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
		Where("product_id IN ?", productIDs).
		Group("product_id").
		Scan(&reviewMetrics)

	var salesMetrics []salesMetric
	config.DB.Model(&models.OrderItem{}).
		Select("product_id, sum(quantity) as num_sales").
		Where("product_id IN ?", productIDs).
		Group("product_id").
		Scan(&salesMetrics)

	reviewMap := make(map[uint]reviewMetric, len(reviewMetrics))
	for _, metric := range reviewMetrics {
		reviewMap[metric.ProductID] = metric
	}

	salesMap := make(map[uint]int64, len(salesMetrics))
	for _, metric := range salesMetrics {
		salesMap[metric.ProductID] = metric.NumSales
	}

	for idx := range *products {
		product := &(*products)[idx]
		if metric, ok := reviewMap[product.ID]; ok {
			product.Rating = metric.Rating
			product.NumReviews = metric.NumReviews
		}
		product.NumSales = salesMap[product.ID]
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
