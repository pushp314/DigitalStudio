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
			&models.Post{},
		)
		if err != nil {
			log.Fatal("Failed to auto-migrate database:", err)
		}
		log.Println("AutoMigrate enabled for this environment")
		return
	}

	log.Println("Skipping AutoMigrate. Apply versioned SQL migrations before starting the API.")
}
