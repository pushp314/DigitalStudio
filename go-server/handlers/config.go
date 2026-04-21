package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

type UpdateConfigReq struct {
	HeroTitle           string                   `json:"heroTitle"`
	HeroSubtitle        string                   `json:"heroSubtitle"`
	HeroImages          []string                 `json:"heroImages"`
	HeroVisualEffect    string                   `json:"heroVisualEffect"`
	Announcements       []string                 `json:"announcements"`
	CarouselStack       []models.CarouselItem    `json:"carouselStack"`
	ShowAnnouncement    bool                     `json:"showAnnouncement"`
	SupportEmail        string                   `json:"supportEmail"`
	Features            map[string]bool          `json:"features"`
	MemberPlans         []models.MemberPlan      `json:"memberPlans"`
	FAQs                []models.FAQItem         `json:"faqs"`
	SocialProof         models.SocialProofConfig `json:"socialProof"`
	ShowcaseItems       []models.ShowcaseItem    `json:"showcaseItems"`
	Contact             models.ContactConfig     `json:"contact"`
	AISettings          models.AISettings        `json:"aiSettings"`
	MaintenanceMode     bool                     `json:"maintenanceMode"`
	MaintenanceMessage  string                   `json:"maintenanceMessage"`
}

func defaultSiteConfig() models.SiteConfig {
	return models.SiteConfig{
		HeroTitle:           "Buy ready apps. Customize them. Or let us build for you.",
		HeroSubtitle:        "Skip months of development with production-ready apps, technical guides, expert help, and custom build support in one place.",
		Announcements: []string{
			"New ready apps and product kits are live.",
			"Pro members get priority support and premium implementation guides.",
			"Need help choosing? Talk to an expert before you buy.",
		},
		ShowAnnouncement:    true,
		SupportEmail:        "support@devnity.com",
		Features: map[string]bool{
			"docs":          true,
			"reviews":       true,
			"analytics":     true,
			"ai":            true,
			"payments":      true,
			"subscriptions": true,
			"licenses":      true,
			"testimonials":  true,
		},
		MemberPlans: []models.MemberPlan{
			{
				Name:       "Standard",
				Badge:      "Free",
				Price:      0,
				Period:     "forever",
				Features:   []string{"Browse ready apps", "Buy individual products", "Access free guides", "Use standard support"},
				ButtonText: "Explore Apps",
				IsPopular:  false,
				IsPrimary:  false,
			},
			{
				Name:       "Pro Membership",
				Badge:      "Most Popular",
				Price:      29,
				Period:     "month",
				Features:   []string{"Premium guides", "Priority support", "Community chat access", "Implementation help"},
				ButtonText: "Upgrade to Pro",
				IsPopular:  true,
				IsPrimary:  true,
			},
		},
		FAQs: []models.FAQItem{
			{
				Question: "Do purchases unlock downloads immediately?",
				Answer:   "Yes. Verified paid orders unlock downloads and any linked license keys automatically.",
			},
			{
				Question: "Can I preview products before buying?",
				Answer:   "Products can include live demos, galleries, videos, and code snippets directly from the product record.",
			},
			{
				Question: "How do premium docs work?",
				Answer:   "Premium docs can be unlocked by eligible plans or other entitlement rules configured by the platform.",
			},
		},
		SocialProof: models.SocialProofConfig{
			Rating:        "4.9/5",
			Summary:       "Trusted by builders who need production-ready systems",
			CreatorsLabel: "Used by founders, agencies, and technical teams",
			TrustedCompanies: []string{
				"Rise",
				"Sitemark",
				"PinPoint",
				"Product.",
			},
		},
		ShowcaseItems: []models.ShowcaseItem{
			{
				Title:       "Developer dashboards",
				Subtitle:    "Desktop-ready previews",
				Description: "Show admin surfaces, analytics, and purchase flows with real product screenshots.",
				Image:       "",
				Footer:      "Desktop preview",
			},
			{
				Title:       "Responsive storefronts",
				Subtitle:    "Mobile and tablet shots",
				Description: "Highlight how the same product looks across breakpoints using uploaded media.",
				Image:       "",
				Footer:      "Responsive preview",
			},
		},
		Contact: models.ContactConfig{
			Heading:    "Contact us",
			Subheading: "Questions about ready apps, docs, support, or custom work? Reach out and we will reply quickly.",
			Email:      "support@devnity.com",
			Address:    "Remote-first product studio",
			Phone:      "+91 00000 00000",
		},
		AISettings: models.AISettings{
			Enabled: true,
			Model:   "qwen3.5:2b",
		},
	}
}

func ensureSiteConfig() (models.SiteConfig, error) {
	var siteConfig models.SiteConfig
	if config.DB == nil {
		return defaultSiteConfig(), nil
	}
	
	// Force migrate to ensure FrontendURL column exists
	_ = config.DB.AutoMigrate(&models.SiteConfig{})

	if err := config.DB.First(&siteConfig).Error; err == nil {
		return siteConfig, nil
	}

	siteConfig = defaultSiteConfig()
	if err := config.DB.Create(&siteConfig).Error; err != nil {
		return models.SiteConfig{}, err
	}

	return siteConfig, nil
}

func sanitizeSiteConfig(siteConfig models.SiteConfig) models.SiteConfig {
	siteConfig.AISettings.APIKey = ""
	return siteConfig
}

func GetConfig(c *gin.Context) {
	siteConfig, err := ensureSiteConfig()
	if err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, sanitizeSiteConfig(siteConfig))
}

func GetAdminConfig(c *gin.Context) {
	siteConfig, err := ensureSiteConfig()
	if err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, siteConfig)
}

func UpdateConfig(c *gin.Context) {
	siteConfig, err := ensureSiteConfig()
	if err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	var req UpdateConfigReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if strings.TrimSpace(req.AISettings.APIKey) == "" {
		req.AISettings.APIKey = siteConfig.AISettings.APIKey
	}

	siteConfig.HeroTitle = req.HeroTitle
	siteConfig.HeroSubtitle = req.HeroSubtitle
	siteConfig.HeroImages = req.HeroImages
	siteConfig.HeroVisualEffect = req.HeroVisualEffect
	siteConfig.Announcements = req.Announcements
	siteConfig.CarouselStack = req.CarouselStack
	siteConfig.ShowAnnouncement = req.ShowAnnouncement
	siteConfig.SupportEmail = req.SupportEmail
	siteConfig.Features = req.Features
	siteConfig.MemberPlans = req.MemberPlans
	siteConfig.FAQs = req.FAQs
	siteConfig.SocialProof = req.SocialProof
	siteConfig.ShowcaseItems = req.ShowcaseItems
	siteConfig.Contact = req.Contact
	siteConfig.AISettings = req.AISettings
	siteConfig.MaintenanceMode = req.MaintenanceMode
	siteConfig.MaintenanceMessage = req.MaintenanceMessage

	if err := config.DB.Save(&siteConfig).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, siteConfig)
}
