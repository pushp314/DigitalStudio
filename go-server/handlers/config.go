package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func GetConfig(c *gin.Context) {
	var siteConfig models.SiteConfig
	if err := config.DB.First(&siteConfig).Error; err != nil {
		siteConfig = models.SiteConfig{
			HeroTitle:           "Welcome to DigitalStudio",
			HeroSubtitle:        "Ship your startup faster.",
			AnnouncementMessage: "Welcome!",
			ShowAnnouncement:    true,
			SupportEmail:        "support@example.com",
			Features: map[string]bool{
				"saas": true,
				"docs": true,
				"hub":  true,
			},
		}
		config.DB.Create(&siteConfig)
	}

	c.JSON(http.StatusOK, siteConfig)
}

type UpdateConfigReq struct {
	HeroTitle           string          `json:"heroTitle"`
	HeroSubtitle        string          `json:"heroSubtitle"`
	AnnouncementMessage string          `json:"announcementMessage"`
	ShowAnnouncement    bool            `json:"showAnnouncement"`
	SupportEmail        string          `json:"supportEmail"`
	Features            map[string]bool `json:"features"`
}

func UpdateConfig(c *gin.Context) {
	var siteConfig models.SiteConfig
	if err := config.DB.First(&siteConfig).Error; err != nil {
		respondError(c, http.StatusNotFound, "Config not found")
		return
	}

	var req UpdateConfigReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.HeroTitle != "" { siteConfig.HeroTitle = req.HeroTitle }
	if req.HeroSubtitle != "" { siteConfig.HeroSubtitle = req.HeroSubtitle }
	if req.AnnouncementMessage != "" { siteConfig.AnnouncementMessage = req.AnnouncementMessage }
	siteConfig.ShowAnnouncement = req.ShowAnnouncement
	if req.SupportEmail != "" { siteConfig.SupportEmail = req.SupportEmail }

	if req.Features != nil {
		siteConfig.Features = req.Features
	}

	if err := config.DB.Save(&siteConfig).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, siteConfig)
}
