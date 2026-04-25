package config

import (
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strings"
)

type Config struct {
	AppEnv            string
	DatabaseURL       string
	LicenseSigningKey []byte
	RazorpayKeyID     string
	RazorpayKeySecret string
	RazorpayWebhookSecret string
	
	// Email Config
	EmailProvider     string // "resend" or "smtp"
	EmailFrom         string
	SMTPHost          string
	SMTPPort          string
	SMTPUser          string
	SMTPPass          string

	// Storage Config
	StorageProvider   string // "r2" or "local"
	R2AccountID       string
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2Bucket          string
	R2Endpoint        string
	
	// Redis Config
	RedisURL          string
	RedisPassword     string
	RedisDB           int
	
	// Frontend URL for email links
	FrontendURL       string
}

var AppConfig Config

func LoadConfig() {
	AppConfig = Config{
		AppEnv:            getEnv("APP_ENV", "development"),
		DatabaseURL:       getEnv("DATABASE_URL", ""),
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),
		RazorpayWebhookSecret: getEnv("RAZORPAY_WEBHOOK_SECRET", ""),
		
		EmailProvider:     getEnv("EMAIL_PROVIDER", "stdout"),
		EmailFrom:         getEnv("EMAIL_FROM", "noreply@bizcode.appnity.co.in"),
		SMTPHost:          getEnv("SMTP_HOST", ""),
		SMTPPort:          getEnv("SMTP_PORT", ""),
		SMTPUser:          getEnv("SMTP_USER", ""),
		SMTPPass:          getEnv("SMTP_PASS", ""),

		StorageProvider:   getEnv("STORAGE_PROVIDER", "local"),
		R2AccountID:       getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2Bucket:          getEnv("R2_BUCKET", ""),
		R2Endpoint:        getEnv("R2_ENDPOINT", ""),

		RedisURL:          getEnv("REDIS_URL", ""),
		RedisPassword:     getEnv("REDIS_PASSWORD", ""),
		RedisDB:           getEnvInt("REDIS_DB", 0),
		
		FrontendURL:       getEnv("FRONTEND_URL", "https://bizcode.appnity.co.in"),
	}

	// Validate critical secrets for production
	if AppConfig.AppEnv == "production" {
		validateProductionConfig()
	}

	// Load License Signing Key
	seedHex := strings.TrimSpace(os.Getenv("LICENSE_SIGNING_KEY"))
	if seedHex != "" {
		seed, err := hex.DecodeString(seedHex)
		if err != nil || len(seed) != 32 {
			log.Fatalf("FATAL: LICENSE_SIGNING_KEY must be 64 hex chars (32 bytes). Got error: %v", err)
		}
		AppConfig.LicenseSigningKey = seed
	} else if AppConfig.AppEnv == "production" {
		log.Fatal("FATAL: LICENSE_SIGNING_KEY is required in production to ensure license stability.")
	}
}

func validateProductionConfig() {
	required := map[string]string{
		"DATABASE_URL":            AppConfig.DatabaseURL,
		"RAZORPAY_KEY_ID":         AppConfig.RazorpayKeyID,
		"RAZORPAY_KEY_SECRET":     AppConfig.RazorpayKeySecret,
		"RAZORPAY_WEBHOOK_SECRET": AppConfig.RazorpayWebhookSecret,
	}

	for name, val := range required {
		if val == "" {
			log.Fatalf("FATAL: %s is required in production environment.", name)
		}
	}

	// Validate Email Provider
	if AppConfig.EmailProvider == "smtp" && (AppConfig.SMTPHost == "" || AppConfig.SMTPUser == "") {
		log.Fatal("FATAL: SMTP configuration is incomplete for production.")
	}

	// Validate Storage
	if AppConfig.StorageProvider == "r2" {
		if AppConfig.R2AccessKeyID == "" || AppConfig.R2SecretAccessKey == "" || AppConfig.R2Bucket == "" {
			log.Fatal("FATAL: Cloudflare R2 configuration is incomplete for production.")
		}
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		var i int
		fmt.Sscanf(value, "%d", &i)
		return i
	}
	return fallback
}
