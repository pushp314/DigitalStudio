# Backend Core - BizCode

This file contains the main infrastructure code: entry point, middleware, and database config.

---

## main.go
```go
package main

import (
	"log/slog"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/handlers"
	"github.com/pushp314/bizcode/go-server/middleware"
	"github.com/pushp314/bizcode/go-server/seeder"
	"github.com/pushp314/bizcode/go-server/services"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or failed to load")
	}

	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	config.ConnectDB()
	seeder.Run()
	
	if err := services.InitR2(); err != nil {
		log.Println("Failed to initialize R2 S3 Client:", err)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.MaintenanceMiddleware())

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is not set")
	}

	store := cookie.NewStore([]byte(sessionSecret))
	store.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production" || sameSiteMode() == http.SameSiteNoneMode,
		SameSite: sameSiteMode(),
		MaxAge:   60 * 60,
	})
	r.Use(sessions.Sessions("bizcode_session", store))

	allowOrigins := allowedOriginsFromEnv()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes ... 
	// [Routes are mapped to handlers. See handlers directory for logic]
    api := r.Group("/api")
    // ... group definitions ...

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }
	
	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
```

## config/database.go
```go
package config

import (
	"log"
	"os"

	"github.com/pushp314/bizcode/go-server/models"
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
			&models.Product{},
			&models.Order{},
			&models.OrderItem{},
			&models.SiteConfig{},
			&models.ChatMessage{},
            // ...
		)
		if err != nil {
			log.Fatal("Failed to auto-migrate database:", err)
		}
		log.Println("✅ AutoMigrate: Verified schema for all models (including ChatMessage)")
	}
}
```

## middleware/auth.go
```go
package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = authHeader[7:]
		}

		// Fallback to query parameter (crucial for WebSockets)
		if tokenString == "" {
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, _ := token.Claims.(jwt.MapClaims)
		userID := uint(claims["user_id"].(float64))

		var user models.User
		if err := config.DB.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User no longer exists"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Set("userID", user.ID)
		c.Next()
	}
}
```
