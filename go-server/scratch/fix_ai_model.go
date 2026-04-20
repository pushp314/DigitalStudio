package main

import (
	"log"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func main() {
	config.ConnectDB()
	
	var siteConfig models.SiteConfig
	if err := config.DB.First(&siteConfig).Error; err != nil {
		log.Fatalf("Failed to fetch SiteConfig: %v", err)
	}
	
	siteConfig.AISettings.Model = "qwen3.5:2b"
	
	if err := config.DB.Save(&siteConfig).Error; err != nil {
		log.Fatalf("Failed to update AI model: %v", err)
	}
	
	log.Println("✅ AI Model updated to qwen3.5:2b")
}
