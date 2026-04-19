package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/pushp314/digitalstudio/go-server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("No .env file found")
	}

	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Migrating showcases table...")
	err = db.AutoMigrate(&models.Showcase{})
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Migration successful")
}
