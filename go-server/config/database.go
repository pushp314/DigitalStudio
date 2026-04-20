package config

import (
	"log"
	"os"

	"github.com/pushp314/digitalstudio/go-server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if os.Getenv("ENABLE_AUTOMIGRATE") == "true" {
		if os.Getenv("APP_ENV") == "production" {
			log.Fatal("ENABLE_AUTOMIGRATE must remain disabled in production")
		}

		err = DB.AutoMigrate(
			&models.User{},
			&models.Tag{},
			&models.Product{},
			&models.Order{},
			&models.OrderItem{},
			&models.SiteConfig{},
			&models.PremiumDoc{},
			&models.Review{},
			&models.License{},
			&models.Testimonial{},
			&models.Coupon{},
			&models.Showcase{},
			&models.ContactInquiry{},
			&models.ChatMessage{},
			&models.AuditLog{},
		)
		if err != nil {
			log.Fatal("Failed to auto-migrate database:", err)
		}
		log.Println("✅ AutoMigrate: Verified schema for all models (including ChatMessage)")
		log.Println("AutoMigrate enabled for this environment")
		return
	}

	log.Println("Skipping AutoMigrate. Apply versioned SQL migrations before starting the API.")
}
