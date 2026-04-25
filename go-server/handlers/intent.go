package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

// Service Intents

func GetServiceIntents(c *gin.Context) {
	var intents []models.ServiceIntent
	config.DB.Where("is_active = ?", true).Order("sort_order asc").Find(&intents)
	c.JSON(http.StatusOK, intents)
}

func GetServiceIntentBySlug(c *gin.Context) {
	var intent models.ServiceIntent
	slug := c.Param("slug")
	if err := config.DB.Where("slug = ?", slug).First(&intent).Error; err != nil {
		respondError(c, http.StatusNotFound, "Service intent not found")
		return
	}
	c.JSON(http.StatusOK, intent)
}

// Expert Intents

func GetExpertIntents(c *gin.Context) {
	var intents []models.ExpertIntent
	config.DB.Where("is_active = ?", true).Order("sort_order asc").Find(&intents)
	c.JSON(http.StatusOK, intents)
}

func GetExpertIntentBySlug(c *gin.Context) {
	var intent models.ExpertIntent
	slug := c.Param("slug")
	if err := config.DB.Where("slug = ?", slug).First(&intent).Error; err != nil {
		respondError(c, http.StatusNotFound, "Expert intent not found")
		return
	}
	c.JSON(http.StatusOK, intent)
}

// Admin Operations

func CreateServiceIntent(c *gin.Context) {
	var intent models.ServiceIntent
	if err := c.ShouldBindJSON(&intent); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := config.DB.Create(&intent).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create service intent")
		return
	}
	c.JSON(http.StatusCreated, intent)
}

func UpdateServiceIntent(c *gin.Context) {
	id := c.Param("id")
	var intent models.ServiceIntent
	if err := config.DB.First(&intent, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Service intent not found")
		return
	}
	if err := c.ShouldBindJSON(&intent); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	config.DB.Save(&intent)
	c.JSON(http.StatusOK, intent)
}

func CreateExpertIntent(c *gin.Context) {
	var intent models.ExpertIntent
	if err := c.ShouldBindJSON(&intent); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := config.DB.Create(&intent).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create expert intent")
		return
	}
	c.JSON(http.StatusCreated, intent)
}

func UpdateExpertIntent(c *gin.Context) {
	id := c.Param("id")
	var intent models.ExpertIntent
	if err := config.DB.First(&intent, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Expert intent not found")
		return
	}
	if err := c.ShouldBindJSON(&intent); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	config.DB.Save(&intent)
	c.JSON(http.StatusOK, intent)
}
