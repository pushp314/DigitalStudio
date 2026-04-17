package seeder

import (
	"log"
	"os"

	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"golang.org/x/crypto/bcrypt"
)

func Run() {
	if os.Getenv("ENABLE_SEEDER") != "true" {
		log.Println("Seeder disabled. Set ENABLE_SEEDER=true to seed default data.")
		return
	}

	var count int64
	config.DB.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&count)
	
	if count == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin := models.User{
			Name:     "Admin User",
			Email:    "admin@digitalstudio.com",
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		}
		if err := config.DB.Create(&admin).Error; err != nil {
			log.Println("Failed to create admin seeder:", err)
		} else {
			log.Println("Admin user created: admin@digitalstudio.com / admin123")
		}
	}
	
	var configCount int64
	config.DB.Model(&models.SiteConfig{}).Count(&configCount)
	if configCount == 0 {
		siteConfig := models.SiteConfig{
			HeroTitle:           "Building quality templates",
			HeroSubtitle:        "Ship your startup faster.",
			AnnouncementMessage: "🚀 We have migrated to Go!",
			ShowAnnouncement:    true,
			SupportEmail:        "support@digitalstudio.com",
			Features: map[string]bool{
				"saas": true,
				"docs": true,
				"hub":  true,
			},
		}
		config.DB.Create(&siteConfig)
		log.Println("Site config seeded")
	}
}
