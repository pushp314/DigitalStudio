## File: ./middleware/auth.go
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

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback to query parameter (crucial for WebSockets)
		if tokenString == "" {
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			c.Abort()
			return
		}
		secret := os.Getenv("JWT_SECRET")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
			c.Abort()
			return
		}

			var user models.User
			if err := config.DB.First(&user, uint(userIDFloat)).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				c.Abort()
				return
			}
			if user.Suspended {
				c.JSON(http.StatusForbidden, gin.H{"error": "Account suspended"})
				c.Abort()
				return
			}

			// Self-Healing Subscription Logic
			if user.IsPro && user.ProExpiresAt != nil {
				if time.Now().After(*user.ProExpiresAt) {
					user.IsPro = false
					user.SubscriptionPlan = "free"
					config.DB.Save(&user)
					// Log for system audit
					fmt.Printf("Subscription expired and revoked for user ID: %d\n", user.ID)
				}
			}

			c.Set("user", user)
			c.Set("userID", user.ID)
			c.Set("userRole", user.Role)
			c.Set("userPlan", user.SubscriptionPlan)
			c.Set("isPro", user.IsPro)

			c.Next()
	}
}

func ProMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("userRole")
		isPro, _ := c.Get("isPro")
		
		if role == models.RoleAdmin {
			c.Next()
			return
		}

		if isPro != true {
			c.JSON(http.StatusForbidden, gin.H{"error": "Active Pro subscription required to access this protocol"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists || role != models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
 ```

## File: ./middleware/logging.go
 ```go
package middleware

import (
	"log/slog"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func RequestLogger() gin.HandlerFunc {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		logger.Info("http_request",
			slog.String("method", c.Request.Method),
			slog.String("path", c.FullPath()),
			slog.String("rawPath", c.Request.URL.Path),
			slog.Int("status", c.Writer.Status()),
			slog.Duration("latency", time.Since(start)),
			slog.String("clientIP", c.ClientIP()),
			slog.String("userAgent", c.Request.UserAgent()),
		)
	}
}
 ```

## File: ./middleware/ratelimit.go
 ```go
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	requests int
	resetAt  time.Time
}

func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	var entries sync.Map

	return func(c *gin.Context) {
		if maxRequests <= 0 {
			c.Next()
			return
		}

		key := c.ClientIP()
		now := time.Now()
		value, _ := entries.LoadOrStore(key, &rateLimitEntry{
			requests: 0,
			resetAt:  now.Add(window),
		})

		entry := value.(*rateLimitEntry)
		if now.After(entry.resetAt) {
			entry.requests = 0
			entry.resetAt = now.Add(window)
		}

		if entry.requests >= maxRequests {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		entry.requests++
		c.Next()
	}
}
 ```

## File: ./middleware/maintenance.go
 ```go
package middleware

import (
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func MaintenanceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow specific paths to bypass maintenance
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/admin") || 
		   strings.HasPrefix(path, "/api/auth") ||
		   strings.HasPrefix(path, "/api/config") ||
		   strings.HasPrefix(path, "/api/orders") ||
		   strings.HasPrefix(path, "/api/licenses") ||
		   strings.HasPrefix(path, "/api/analytics") ||
		   strings.HasPrefix(path, "/api/intelligence") ||
		   strings.HasPrefix(path, "/api/docs") ||
		   strings.HasPrefix(path, "/api/testimonials") ||
		   path == "/api/upload" ||
		   path == "/healthz" ||
		   path == "/readyz" {
			c.Next()
			return
		}

		// Fetch Site Config
		var siteConfig models.SiteConfig
		if err := config.DB.First(&siteConfig).Error; err == nil {
			if siteConfig.MaintenanceMode {
				c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
					"maintenance": true,
					"message":     siteConfig.MaintenanceMessage,
				})
				return
			}
		}

		c.Next()
	}
}
 ```

## File: ./seeder/seeder.go
 ```go
package seeder

import (
	"log"
	"os"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"golang.org/x/crypto/bcrypt"
)

func Run() {
	if os.Getenv("ENABLE_SEEDER") != "true" {
		log.Println("Seeder disabled. Set ENABLE_SEEDER=true to seed default data.")
		return
	}
	log.Println("Seeder started...")
	
	// Clear existing configuration and docs to ensure fresh state with new schema
	config.DB.Exec("DELETE FROM premium_docs")
	config.DB.Exec("DELETE FROM site_configs")

	var admin models.User
	config.DB.Where("email = ?", "admin@codestudio.com").First(&admin)
	
	if admin.ID == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin = models.User{
			Name:     "Admin User",
			Email:    "admin@codestudio.com",
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		}
		if err := config.DB.Create(&admin).Error; err != nil {
			log.Println("Failed to create admin seeder:", err)
		} else {
			log.Println("Admin user created: admin@codestudio.com / admin123")
		}
	}
	
	// 2. Site Configuration
	var configCount int64
	config.DB.Model(&models.SiteConfig{}).Count(&configCount)
	if configCount == 0 {
		siteConfig := models.SiteConfig{
			HeroTitle:           "High-Performance Marketplace for Modern Teams",
			HeroSubtitle:        "Deploy premium React templates, technical docs, and AI-powered modules in minutes. Built for developers by developers.",
			Announcements: []string{
				"✨ New Release: Horizon AI Analytics Dashboard is now available!",
				"💎 Pro Member Sale: Save 20% on all licenses this week.",
				"📚 Technical Manuals: Deep dive into React-Go Clean Architecture.",
				"🚀 Join our Discord for exclusive product walkthroughs and support.",
			},
			ShowAnnouncement:    true,
			SupportEmail:        "support@bizcode.com",
			Features: map[string]bool{
				"docs":          true,
				"reviews":       true,
				"analytics":     true,
				"ai":            true,
				"payments":      true,
				"subscriptions": true,
				"licenses":      true,
				"testimonials":  true,
				"wishlist":      true,
			},
			MemberPlans: []models.MemberPlan{
				{
					Name:       "Standard",
					Badge:      "Community",
					Price:      0,
					Period:     "forever",
					Features:   []string{"Browse Marketplace", "Access Free Docs", "Public Community Support"},
					ButtonText: "Explore Assets",
					IsPopular:  false,
					IsPrimary:  false,
				},
				{
					Name:       "Pro Membership",
					Badge:      "Most Popular",
					Price:      1999,
					Period:     "month",
					Features:   []string{"Unlimited Premium Documentation", "Unlimited AI Recommendations", "Early Access to Drops", "Private Slack Community", "Priority Support"},
					ButtonText: "Get All-Access Now",
					IsPopular:  true,
					IsPrimary:  true,
				},
			},
			FAQs: []models.FAQItem{
				{Question: "What technologies do you support?", Answer: "Our marketplace primarily features React, Next.js, and Tailwind CSS templates, with Go and Node.js backend modules."},
				{Question: "Do I get free updates?", Answer: "Yes! Every purchase includes lifetime access to all future updates for that specific product."},
				{Question: "How does the license work?", Answer: "Standard products come with a Commercial License for one project. Extended licenses are available for agency use."},
			},
			SocialProof: models.SocialProofConfig{
				Rating:        "4.95/5",
				Summary:       "Rated #1 for Code Quality in 2026",
				CreatorsLabel: "Trusted by 2,000+ scaling engineering teams",
				TrustedCompanies: []string{"Vercel", "Stripe", "Prisma", "Supabase"},
			},
			ShowcaseItems: []models.ShowcaseItem{
				{
					Title:       "Admin Experience",
					Subtitle:    "Fully managed dashboards",
					Description: "Our templates include full-featured admin surfaces for order tracking and user management.",
					Image:       "https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=1200",
					Footer:      "Dashboard View",
				},
			},
			Contact: models.ContactConfig{
				Heading: "Get in touch",
				Email:   "hello@bizcode.com",
				Phone:   "+1 (555) 000-0000",
				Address: "Global Studio HQ",
			},
			AISettings: models.AISettings{
				Enabled: true,
				Model:   "qwen2.5:1.5b",
			},
		}
		config.DB.Create(&siteConfig)
		log.Println("Advanced Site Config Seeded")
	}

	// 3. Regular Users for Management Testing
	var userCount int64
	config.DB.Model(&models.User{}).Count(&userCount)
	if userCount <= 1 { // Only admin exists
		pass, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
		testUsers := []models.User{
			{Name: "James Wilson", Email: "james@example.com", Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "pro"},
			{Name: "Sarah Chen", Email: "sarah@example.com", Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "free"},
			{Name: "Elena Rodriguez", Email: "elena@example.com", Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "pro"},
		}
		for _, u := range testUsers {
			config.DB.Create(&u)
		}
		log.Println("Test Users Seeded")
	}

	// 4. Products
	products := []models.Product{
		{
			AuthorID: admin.ID,
			Title: "Horizon AI Dashboard",
			Slug: "horizon-ai",
			Category: "SaaS",
			Price: 4999,
			Image: "https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=800",
			Description: "Next-gen analytics dashboard with real-time AI processing hooks.",
			Type: models.ProductTypeTemplate,
			StatusFlags: "featured,new",
			TechStacks: []string{"React", "Next.js", "Go"},
			FileURL: "https://github.com/pushp314/bizcode/archive/refs/heads/main.zip",
		},
		{
			AuthorID: admin.ID,
			Title: "Nexus Portfolio",
			Slug: "nexus-portfolio",
			Category: "Portfolio",
			Price: 1999,
			Image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=800",
			Description: "Minimalist, high-performance portfolio for creative developers.",
			Type: models.ProductTypeTemplate,
			StatusFlags: "trending",
			TechStacks: []string{"React", "GSAP"},
			FileURL: "https://github.com/pushp314/bizcode/archive/refs/heads/main.zip",
		},
		{
			AuthorID: admin.ID,
			Title: "BizCode Pro Pass",
			Slug: "pro-membership",
			Category: "Membership",
			Price: 1999,
			Image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?q=80&w=800",
			Description: "Unlimited access to all documents and premium template unlocks.",
			Type: models.ProductTypeSubscription,
			StatusFlags: "featured",
			RequiresSubscription: false,
			TechStacks: []string{"All-Access"},
		},
	}

	for _, p := range products {
		var existing models.Product
		if err := config.DB.Where("slug = ?", p.Slug).First(&existing).Error; err != nil {
			config.DB.Create(&p)
			log.Printf("Seeded: %s", p.Title)
		}
	}

	// 5. Mock Orders for Dashboard Metrics
	var orderCount int64
	config.DB.Model(&models.Order{}).Count(&orderCount)
	if orderCount == 0 {
		var firstProduct models.Product
		config.DB.First(&firstProduct)
		var firstUser models.User
		config.DB.Where("role = ?", models.RoleUser).First(&firstUser)

		orders := []models.Order{
			{
				UserID: firstUser.ID,
				TotalPrice: 59,
				Status: "paid",
				PaymentStatus: "paid",
				OrderItems: []models.OrderItem{
					{ProductID: firstProduct.ID, Price: 59, Quantity: 1},
				},
			},
			{
				UserID: firstUser.ID,
				TotalPrice: 99,
				Status: "paid",
				PaymentStatus: "paid",
				OrderItems: []models.OrderItem{
					{ProductID: 3, Price: 99, Quantity: 1}, // Assume 3 is Pro pass in some fresh db
				},
			},
		}
		for _, o := range orders {
			config.DB.Create(&o)
		}
		log.Println("Mock Orders Seeded")
	}
	log.Println("Product seeding check finished")

	var docCount int64
	config.DB.Model(&models.PremiumDoc{}).Count(&docCount)
	if docCount == 0 {
		docs := []models.PremiumDoc{
			{
				Title:       "Modern UI/UX Patterns for SaaS",
				Description: "Elevate your dashboard experience with these modern design principles.",
				Category:    "Design",
				IsPremium:   true,
				Icon:        "🎨",
				Image:       "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
				Content: `
# SaaS Design Patterns

Modern SaaS applications require high interaction densities without sacrificing clarity.

## 1. Interaction Consistency
Ensure that every primary action (e.g. Save, Delete) is physically located in the same relative position across all views.

## 2. Progressive Disclosure
Don't overwhelm users. Use tooltips, modals, and collapsible sections to hide advanced settings until needed.

## 3. Dark Mode First
Design your palette with dark mode in mind from day one to ensure accessible contrast ratios in both themes.
`,
				PreviewContent: "Learn the core design principles used in top-tier SaaS dashboards, from progressive disclosure to accessibility-first color tokens.",
				TableOfContents: []models.TOCItem{
					{ID: "saas-design-patterns", Title: "SaaS Design Patterns", Level: 1},
					{ID: "interaction-consistency", Title: "Interaction Consistency", Level: 2},
					{ID: "progressive-disclosure", Title: "Progressive Disclosure", Level: 2},
				},
				Price: 19,
			},
			{
				Title:       "Scalable Go-Backend Architecture",
				Description: "A deep dive into clean architecture using Go and Gin.",
				Category:    "Backend",
				IsPremium:   true,
				Icon:        "⚙️",
				Image:       "https://images.unsplash.com/photo-1518433278993-0a7df1849bc2?auto=format&fit=crop&q=80&w=800",
				Content: `
# Clean Architecture in Go

Building robust backends requires strict separation of concerns.

## Dependency Injection
Avoid global state. Pass your database connections and service dependencies through constructors.

## Interface-Driven Development
Define your repositories as interfaces. This allows for seamless mocking in unit tests.

## Error Handling
Don't just return errors. Wrap them with context using fmt.Errorf to ensure logs remain traceable.
`,
				PreviewContent: "Master the art of building production-ready Go backends using clean architecture, dependency injection, and interface-driven design.",
				TableOfContents: []models.TOCItem{
					{ID: "clean-architecture-in-go", Title: "Clean Architecture in Go", Level: 1},
					{ID: "dependency-injection", Title: "Dependency Injection", Level: 2},
				},
				Price: 25,
			},
			{
				Title:       "Getting Started with BizCode",
				Description: "The essential guide to using our marketplace templates effectively.",
				Category:    "General",
				IsPremium:   false,
				Icon:        "🚀",
				Image:       "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
				Content: `
# Welcome to BizCode

We are excited to help you ship your next big idea.

## Installation
All our templates are delivered as ZIP files containing a standard React/Vite structure. Just run npm install to begin.

## Configuration
Edit the .env file to add your API keys and environment variables.

## Support
Our team is available for technical support Monday through Friday via the dashboard contact form.
`,
				PreviewContent: "Get up and running with your new templates in minutes. Basic installation, configuration, and support overview.",
				TableOfContents: []models.TOCItem{
					{ID: "welcome-to-bizcode", Title: "Welcome to BizCode", Level: 1},
				},
			},
		}
		for _, d := range docs {
			config.DB.Create(&d)
		}
		log.Println("Premium docs seeded")
	}

	log.Println("Seeder finished successfully")
}
 ```

## File: ./config/database.go
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
 ```

## File: ./utils/partner.go
 ```go
package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

func GeneratePartnerCode(name string) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 4)
	for i := range b {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[num.Int64()]
	}
	
	prefix := "DS"
	if len(name) >= 3 {
		prefix = name[:3]
	}
	
	return fmt.Sprintf("%s-%s", prefix, string(b))
}
 ```

## File: ./models/premium_doc.go
 ```go
package models

import (
	"time"
)

type TOCItem struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Level int    `json:"level"`
}

type PremiumDoc struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Title           string    `gorm:"not null" json:"title"`
	Description     string    `gorm:"type:text" json:"description"`
	Content         string    `gorm:"type:text" json:"content"`
	PreviewContent  string    `gorm:"type:text" json:"previewContent"`
	Category        string    `json:"category"`
	Price           float64   `gorm:"type:numeric(10,2);not null;default:0" json:"price"`
	IsPremium       bool      `gorm:"default:true" json:"isPremium"`
	Icon            string    `json:"icon"`
	Image           string    `json:"image"`
	TableOfContents []TOCItem `gorm:"serializer:json;type:jsonb" json:"tableOfContents,omitempty"`

	DocTags []string `gorm:"serializer:json;type:jsonb" json:"tags,omitempty"`

	HasAccess bool `gorm:"-" json:"hasAccess"`
	Locked    bool `gorm:"-" json:"locked"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
 ```

## File: ./models/user.go
 ```go
package models

import (
	"time"
)

type Role string

const (
	RoleUser        Role = "user"
	RoleAdmin       Role = "admin"
	RoleContributor Role = "contributor"
)

type User struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	Name             string    `gorm:"size:255" json:"name"`
	Email            string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Password         string    `json:"-"`
	Role             Role      `gorm:"type:varchar(20);default:'user'" json:"role"`
	SubscriptionPlan string    `gorm:"type:varchar(50);default:'free'" json:"subscriptionPlan"`
	IsPro            bool      `gorm:"default:false" json:"isPro"`
	ProExpiresAt     *time.Time `json:"proExpiresAt"`
	Provider         string    `gorm:"type:varchar(50)" json:"provider"`
	ProviderID       string    `gorm:"type:varchar(255)" json:"providerId"`
	Suspended        bool      `gorm:"not null;default:false" json:"suspended"`
	
	// Partner Protocol Fields
	PartnerCode      string    `gorm:"uniqueIndex;type:varchar(50)" json:"partnerCode"`
	ReferrerID       *uint     `json:"referrerId"`
	PartnerBalance   float64   `gorm:"default:0" json:"partnerBalance"`
	
	// Growth Matrix Fields
	FlashSaleExpiresAt *time.Time `json:"flashSaleExpiresAt"`
	MatrixCredits      float64    `gorm:"default:0" json:"matrixCredits"`
	
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}
 ```

## File: ./models/post.go
 ```go
package models

import "time"

type Post struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"not null" json:"title"`
	Slug        string     `gorm:"uniqueIndex;not null" json:"slug"`
	Content     string     `gorm:"type:text" json:"content"`
	AuthorID    uint       `gorm:"not null" json:"authorId"`
	Author      User       `json:"author,omitempty"`
	Category    string     `json:"category"`
	PublishedAt *time.Time `json:"publishedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}
 ```

## File: ./models/review.go
 ```go
package models

import "time"

type Review struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	UserID           uint      `gorm:"not null" json:"userId"`
	User             User      `json:"user,omitempty"`
	ProductID        uint      `gorm:"not null" json:"productId"`
	Rating           int       `gorm:"not null;check:rating >= 1 AND rating <= 5" json:"rating"`
	Comment          string    `gorm:"type:text" json:"comment"`
	Status           string    `gorm:"type:varchar(50);default:'approved'" json:"status"`
	VerifiedPurchase bool      `gorm:"not null;default:false" json:"verifiedPurchase"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}
 ```

## File: ./models/order.go
 ```go
package models

import (
	"time"
)

type Order struct {
	ID                uint        `gorm:"primaryKey" json:"id"`
	UserID            uint        `gorm:"not null" json:"userId"`
	User              User        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user,omitempty"`
	TotalPrice        float64     `gorm:"type:numeric(10,2);not null;default:0" json:"totalPrice"`
	Status            string      `gorm:"type:varchar(50);default:'pending'" json:"status"`
	PaymentStatus     string      `gorm:"type:varchar(50);default:'pending'" json:"paymentStatus"`
	EntitlementStatus string      `gorm:"type:varchar(50);default:'auto'" json:"entitlementStatus"`
	RazorpayOrderID   string      `gorm:"type:varchar(255)" json:"razorpayOrderId"`
	RazorpayPaymentID string      `gorm:"type:varchar(255)" json:"razorpayPaymentId"`
	RazorpaySignature string      `gorm:"type:varchar(255)" json:"razorpaySignature"`
	OrderItems        []OrderItem `gorm:"foreignKey:OrderID" json:"orderItems,omitempty"`
	Entitled          bool        `gorm:"-" json:"entitled"`
	CreatedAt         time.Time   `json:"createdAt"`
	UpdatedAt         time.Time   `json:"updatedAt"`
}

type OrderItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderID   uint    `gorm:"not null" json:"orderId"`
	ProductID uint    `gorm:"not null" json:"productId"`
	Product   Product `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"product,omitempty"`
	Quantity  int     `gorm:"not null;default:1" json:"quantity"`
	Price     float64 `gorm:"type:numeric(10,2);not null;default:0" json:"price"`
}

func UserOwnsProduct(db interface{}, userID uint, productID uint) bool {
	type gormDB interface {
		Raw(sql string, values ...interface{}) interface{ Scan(dest interface{}) interface{} }
	}
	// Simplified check for now: exists a paid order with this product
	// We'll use a direct query in the handler for simplicity with DB object
	return false 
}
 ```

## File: ./models/site_config.go
 ```go
package models

import (
	"time"
)

type FAQItem struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

type SocialProofConfig struct {
	Rating           string   `json:"rating"`
	Summary          string   `json:"summary"`
	CreatorsLabel    string   `json:"creatorsLabel"`
	TrustedCompanies []string `json:"trustedCompanies,omitempty"`
	AvatarImages     []string `json:"avatarImages,omitempty"`
}

type ShowcaseItem struct {
	Title       string `json:"title"`
	Subtitle    string `json:"subtitle"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Footer      string `json:"footer"`
}

type ContactConfig struct {
	Heading    string `json:"heading"`
	Subheading string `json:"subheading"`
	Email      string `json:"email"`
	Address    string `json:"address"`
	Phone      string `json:"phone"`
}

type AISettings struct {
	Enabled    bool   `json:"enabled"`
	ServiceURL string `json:"serviceUrl"`
	Model      string `json:"model"`
	APIKey     string `json:"apiKey,omitempty"`
}

type MemberPlan struct {
	Name        string   `json:"name"`
	Badge       string   `json:"badge"`
	Price       int      `json:"price"`
	Period      string   `json:"period"`
	Features    []string `json:"features"`
	ButtonText  string   `json:"buttonText"`
	IsPopular   bool     `json:"isPopular"`
	IsPrimary   bool     `json:"isPrimary"` // If true, uses the dark theme and handleSubscribe logic
}

type SiteConfig struct {
	ID                  uint            `gorm:"primaryKey" json:"id"`
	HeroTitle           string          `json:"heroTitle"`
	HeroSubtitle        string          `json:"heroSubtitle"`
	HeroImages          []string        `gorm:"serializer:json;type:jsonb" json:"heroImages,omitempty"`
	HeroVisualEffect    string          `gorm:"default:'stack'" json:"heroVisualEffect"`
	Announcements       []string        `gorm:"serializer:json;type:jsonb" json:"announcements"`
	ShowAnnouncement    bool            `json:"showAnnouncement"`
	SupportEmail        string          `json:"supportEmail"`
	Features            map[string]bool `gorm:"serializer:json;type:jsonb" json:"features,omitempty"`
	MemberPlans         []MemberPlan    `gorm:"serializer:json;type:jsonb" json:"memberPlans,omitempty"`
	FAQs                []FAQItem       `gorm:"serializer:json;type:jsonb" json:"faqs,omitempty"`
	SocialProof         SocialProofConfig `gorm:"serializer:json;type:jsonb" json:"socialProof"`
	ShowcaseItems       []ShowcaseItem  `gorm:"serializer:json;type:jsonb" json:"showcaseItems,omitempty"`
	Contact             ContactConfig   `gorm:"serializer:json;type:jsonb" json:"contact"`
	AISettings          AISettings      `gorm:"serializer:json;type:jsonb" json:"aiSettings"`
	MaintenanceMode     bool            `gorm:"default:false" json:"maintenanceMode"`
	MaintenanceMessage  string          `gorm:"default:'We are currently performing a scheduled maintenance sequence. Please check back shortly.'" json:"maintenanceMessage"`
	CreatedAt           time.Time       `json:"createdAt"`
	UpdatedAt           time.Time       `json:"updatedAt"`
}
 ```

## File: ./models/coupon.go
 ```go
package models

import (
	"time"
	"gorm.io/gorm"
)

type DiscountType string

const (
	DiscountPercentage DiscountType = "percentage"
	DiscountFlat       DiscountType = "flat"
)

type Coupon struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Code          string         `gorm:"uniqueIndex;not null" json:"code"`
	DiscountType  DiscountType   `gorm:"type:varchar(20);not null" json:"discountType"`
	DiscountValue float64        `gorm:"not null" json:"discountValue"`
	MinPurchase   float64        `gorm:"default:0" json:"minPurchase"`
	UsageLimit    int            `gorm:"default:0" json:"usageLimit"` // 0 = unlimited
	UsageCount    int            `gorm:"default:0" json:"usageCount"`
	ExpiresAt     *time.Time     `json:"expiresAt"`
	Active        bool           `gorm:"default:true" json:"active"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (c *Coupon) IsValid(orderAmount float64) bool {
	if !c.Active {
		return false
	}
	if c.ExpiresAt != nil && time.Now().After(*c.ExpiresAt) {
		return false
	}
	if c.UsageLimit > 0 && c.UsageCount >= c.UsageLimit {
		return false
	}
	if orderAmount < c.MinPurchase {
		return false
	}
	return true
}

func (c *Coupon) CalculateDiscount(orderAmount float64) float64 {
	if c.DiscountType == DiscountPercentage {
		return (orderAmount * c.DiscountValue) / 100
	}
	return c.DiscountValue
}
 ```

## File: ./models/license.go
 ```go
package models

import (
	"time"
)

type LicenseType string

const (
	LicensePersonal   LicenseType = "personal"
	LicenseCommercial LicenseType = "commercial"
)

type License struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	UserID     uint       `gorm:"not null" json:"userId"`
	User       User       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ProductID  uint       `gorm:"not null" json:"productId"`
	Product    Product    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"product,omitempty"`
	OrderID    uint       `gorm:"not null" json:"orderId"`
	Order      Order      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"order,omitempty"`
	Type       LicenseType `gorm:"type:varchar(50);default:'personal'" json:"type"`
	LicenseKey string     `gorm:"uniqueIndex;not null" json:"licenseKey"`
	Status     string     `gorm:"type:varchar(50);default:'active'" json:"status"` // active, expired, revoked
	ExpiryDate *time.Time  `json:"expiryDate,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}
 ```

## File: ./models/product.go
 ```go
package models

import (
	"time"
)

type ProductType string

const (
	ProductTypeTemplate    ProductType = "template"
	ProductTypeFullstack   ProductType = "fullstack"
	ProductTypeApi         ProductType = "api"
	ProductTypeComponent   ProductType = "component"
	ProductTypeUIKit       ProductType = "ui_kit"
	ProductTypeIconSet     ProductType = "icon_set"
	ProductTypeCodeSnippet ProductType = "code_snippet"
	ProductTypeEduModule   ProductType = "edu_module"
	ProductTypeSubscription ProductType = "subscription"
)

type ModerationStatus string

const (
	ModStatusPending  ModerationStatus = "pending"
	ModStatusApproved ModerationStatus = "approved"
	ModStatusRejected ModerationStatus = "rejected"
)

type ChangelogEntry struct {
	Version string   `json:"version"`
	Date    string   `json:"date"` // e.g., "2024-03-24"
	Changes []string `json:"changes"`
}

type ProductPreview struct {
	URL       string `json:"url"`
	Alt       string `json:"alt,omitempty"`
	Caption   string `json:"caption,omitempty"`
	SortOrder int    `json:"sortOrder,omitempty"`
}

type Product struct {
	ID                   uint             `gorm:"primaryKey" json:"id"`
	AuthorID             uint             `json:"authorId"`
	Author               User             `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"author,omitempty"`
	Title                string           `gorm:"not null" json:"title"`
	Slug                 string           `gorm:"uniqueIndex;not null" json:"slug"`
	Description          string           `gorm:"type:text" json:"description"`
	LongDescription      string           `gorm:"type:text" json:"longDescription"`
	Price                float64          `gorm:"type:numeric(10,2);not null;default:0" json:"price"`
	Category             string           `gorm:"size:100" json:"category"`
	Type                 ProductType      `gorm:"type:varchar(50);default:'template'" json:"productType"`
	StatusFlags          string           `gorm:"type:varchar(100);default:'active'" json:"statusFlags"`
	ModerationStatus     ModerationStatus `gorm:"type:varchar(50);default:'approved'" json:"moderationStatus"`
	Image                string           `json:"image"`
	LiveDemo             string           `json:"liveDemo"`
	GithubRepo           string           `json:"githubRepo"`
	FileURL              string           `json:"fileURL"`
	Version              string           `gorm:"default:'1.0.0'" json:"version"`
	RequiresSubscription bool             `gorm:"default:false" json:"requiresSubscription"`
	RevenueShare         float64          `gorm:"default:0" json:"revenueShare"`

	VideoURL        string   `json:"videoUrl"`
	CourseOutline   string   `gorm:"type:text" json:"courseOutline"`
	Duration        string   `json:"duration"`
	PreviewImages   []ProductPreview `gorm:"serializer:json;type:jsonb" json:"previewImages,omitempty"`
	SnippetLanguage string   `json:"snippetLanguage"`
	Snippet         string   `gorm:"type:text" json:"snippet"`
	Features        []string `gorm:"serializer:json;type:jsonb" json:"features,omitempty"`
	Pages           []string `gorm:"serializer:json;type:jsonb" json:"pages,omitempty"`

	TechStacks    []string `gorm:"serializer:json;type:jsonb" json:"techStack,omitempty"`
	Changelog     []ChangelogEntry `gorm:"serializer:json;type:jsonb" json:"changelog,omitempty"`
	Documentation []string `gorm:"serializer:json;type:jsonb" json:"documentation,omitempty"`
	Tags          []Tag    `gorm:"many2many:product_tags;" json:"tags,omitempty"`

	PreviewURL string  `gorm:"-" json:"previewUrl,omitempty"`
	Rating     float64 `gorm:"-" json:"rating"`
	NumReviews int64   `gorm:"-" json:"numReviews"`
	NumSales   int64   `gorm:"-" json:"numSales"`
	Revenue    float64 `gorm:"-" json:"revenue"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Tag struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"uniqueIndex;not null;size:100" json:"name"`
}
 ```

## File: ./models/testimonial.go
 ```go
package models

import (
	"time"
)

type Testimonial struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null" json:"userId"`
	User      User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ProductID uint      `gorm:"not null" json:"productId"`
	Product   Product   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"product,omitempty"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Rating    int       `gorm:"default:5" json:"rating"`
	Status    string    `gorm:"type:varchar(50);default:'pending'" json:"status"` // pending, approved, rejected
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
 ```

## File: ./models/showcase.go
 ```go
package models

import "time"

type ShowcaseStatus string

const (
	ShowcasePending  ShowcaseStatus = "pending"
	ShowcaseApproved ShowcaseStatus = "approved"
	ShowcaseRejected ShowcaseStatus = "rejected"
)

type Showcase struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null" json:"userId"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
	ProductID   uint           `gorm:"not null" json:"productId"`
	Product     Product        `gorm:"foreignKey:ProductID" json:"product"`
	LiveURL     string         `gorm:"size:255" json:"liveUrl"`
	Screenshot  string         `gorm:"size:512" json:"screenshot"` // R2 URL
	Status      ShowcaseStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	RewardPaid  bool           `gorm:"default:false" json:"rewardPaid"`
	CreatedAt   time.Time      `json:"createdAt"`
}
 ```

## File: ./models/chat.go
 ```go
package models

import (
	"time"
)

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	Content   string    `json:"content"`
	Type      string    `gorm:"default:'text'" json:"type"` // text, code, system
	IsPro     bool      `json:"isPro"`
	CreatedAt time.Time `json:"createdAt"`
}
 ```

## File: ./models/contact.go
 ```go
package models

import (
	"time"

	"gorm.io/gorm"
)

type ContactInquiry struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `json:"name" binding:"required"`
	Email     string         `json:"email" binding:"required"`
	Subject   string         `json:"subject"`
	Message   string         `json:"message" binding:"required"`
	Reply     string         `json:"reply"`
	Status    string         `gorm:"default:'pending'" json:"status"` // pending, replied
	Sentiment string         `gorm:"size:50;default:'neutral'" json:"sentiment"` 
	Priority  int            `gorm:"default:1" json:"priority"` 
	UserID    *uint          `json:"userId"` // Optional link to registered user
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
 ```

## File: ./scratch/migrate_fix.go
 ```go
package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/pushp314/bizcode/go-server/models"
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
 ```

## File: ./handlers/seo.go
 ```go
package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

func ServeProductSEO(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/templates")
		return
	}

	// Dynamic Metadata Payload
	title := fmt.Sprintf("%s | BizCode Premium", product.Title)
	description := product.Description
	if len(description) > 160 {
		description = description[:157] + "..."
	}
	image := product.Image
	price := fmt.Sprintf("₹%.2f", product.Price)
	siteURL := "https://bizcode.com" // Update for production

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>%s</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="%s/templates/%s">
    <meta property="og:title" content="%s">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s">
    <meta property="product:price:amount" content="%.2f">
    <meta property="product:price:currency" content="INR">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="%s/templates/%s">
    <meta property="twitter:title" content="%s">
    <meta property="twitter:description" content="%s">
    <meta property="twitter:image" content="%s">

    <!-- Pulse Redirect -->
    <script>
        setTimeout(function() {
            window.location.href = "/templates/%s";
        }, 300);
    </script>
</head>
<body>
    <h1>%s</h1>
    <p>%s</p>
    <p>Price: %s</p>
    <img src="%s" alt="%s">
</body>
</html>`, 
	title, siteURL, id, title, description, image, product.Price, 
	siteURL, id, title, description, image, id, title, description, price, image, title)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
 ```

## File: ./handlers/upload.go
 ```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/services"
)

func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "Failed to get file from request")
		return
	}
	defer file.Close()

	url, err := services.UploadFile(file, header)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to upload file to R2: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"filePath": url})
}
 ```

## File: ./handlers/marketing.go
 ```go
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"github.com/pushp314/bizcode/go-server/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"time"
)

type MarketingHandler struct {
	DB *gorm.DB
}

func NewMarketingHandler(db *gorm.DB) *MarketingHandler {
	return &MarketingHandler{DB: db}
}

// Admin: List Coupons
func (h *MarketingHandler) ListCoupons(c *gin.Context) {
	var coupons []models.Coupon
	if err := h.DB.Find(&coupons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve coupons"})
		return
	}
	c.JSON(http.StatusOK, coupons)
}

// Admin: Create Coupon
func (h *MarketingHandler) CreateCoupon(c *gin.Context) {
	var coupon models.Coupon
	if err := c.ShouldBindJSON(&coupon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Create(&coupon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create coupon"})
		return
	}
	c.JSON(http.StatusCreated, coupon)
}

// Admin: Delete Coupon
func (h *MarketingHandler) DeleteCoupon(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&models.Coupon{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove coupon"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Coupon deactivated"})
}

// Public: Validate Coupon
func (h *MarketingHandler) ValidateCoupon(c *gin.Context) {
	code := c.Query("code")
	amount := c.GetFloat64("totalAmount") // Total potentially passed from frontend or calculated previously

	var coupon models.Coupon
	if err := h.DB.Where("code = ? AND active = ?", code, true).First(&coupon).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired coupon"})
		return
	}

	// Basic validation check (amount check might need to be more complex)
	if !coupon.IsValid(amount) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon requirements not met"})
		return
	}

	discount := coupon.CalculateDiscount(amount)
	c.JSON(http.StatusOK, gin.H{
		"code":     coupon.Code,
		"discount": discount,
		"type":     coupon.DiscountType,
	})
}

// Public: Get special deals for abandoned wishlist items
func (h *MarketingHandler) GetWishlistDeals(c *gin.Context) {
	type WishItem struct {
		ID      uint  `json:"id"`
		AddedAt int64 `json:"addedAt"` // Unix timestamp
	}
	var req struct {
		Items []WishItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request matrix"})
		return
	}

	now := time.Now().Unix()
	var deals []gin.H

	for _, item := range req.Items {
		// Hack: If added > 48 hours ago
		if now - item.AddedAt > 172800 { 
			var product models.Product
			if err := h.DB.First(&product, item.ID).Error; err == nil {
				deals = append(deals, gin.H{
					"productId": product.ID,
					"title":     product.Title,
					"discount":  0.15, // 15% Off
					"reason":    "Intelligence Recovery: 15% Return Discount Applied",
				})
			}
		}
	}

	c.JSON(http.StatusOK, deals)
}

func (h *MarketingHandler) GetPersonalizedOffers(c *gin.Context) {
	if !h.aiEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI Engine offline"})
		return
	}

	userID, _ := c.Get("userID")
	var req struct {
		WishlistIDs []uint `json:"wishlistIds"`
	}
	c.ShouldBindJSON(&req)

	// Fetch Context
	var orders []models.Order
	h.DB.Preload("OrderItems.Product").Where("user_id = ? AND status = 'paid'", userID).Find(&orders)
	
	var purchases []string
	for _, o := range orders {
		for _, item := range o.OrderItems {
			purchases = append(purchases, item.Product.Title)
		}
	}

	var wishlist []string
	if len(req.WishlistIDs) > 0 {
		var products []models.Product
		h.DB.Where("id IN ?", req.WishlistIDs).Find(&products)
		for _, p := range products {
			wishlist = append(wishlist, p.Title)
		}
	}

	// AI Strategic Request
	prompt := fmt.Sprintf("Analyze User Profile: Bought: [%s], Wants: [%s].\nGenerate a 'Limited Time VIP Offer'. Return ONLY a JSON object: {\"offerTitle\": \"string\", \"pitch\": \"short 10 word pitch\", \"discount\": number, \"code\": \"GEN-CODE\", \"expiryHours\": number}", 
		strings.Join(purchases, ", "), strings.Join(wishlist, ", "))

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  h.aiModel(),
	})

	resp, err := http.Post(h.aiServiceURL()+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI connectivity issue"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	json.Unmarshal(bodyBytes, &aiResp)

	// Simple extraction
	cleanJSON := aiResp.Answer
	if strings.Contains(cleanJSON, "{") {
		cleanJSON = "{" + strings.Split(cleanJSON, "{")[1]
		cleanJSON = strings.Split(cleanJSON, "}")[0] + "}"
	}

	var offer struct {
		OfferTitle  string `json:"offerTitle"`
		Pitch       string `json:"pitch"`
		Discount    int    `json:"discount"`
		Code        string `json:"code"`
		ExpiryHours int    `json:"expiryHours"`
	}
	
	if err := json.Unmarshal([]byte(cleanJSON), &offer); err != nil {
		// Fallback
		c.JSON(http.StatusOK, gin.H{
			"offerTitle": "Creator Loyalty Reward",
			"pitch": "Since you're growing with us, here is a special return gift.",
			"discount": 15,
			"code": "GROWTH15",
			"expiryHours": 24,
		})
		return
	}

	c.JSON(http.StatusOK, offer)
}

func (h *MarketingHandler) aiEnabled() bool {
	// Simple reuse of check config
	return true 
}
func (h *MarketingHandler) aiModel() string { return "qwen3.5:2b" }
func (h *MarketingHandler) aiServiceURL() string { return "http://localhost:8081" }
 ```

## File: ./handlers/config.go
 ```go
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type UpdateConfigReq struct {
	HeroTitle           string                   `json:"heroTitle"`
	HeroSubtitle        string                   `json:"heroSubtitle"`
	HeroImages          []string                 `json:"heroImages"`
	HeroVisualEffect    string                   `json:"heroVisualEffect"`
	Announcements       []string                 `json:"announcements"`
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
		HeroTitle:           "Build premium products for developers",
		HeroSubtitle:        "Dynamic templates, docs, and tools for teams that ship quickly.",
		Announcements: []string{
			"New marketplace updates are live.",
			"Pro members get 20% off all templates! 💎",
			"Check out our new premium documentation section. 📚",
		},
		ShowAnnouncement:    true,
		SupportEmail:        "support@bizcode.com",
		Features: map[string]bool{
			"docs":          true,
			"reviews":       true,
			"analytics":     true,
			"ai":            true,
			"payments":      true,
			"subscriptions": false,
			"licenses":      true,
			"testimonials":  true,
		},
		MemberPlans: []models.MemberPlan{
			{
				Name:       "Standard",
				Badge:      "Community",
				Price:      0,
				Period:     "forever",
				Features:   []string{"Browse Marketplace", "Access Free Docs"},
				ButtonText: "Explore Assets",
				IsPopular:  false,
				IsPrimary:  false,
			},
			{
				Name:       "Pro Membership",
				Badge:      "Most Popular",
				Price:      29,
				Period:     "month",
				Features:   []string{"Unlimited Premium Documentation", "Unlimited AI Recommendations", "Early Access to Drops", "Private Slack Community"},
				ButtonText: "Get All-Access Now",
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
			Summary:       "Trusted by high-output developer teams",
			CreatorsLabel: "Loved by engineering teams and creators",
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
			Subheading: "Questions about templates, docs, or custom work? Reach out and we will reply quickly.",
			Email:      "support@bizcode.com",
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
 ```

## File: ./handlers/razorpay.go
 ```go
package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	razorpay "github.com/razorpay/razorpay-go"
)

type CreatePaymentOrderReq struct {
	Items      []OrderItemReq `json:"items" binding:"required,min=1"`
	CouponCode string         `json:"couponCode"`
}

func CreateRazorpayOrder(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreatePaymentOrderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var total float64
	var orderItems []models.OrderItem
	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	if keyID == "" || keySecret == "" {
		respondError(c, http.StatusInternalServerError, "Razorpay credentials are not configured")
		return
	}

	for _, itemReq := range req.Items {
		var product models.Product
		if err := config.DB.First(&product, itemReq.ProductID).Error; err != nil {
			respondError(c, http.StatusBadRequest, fmt.Sprintf("Product ID %d not found", itemReq.ProductID))
			return
		}

		price := product.Price
		total += price * float64(itemReq.Quantity)
		orderItems = append(orderItems, models.OrderItem{ProductID: product.ID, Quantity: itemReq.Quantity, Price: price})
	}

	// Apply Coupon if present
	var discount float64
	if req.CouponCode != "" {
		var coupon models.Coupon
		if err := config.DB.Where("code = ? AND active = ?", req.CouponCode, true).First(&coupon).Error; err == nil {
			if coupon.IsValid(total) {
				discount = coupon.CalculateDiscount(total)
				total = total - discount
				if total < 0 {
					total = 0
				}
				// Increment usage count
				coupon.UsageCount++
				config.DB.Save(&coupon)
			}
		}
	}

	order := models.Order{
		UserID:            userID.(uint),
		TotalPrice:        total, // Total is now discounted
		Status:            "pending",
		PaymentStatus:     "pending",
		EntitlementStatus: "auto",
		OrderItems:        orderItems,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create local order")
		return
	}

	client := razorpay.NewClient(keyID, keySecret)

	amountPaise := int64(total * 100)
	data := map[string]interface{}{
		"amount":          amountPaise,
		"currency":        "INR",
		"receipt":         fmt.Sprintf("receipt_order_%d", order.ID),
		"payment_capture": 1,
	}

	razorpayOrder, err := client.Order.Create(data, nil)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to generate Razorpay order")
		return
	}

	order.RazorpayOrderID = razorpayOrder["id"].(string)
	config.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{
		"localOrderId": order.ID,
		"orderId":  order.RazorpayOrderID,
		"amount":       amountPaise,
		"currency":     "INR",
		"keyId":        keyID,
		"paymentStatus": order.PaymentStatus,
	})
}

type PaymentVerifyReq struct {
	RazorpayOrderID   string `json:"razorpayOrderId" binding:"required"`
	RazorpayPaymentID string `json:"razorpayPaymentId" binding:"required"`
	RazorpaySignature string `json:"razorpaySignature" binding:"required"`
}

func VerifyRazorpayPayment(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req PaymentVerifyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	secret := os.Getenv("RAZORPAY_KEY_SECRET")
	data := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if expectedSignature != req.RazorpaySignature {
		respondError(c, http.StatusForbidden, "Invalid payment signature")
		return
	}

	var order models.Order
	if err := config.DB.Where("razorpay_order_id = ?", req.RazorpayOrderID).First(&order).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}
	if order.UserID != userID.(uint) {
		respondError(c, http.StatusForbidden, "You are not allowed to verify this order")
		return
	}

	keyID := os.Getenv("RAZORPAY_KEY_ID")
	client := razorpay.NewClient(keyID, secret)
	paymentData, err := client.Payment.Fetch(req.RazorpayPaymentID, nil, nil)

	if err != nil || paymentData["status"] != "captured" {
		respondError(c, http.StatusBadRequest, "Payment not explicitly captured")
		return
	}

	order.Status = "paid"
	order.PaymentStatus = "paid"
	order.RazorpayPaymentID = req.RazorpayPaymentID
	order.RazorpaySignature = req.RazorpaySignature
	config.DB.Save(&order)

	// Partner Protocol Reward Settlement
	ProcessPartnerRewards(order)

	// Automated Membership Entitlement logic
	var isMembershipOrder bool
	for _, item := range order.OrderItems {
		var product models.Product
		if err := config.DB.First(&product, item.ProductID).Error; err == nil {
			if product.Category == "Membership" {
				isMembershipOrder = true
				break
			}
		}
	}

	if isMembershipOrder {
		var user models.User
		if err := config.DB.First(&user, order.UserID).Error; err == nil {
			now := time.Now()
			oneYear := time.Hour * 24 * 365
			
			var newExpiry time.Time
			if user.IsPro && user.ProExpiresAt != nil && user.ProExpiresAt.After(now) {
				// Extend existing subscription
				newExpiry = user.ProExpiresAt.Add(oneYear)
			} else {
				// Start new subscription
				newExpiry = now.Add(oneYear)
			}
			
			user.IsPro = true
			user.ProExpiresAt = &newExpiry
			user.SubscriptionPlan = "pro"
			config.DB.Save(&user)
			fmt.Printf("Subscription Entitlement: User %d is now Pro until %v\n", user.ID, newExpiry)
		}
	}

	if err := issueMissingLicensesForOrder(order.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to issue license keys")
		return
	}
	order.Entitled = computeOrderEntitled(order)

	c.JSON(http.StatusOK, gin.H{
		"status":        "captured",
		"paymentStatus": order.PaymentStatus,
		"entitled":      order.Entitled,
		"orderId":       order.ID,
		"message":       "Payment verified securely!",
	})
}

func RazorpayWebhook(c *gin.Context) {
	secret := os.Getenv("RAZORPAY_WEBHOOK_SECRET")
	signature := c.GetHeader("X-Razorpay-Signature")

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Cannot read body")
		return
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(bodyBytes)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if expectedSignature != signature {
		respondError(c, http.StatusForbidden, "Invalid webhook signature")
		return
	}

	var payload struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					OrderID string `json:"order_id"`
					ID      string `json:"id"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}

	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid JSON mapping")
		return
	}

	orderID := payload.Payload.Payment.Entity.OrderID

	switch payload.Event {
		case "payment.captured", "order.paid":
			var order models.Order
			if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
				order.PaymentStatus = "paid"
				order.Status = "paid"
				order.RazorpayPaymentID = payload.Payload.Payment.Entity.ID
				config.DB.Save(&order)
				_ = issueMissingLicensesForOrder(order.ID)
				ProcessPartnerRewards(order)
			}
	case "payment.failed":
		var order models.Order
		if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
			order.PaymentStatus = "failed"
			order.Status = "failed"
			config.DB.Save(&order)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func ProcessPartnerRewards(order models.Order) {
	var user models.User
	if err := config.DB.First(&user, order.UserID).Error; err != nil {
		return
	}

	// Only reward if the user was referred by someone
	if user.ReferrerID != nil && *user.ReferrerID != 0 {
		var referrer models.User
		if err := config.DB.First(&referrer, *user.ReferrerID).Error; err == nil {
			// Reward logic: ₹100 credit per purchase
			rewardAmount := 100.0
			referrer.PartnerBalance += rewardAmount
			config.DB.Save(&referrer)
			fmt.Printf("Partner Protocol: Credited ₹%.2f to Referrer ID %d for order %d\n", rewardAmount, referrer.ID, order.ID)
		}
	}
}
 ```

## File: ./handlers/auth_test.go
 ```go
package handlers

import (
	"net/http"
	"testing"

	"github.com/pushp314/bizcode/go-server/middleware"
	"github.com/pushp314/bizcode/go-server/models"
)

func TestRegisterReturnsTokenAndUser(t *testing.T) {
	setupTestDB(t)

	router := newRouter()
	router.POST("/api/auth/register", Register)

	recorder := performJSONRequest(t, router, http.MethodPost, "/api/auth/register", map[string]any{
		"name":     "Ada Lovelace",
		"email":    "ada@example.com",
		"password": "strongpass",
	}, "")

	assertStatus(t, recorder, http.StatusCreated)

	var payload map[string]any
	decodeJSONBody(t, recorder, &payload)

	if payload["token"] == "" {
		t.Fatalf("expected token in register response")
	}

	user := payload["user"].(map[string]any)
	if user["email"] != "ada@example.com" {
		t.Fatalf("expected email to match, got %v", user["email"])
	}
	if user["subscriptionPlan"] != "free" {
		t.Fatalf("expected free subscription plan, got %v", user["subscriptionPlan"])
	}
}

func TestLoginAndMeReturnNormalizedUser(t *testing.T) {
	setupTestDB(t)

	user := seedUser(t, "login@example.com", models.RoleUser, "free", "secret123")
	router := newRouter()
	router.POST("/api/auth/login", Login)
	router.GET("/api/auth/me", middleware.AuthMiddleware(), Me)

	loginRecorder := performJSONRequest(t, router, http.MethodPost, "/api/auth/login", map[string]any{
		"email":    "login@example.com",
		"password": "secret123",
	}, "")

	assertStatus(t, loginRecorder, http.StatusOK)

	var loginPayload map[string]any
	decodeJSONBody(t, loginRecorder, &loginPayload)

	token, ok := loginPayload["token"].(string)
	if !ok || token == "" {
		t.Fatalf("expected token in login response")
	}

	meRecorder := performJSONRequest(t, router, http.MethodGet, "/api/auth/me", nil, token)
	assertStatus(t, meRecorder, http.StatusOK)

	var mePayload map[string]any
	decodeJSONBody(t, meRecorder, &mePayload)

	if mePayload["id"] != float64(user.ID) {
		t.Fatalf("expected user id %d, got %v", user.ID, mePayload["id"])
	}
	if mePayload["role"] != string(user.Role) {
		t.Fatalf("expected role %s, got %v", user.Role, mePayload["role"])
	}
}
 ```

## File: ./handlers/order_admin.go
 ```go
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)


func AdminListOrders(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))

	var orders []models.Order
	query := config.DB.
		Preload("User").
		Preload("OrderItems").
		Preload("OrderItems.Product").
		Order("created_at desc")

	switch status {
	case "", "all":
	case "paid":
		query = query.Where("payment_status = ? OR status = ?", "paid", "paid")
	case "pending":
		query = query.Where("payment_status = ? OR status = ?", "pending", "pending")
	case "failed":
		query = query.Where("payment_status = ? OR status = ?", "failed", "failed")
	case "refunded":
		query = query.Where("payment_status = ? OR status = ?", "refunded", "refunded")
	default:
		respondError(c, http.StatusBadRequest, "Unsupported order status filter")
		return
	}

	if err := query.Find(&orders).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}

	for idx := range orders {
		orders[idx].Entitled = computeOrderEntitled(orders[idx])
	}

	c.JSON(http.StatusOK, orders)
}

func AdminGetOrder(c *gin.Context) {
	id := c.Param("id")
	var order models.Order
	if err := config.DB.
		Preload("User").
		Preload("OrderItems").
		Preload("OrderItems.Product").
		First(&order, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}

	order.Entitled = computeOrderEntitled(order)
	c.JSON(http.StatusOK, order)
}

func AdminUpdateOrder(c *gin.Context) {
	id := c.Param("id")
	var order models.Order
	if err := config.DB.First(&order, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Order not found")
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if status, ok := req["status"].(string); ok {
		order.Status = status
	}
	if pstatus, ok := req["paymentStatus"].(string); ok {
		order.PaymentStatus = pstatus
	}
	if estatus, ok := req["entitlementStatus"].(string); ok {
		order.EntitlementStatus = estatus
	}

	if err := config.DB.Save(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update order")
		return
	}

	if isPaidOrder(order) {
		_ = issueMissingLicensesForOrder(order.ID)
	}

	order.Entitled = computeOrderEntitled(order)
	c.JSON(http.StatusOK, order)
}
 ```

## File: ./handlers/user.go
 ```go
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"golang.org/x/crypto/bcrypt"
)

type UpdateUserReq struct {
	Name             string `json:"name"`
	Role             string `json:"role"`
	SubscriptionPlan string `json:"subscriptionPlan"`
	Suspended        *bool  `json:"suspended"`
}

type ResetPasswordReq struct {
	Password string `json:"password" binding:"required,min=6"`
}

func ListUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	c.JSON(http.StatusOK, users)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req UpdateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if strings.TrimSpace(req.Name) != "" {
		user.Name = req.Name
	}
	if strings.TrimSpace(req.Role) != "" {
		switch models.Role(strings.ToLower(req.Role)) {
		case models.RoleUser, models.RoleAdmin, models.RoleContributor:
			user.Role = models.Role(strings.ToLower(req.Role))
		default:
			respondError(c, http.StatusBadRequest, "Unsupported role")
			return
		}
	}
	if strings.TrimSpace(req.SubscriptionPlan) != "" {
		user.SubscriptionPlan = strings.ToLower(req.SubscriptionPlan)
	}
	if req.Suspended != nil {
		user.Suspended = *req.Suspended
	}

	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update user")
		return
	}

	c.JSON(http.StatusOK, user)
}

func ResetUserPassword(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req ResetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
 ```

## File: ./handlers/auth.go
 ```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/utils"
	"time"
	"golang.org/x/crypto/bcrypt"
)

type RegisterReq struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=6"`
	ReferrerCode string `json:"referrerCode"` // Partner code of the inviter
}

func Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		Name:             req.Name,
		Email:            req.Email,
		Password:         string(hashedPassword),
		Role:             models.RoleUser,
		SubscriptionPlan: "free",
		PartnerCode:      utils.GeneratePartnerCode(req.Name),
	}

	// Link Referrer if provided
	if req.ReferrerCode != "" {
		var referrer models.User
		if err := config.DB.Where("partner_code = ?", req.ReferrerCode).First(&referrer).Error; err == nil {
			user.ReferrerID = &referrer.ID
		}
	}

	// Growth Matrix: Trigger 10-minute Flash Window
	now := time.Now()
	flashExpiry := now.Add(10 * time.Minute)
	user.FlashSaleExpiresAt = &flashExpiry

	if err := config.DB.Create(&user).Error; err != nil {
		respondError(c, http.StatusBadRequest, "Email already exists or internal error")
		return
	}

	respondAuthSuccess(c, http.StatusCreated, user)
}

type LoginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		respondError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}
	if user.Suspended {
		respondError(c, http.StatusForbidden, "Account suspended")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		respondError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	respondAuthSuccess(c, http.StatusOK, user)
}

func Me(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusNotFound, "User not found in context")
		return
	}
	c.JSON(http.StatusOK, user)
}
func AdminListUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	c.JSON(http.StatusOK, users)
}

func AdminUpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if role, ok := req["role"].(string); ok {
		user.Role = models.Role(role)
	}
	if plan, ok := req["subscriptionPlan"].(string); ok {
		user.SubscriptionPlan = plan
	}
	if suspended, ok := req["suspended"].(bool); ok {
		user.Suspended = suspended
	}
	if password, ok := req["password"].(string); ok && password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err == nil {
			user.Password = string(hashedPassword)
		}
	}

	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update user")
		return
	}

	c.JSON(http.StatusOK, user)
}
 ```

## File: ./handlers/review.go
 ```go
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type CreateReviewReq struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type UpdateReviewReq struct {
	Status           *string `json:"status"`
	VerifiedPurchase *bool   `json:"verifiedPurchase"`
}

func CreateReview(c *gin.Context) {
	productID := c.Param("id")
	userID, _ := c.Get("userID")

	var req CreateReviewReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var product models.Product
	if err := config.DB.First(&product, productID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	hasPurchased, err := userHasPaidOrderForProduct(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify purchase eligibility")
		return
	}
	if !hasPurchased {
		respondError(c, http.StatusForbidden, "Purchase required before leaving a review")
		return
	}

	alreadyReviewed, err := hasExistingReview(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify existing review")
		return
	}
	if alreadyReviewed {
		respondError(c, http.StatusBadRequest, "Review already submitted for this product")
		return
	}

	review := models.Review{
		UserID:           userID.(uint),
		ProductID:        product.ID,
		Rating:           req.Rating,
		Comment:          req.Comment,
		Status:           "approved",
		VerifiedPurchase: true,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create review")
		return
	}

	c.JSON(http.StatusCreated, review)
}

func GetReviewEligibility(c *gin.Context) {
	productID := c.Param("id")
	userID, _ := c.Get("userID")

	var product models.Product
	if err := config.DB.First(&product, productID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	hasPurchased, err := userHasPaidOrderForProduct(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify purchase eligibility")
		return
	}

	alreadyReviewed, err := hasExistingReview(userID.(uint), product.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify review history")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hasPurchased":   hasPurchased,
		"alreadyReviewed": alreadyReviewed,
		"canReview":      hasPurchased && !alreadyReviewed,
	})
}

func GetReviews(c *gin.Context) {
	productID := c.Param("id")
	var reviews []models.Review
	if err := config.DB.
		Where("product_id = ? AND status = ?", productID, "approved").
		Preload("User").
		Order("created_at desc").
		Find(&reviews).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load reviews")
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func AdminListReviews(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	var reviews []models.Review
	query := config.DB.Preload("User").Preload("Product").Order("created_at desc")
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if err := query.Find(&reviews).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch reviews")
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func AdminUpdateReview(c *gin.Context) {
	id := c.Param("id")
	var review models.Review
	if err := config.DB.First(&review, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Review not found")
		return
	}

	var req UpdateReviewReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Status != nil {
		status := strings.TrimSpace(strings.ToLower(*req.Status))
		if status != "approved" && status != "hidden" && status != "pending" {
			respondError(c, http.StatusBadRequest, "Unsupported review status")
			return
		}
		review.Status = status
	}
	if req.VerifiedPurchase != nil {
		review.VerifiedPurchase = *req.VerifiedPurchase
	}

	if err := config.DB.Save(&review).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update review")
		return
	}

	if err := config.DB.Preload("User").Preload("Product").First(&review, review.ID).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reload review")
		return
	}

	c.JSON(http.StatusOK, review)
}

func AdminDeleteReview(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Review{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to delete review")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}
 ```

## File: ./handlers/order.go
 ```go
package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type OrderItemReq struct {
	ProductID uint `json:"productId" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type CreateOrderReq struct {
	Items []OrderItemReq `json:"items" binding:"required,min=1"`
}

func CreateOrder(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateOrderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var total float64
	var orderItems []models.OrderItem

	for _, itemReq := range req.Items {
		var product models.Product
		if err := config.DB.First(&product, itemReq.ProductID).Error; err != nil {
			respondError(c, http.StatusBadRequest, fmt.Sprintf("Product ID %d not found", itemReq.ProductID))
			return
		}

		price := product.Price
		total += price * float64(itemReq.Quantity)

		orderItems = append(orderItems, models.OrderItem{
			ProductID: product.ID,
			Quantity:  itemReq.Quantity,
			Price:     price,
		})
	}

	order := models.Order{
		UserID:            userID.(uint),
		TotalPrice:        total,
		Status:            "pending",
		PaymentStatus:     "pending",
		EntitlementStatus: "auto",
		OrderItems:        orderItems,
	}

	if err := config.DB.Create(&order).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create order")
		return
	}

	order.Entitled = false
	c.JSON(http.StatusCreated, order)
}

func MyOrders(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var orders []models.Order
	if err := config.DB.
		Preload("OrderItems").
		Preload("OrderItems.Product").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&orders).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}

	for idx := range orders {
		_ = issueMissingLicensesForOrder(orders[idx].ID)
		orders[idx].Entitled = computeOrderEntitled(orders[idx])
	}

	c.JSON(http.StatusOK, orders)
}
 ```

## File: ./handlers/test_helpers_test.go
 ```go
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	t.Helper()

	gin.SetMode(gin.TestMode)
	_ = os.Setenv("JWT_SECRET", "test-jwt-secret")

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect test db: %v", err)
	}

	if err := db.AutoMigrate(
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
	); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func performJSONRequest(t *testing.T, router *gin.Engine, method, path string, body any, token string) *httptest.ResponseRecorder {
	t.Helper()

	var requestBody *bytes.Buffer
	if body == nil {
		requestBody = bytes.NewBuffer(nil)
	} else {
		payload, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to marshal body: %v", err)
		}
		requestBody = bytes.NewBuffer(payload)
	}

	req := httptest.NewRequest(method, path, requestBody)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	return recorder
}

func seedUser(t *testing.T, email string, role models.Role, plan string, password string) models.User {
	t.Helper()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	user := models.User{
		Name:             "Test User",
		Email:            email,
		Password:         string(hashedPassword),
		Role:             role,
		SubscriptionPlan: plan,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	return user
}

func seedProduct(t *testing.T, title string, price float64) models.Product {
	t.Helper()

	product := models.Product{
		Title:       title,
		Slug:        strings.ToLower(strings.ReplaceAll(title, " ", "-")),
		Description: "Product description",
		Price:       price,
		Category:    "templates",
		Type:        models.ProductTypeTemplate,
		Image:       "https://example.com/product.png",
	}

	if err := config.DB.Create(&product).Error; err != nil {
		t.Fatalf("failed to seed product: %v", err)
	}

	return product
}

func decodeJSONBody(t *testing.T, recorder *httptest.ResponseRecorder, target any) {
	t.Helper()

	if err := json.Unmarshal(recorder.Body.Bytes(), target); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}
}

func mustIssueToken(t *testing.T, user models.User) string {
	t.Helper()

	token, err := issueJWT(user)
	if err != nil {
		t.Fatalf("failed to issue jwt: %v", err)
	}

	return token
}

func performMultipartRequest(t *testing.T, router *gin.Engine, method, path string, token string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, path, bytes.NewBuffer(nil))
	req.Header.Set("Content-Type", "multipart/form-data")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	return recorder
}

func newRouter() *gin.Engine {
	return gin.New()
}

func assertStatus(t *testing.T, recorder *httptest.ResponseRecorder, want int) {
	t.Helper()
	if recorder.Code != want {
		t.Fatalf("unexpected status: got %d want %d body=%s", recorder.Code, want, recorder.Body.String())
	}
}

func assertErrorMessage(t *testing.T, recorder *httptest.ResponseRecorder, want string) {
	t.Helper()
	var payload map[string]any
	decodeJSONBody(t, recorder, &payload)
	if payload["error"] != want {
		t.Fatalf("unexpected error message: got %v want %s", payload["error"], want)
	}
}

func setEnv(t *testing.T, key, value string) {
	t.Helper()
	oldValue, existed := os.LookupEnv(key)
	_ = os.Setenv(key, value)
	t.Cleanup(func() {
		if existed {
			_ = os.Setenv(key, oldValue)
			return
		}
		_ = os.Unsetenv(key)
	})
}

func unsetEnv(t *testing.T, key string) {
	t.Helper()
	oldValue, existed := os.LookupEnv(key)
	_ = os.Unsetenv(key)
	t.Cleanup(func() {
		if existed {
			_ = os.Setenv(key, oldValue)
		}
	})
}
 ```

## File: ./handlers/ai.go
 ```go
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

func GetAIRecommendation(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	techStack := c.Query("techStack")
	if techStack == "" {
		respondError(c, http.StatusBadRequest, "techStack query parameter is required")
		return
	}

	prompt := fmt.Sprintf("Given a catalogue of templates and a tech stack of %s, recommend three relevant products with IDs and one-sentence descriptions.", techStack)

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
	})

	serviceURL := aiServiceURL()
	if serviceURL == "" {
		respondError(c, http.StatusInternalServerError, "AI service URL is not configured")
		return
	}

	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline or unreachable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("AI Service ERROR (%d): %s\n", resp.StatusCode, string(body))
		respondError(c, http.StatusInternalServerError, "AI service returned an error")
		return
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	if err := json.Unmarshal(bodyBytes, &aiResp); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to parse AI response")
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": aiResp.Answer})
}

func GetUserRoadmap(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	userID, _ := c.Get("userID")
	var req struct {
		WishlistIDs []uint `json:"wishlistIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// 1. Fetch Purchases
	var orders []models.Order
	config.DB.Preload("OrderItems.Product").Where("user_id = ? AND status = 'paid'", userID).Find(&orders)

	var purchases []string
	for _, o := range orders {
		for _, item := range o.OrderItems {
			if item.Product.Title != "" {
				purchases = append(purchases, item.Product.Title)
			}
		}
	}

	// 2. Fetch Wishlist Titles (Optional but helpful if we had IDs)
	var wishlistNames []string
	if len(req.WishlistIDs) > 0 {
		var products []models.Product
		config.DB.Where("id IN ?", req.WishlistIDs).Find(&products)
		for _, p := range products {
			wishlistNames = append(wishlistNames, p.Title)
		}
	}

	// 3. Build Strategic Prompt
	profileContext := fmt.Sprintf("User Profile: Purchases: [%s], Wishlist: [%s].", 
		strings.Join(purchases, ", "), strings.Join(wishlistNames, ", "))
	
	prompt := fmt.Sprintf("%s\n\nTask: Generate a strategic 3-step 'Elite Roadmap' for this creator. What should they build next? Which documentation should they read? Suggest one specific template they don't own that would complete their toolkit. Keep it professional, encouraging, and high-density (max 150 words).", profileContext)

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
	})

	serviceURL := aiServiceURL()
	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline")
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	json.Unmarshal(bodyBytes, &aiResp)

	c.JSON(http.StatusOK, gin.H{"roadmap": aiResp.Answer})
}

func AnalyzeInquiry(message string) (string, int) {
	if !aiEnabled() {
		return "neutral", 3
	}

	prompt := fmt.Sprintf("Analyze this customer inquiry: \"%s\"\n\nReturn ONLY a JSON object with two fields: \"sentiment\" (one word: calm, happy, frustrated, confused, or urgent) and \"priority\" (number 1 to 10 based on business impact).", message)

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
	})

	serviceURL := aiServiceURL()
	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		return "neutral", 3
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	json.Unmarshal(bodyBytes, &aiResp)

	// Robustly extract JSON from AI response (some LLMs might wrap in markdown blocks)
	cleanJSON := aiResp.Answer
	if strings.Contains(cleanJSON, "```json") {
		parts := strings.Split(cleanJSON, "```json")
		if len(parts) > 1 {
			cleanJSON = strings.Split(parts[1], "```")[0]
		}
	} else if strings.Contains(cleanJSON, "```") {
		parts := strings.Split(cleanJSON, "```")
		if len(parts) > 1 {
			cleanJSON = parts[1]
		}
	}

	var analysis struct {
		Sentiment string `json:"sentiment"`
		Priority  int    `json:"priority"`
	}
	if err := json.Unmarshal([]byte(strings.TrimSpace(cleanJSON)), &analysis); err != nil {
		fmt.Printf("AI Analysis Parse Error: %v | Raw: %s\n", err, aiResp.Answer)
		return "neutral", 3
	}

	return analysis.Sentiment, analysis.Priority
}
 ```

## File: ./handlers/health.go
 ```go
package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/services"
)

func Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func Readyz(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	checks := gin.H{
		"database": "ok",
		"r2":       "ok",
		"ai":       "ok",
	}

	statusCode := http.StatusOK

	sqlDB, err := config.DB.DB()
	if err != nil || sqlDB.PingContext(ctx) != nil {
		checks["database"] = "unreachable"
		statusCode = http.StatusServiceUnavailable
	}

	if err := services.CheckR2(ctx); err != nil {
		checks["r2"] = err.Error()
		statusCode = http.StatusServiceUnavailable
	}

	if err := checkAIService(ctx); err != nil {
		checks["ai"] = err.Error()
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, gin.H{
		"status": map[bool]string{true: "ready", false: "not_ready"}[statusCode == http.StatusOK],
		"checks": checks,
	})
}

func checkAIService(ctx context.Context) error {
	serviceURL := aiServiceURL()
	if serviceURL == "" {
		return errors.New("ai service is not configured")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, serviceURL+"/healthz", nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return errors.New("ai service healthcheck failed")
	}

	return nil
}
 ```

## File: ./handlers/license.go
 ```go
package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type ValidateLicenseReq struct {
	LicenseKey string `json:"licenseKey" binding:"required"`
	ProductID  uint   `json:"productId"`
}

type IssueLicenseReq struct {
	OrderID uint `json:"orderId" binding:"required"`
}

func MyLicenses(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var licenses []models.License
	if err := config.DB.
		Preload("Product").
		Preload("Order").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&licenses).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch licenses")
		return
	}

	c.JSON(http.StatusOK, licenses)
}

func ValidateLicense(c *gin.Context) {
	var req ValidateLicenseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var license models.License
	query := config.DB.Preload("Product").Preload("Order").Where("license_key = ?", strings.TrimSpace(req.LicenseKey))
	if req.ProductID != 0 {
		query = query.Where("product_id = ?", req.ProductID)
	}
	if err := query.First(&license).Error; err != nil {
		respondError(c, http.StatusNotFound, "License not found")
		return
	}

	valid := strings.EqualFold(license.Status, "active") && (license.ExpiryDate == nil || license.ExpiryDate.After(time.Now()))
	c.JSON(http.StatusOK, gin.H{
		"valid":   valid,
		"license": license,
	})
}

func AdminIssueLicenses(c *gin.Context) {
	var req IssueLicenseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := issueMissingLicensesForOrder(req.OrderID); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to issue licenses")
		return
	}

	var licenses []models.License
	if err := config.DB.Where("order_id = ?", req.OrderID).Find(&licenses).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load issued licenses")
		return
	}

	c.JSON(http.StatusOK, licenses)
}
 ```

## File: ./handlers/product.go
 ```go
package handlers

import (
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
)

// ... (other handlers)

func DownloadSecureAsset(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	productID := c.Param("id")
	var product models.Product
	if err := config.DB.First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	// 1. Check if user is Pro
	var user models.User
	if err := config.DB.First(&user, userID).Error; err == nil {
		if user.IsPro {
			goto generateUrl
		}
	}

	// 2. Check if user owned the product
	{
		var count int64
		config.DB.Table("order_items").
			Joins("JOIN orders ON orders.id = order_items.order_id").
			Where("order_items.product_id = ? AND orders.user_id = ? AND (orders.payment_status = ? OR orders.status = ?)", productID, userID, "paid", "paid").
			Count(&count)
		
		if count > 0 {
			goto generateUrl
		}
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "Active entitlement or purchase required for this asset"})
	return

generateUrl:
	fileKey := strings.TrimPrefix(product.FileURL, os.Getenv("R2_PUBLIC_URL")+"/")
	// If it's a full URL from another source, we might have a problem, 
	// but assuming internally hosted on R2 for production.
	
	url, err := services.GeneratePresignedURL(fileKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security payload"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"downloadUrl": url,
		"expiresIn": "15m",
	})
}

type CreateProductReq struct {
	Title                string                  `json:"title" binding:"required"`
	Slug                 string                  `json:"slug"`
	Description          string                  `json:"description"`
	LongDescription      string                  `json:"longDescription"`
	Price                float64                 `json:"price"`
	Category             string                  `json:"category"`
	Type                 models.ProductType      `json:"productType"`
	StatusFlags          string                  `json:"statusFlags"`
	Image                string                  `json:"image"`
	LiveDemo             string                  `json:"liveDemo"`
	GithubRepo           string                  `json:"githubRepo"`
	FileURL              string                  `json:"fileURL"`
	Version              string                  `json:"version"`
	RequiresSubscription bool                    `json:"requiresSubscription"`
	VideoURL             string                  `json:"videoUrl"`
	CourseOutline        string                  `json:"courseOutline"`
	Duration             string                  `json:"duration"`
	SnippetLanguage      string                  `json:"snippetLanguage"`
	Snippet              string                  `json:"snippet"`
	TechStacks           []string                `json:"techStack"`
	Documentation        []string                `json:"documentation"`
	Tags                 []string                `json:"tags"`
	PreviewImages        []models.ProductPreview `json:"previewImages"`
	Features             []string                `json:"features"`
	Pages                []string                `json:"pages"`
}

type reviewMetric struct {
	ProductID  uint
	Rating     float64
	NumReviews int64
}

type salesMetric struct {
	ProductID uint
	NumSales  int64
	Revenue   float64
}

func ListProducts(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	category := strings.TrimSpace(c.Query("category"))
	priceMin := strings.TrimSpace(c.Query("priceMin"))
	priceMax := strings.TrimSpace(c.Query("priceMax"))
	productType := strings.TrimSpace(c.Query("productType"))
	statusFlag := strings.TrimSpace(c.Query("statusFlag"))
	featured := strings.EqualFold(c.Query("featured"), "true")
	includeAll := strings.EqualFold(c.Query("includeAll"), "true")
	limitValue := strings.TrimSpace(c.Query("limit"))

	var products []models.Product
	query := config.DB.Preload("Tags")

	if !canViewAllProducts(c, includeAll) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}

	if keyword != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR long_description ILIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if productType != "" {
		query = query.Where("type = ?", productType)
	}
	if priceMin != "" {
		query = query.Where("price >= ?", priceMin)
	}
	if priceMax != "" {
		query = query.Where("price <= ?", priceMax)
	}
	if featured {
		query = query.Where("status_flags ILIKE ?", "%featured%")
	}
	if statusFlag != "" {
		query = query.Where("status_flags ILIKE ?", "%"+statusFlag+"%")
	}
	if limitValue != "" {
		if limit, err := strconv.Atoi(limitValue); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	if err := query.Order("created_at desc").Find(&products).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	enrichProducts(&products)
	c.JSON(http.StatusOK, products)
}

func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	query := config.DB.Preload("Tags")
	if !canViewAllProducts(c, strings.EqualFold(c.Query("includeAll"), "true")) {
		query = query.Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%")
	}
	if err := query.First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	enrichProduct(&product)
	c.JSON(http.StatusOK, product)
}

func CreateProduct(c *gin.Context) {
	var req CreateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	productSlug := req.Slug
	if productSlug == "" {
		productSlug = slug.Make(req.Title)
	}

	product := models.Product{
		Title:                req.Title,
		Slug:                 productSlug,
		Description:          req.Description,
		LongDescription:      req.LongDescription,
		Price:                req.Price,
		Category:             req.Category,
		Type:                 req.Type,
		StatusFlags:          req.StatusFlags,
		Image:                req.Image,
		LiveDemo:             req.LiveDemo,
		GithubRepo:           req.GithubRepo,
		FileURL:              req.FileURL,
		Version:              req.Version,
		RequiresSubscription: req.RequiresSubscription,
		VideoURL:             req.VideoURL,
		CourseOutline:        req.CourseOutline,
		Duration:             req.Duration,
		SnippetLanguage:      req.SnippetLanguage,
		Snippet:              req.Snippet,
		TechStacks:           req.TechStacks,
		Documentation:        req.Documentation,
		PreviewImages:        req.PreviewImages,
		Features:             req.Features,
		Pages:                req.Pages,
	}

	if product.Type == "" {
		product.Type = models.ProductTypeTemplate
	}
	if strings.TrimSpace(product.StatusFlags) == "" {
		product.StatusFlags = "active"
	}

	applyProductTags(&product, req.Tags)

	if err := config.DB.Create(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	if len(product.Tags) > 0 {
		if err := config.DB.Model(&product).Association("Tags").Replace(product.Tags); err != nil {
			respondError(c, http.StatusInternalServerError, err.Error())
			return
		}
	}

	enrichProduct(&product)
	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.Preload("Tags").First(&product, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Product not found")
		return
	}

	var req CreateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Title != "" {
		product.Title = req.Title
	}
	if req.Slug != "" {
		product.Slug = req.Slug
	}
	if req.Description != "" {
		product.Description = req.Description
	}
	if req.LongDescription != "" {
		product.LongDescription = req.LongDescription
	}
	if req.Price != 0 {
		product.Price = req.Price
	}
	if req.Category != "" {
		product.Category = req.Category
	}
	if req.Type != "" {
		product.Type = req.Type
	}
	if req.StatusFlags != "" {
		product.StatusFlags = req.StatusFlags
	}
	if req.Image != "" {
		product.Image = req.Image
	}
	if req.LiveDemo != "" {
		product.LiveDemo = req.LiveDemo
	}
	if req.GithubRepo != "" {
		product.GithubRepo = req.GithubRepo
	}
	if req.FileURL != "" {
		product.FileURL = req.FileURL
	}
	if req.Version != "" {
		product.Version = req.Version
	}
	product.RequiresSubscription = req.RequiresSubscription
	product.VideoURL = req.VideoURL
	product.CourseOutline = req.CourseOutline
	product.Duration = req.Duration
	product.SnippetLanguage = req.SnippetLanguage
	product.Snippet = req.Snippet
	product.TechStacks = req.TechStacks
	product.Documentation = req.Documentation
	product.PreviewImages = req.PreviewImages
	product.Features = req.Features
	product.Pages = req.Pages

	if req.Tags != nil {
		applyProductTags(&product, req.Tags)
	}

	if err := config.DB.Save(&product).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	if req.Tags != nil {
		if err := config.DB.Model(&product).Association("Tags").Replace(product.Tags); err != nil {
			respondError(c, http.StatusInternalServerError, err.Error())
			return
		}
	}

	enrichProduct(&product)
	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Product{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

func applyProductTags(product *models.Product, tagNames []string) {
	if product == nil {
		return
	}
	if len(tagNames) == 0 {
		product.Tags = nil
		return
	}

	product.Tags = nil
	for _, tagName := range tagNames {
		trimmed := strings.TrimSpace(tagName)
		if trimmed == "" {
			continue
		}
		var tag models.Tag
		config.DB.FirstOrCreate(&tag, models.Tag{Name: trimmed})
		product.Tags = append(product.Tags, tag)
	}
}

func canViewAllProducts(c *gin.Context, includeAll bool) bool {
	if !includeAll {
		return false
	}
	user, err := optionalAuthenticatedUser(c)
	if err != nil || user == nil {
		return false
	}

	return user.Role == models.RoleAdmin
}

func enrichProducts(products *[]models.Product) {
	if products == nil || len(*products) == 0 {
		return
	}

	productIDs := make([]uint, 0, len(*products))
	for idx := range *products {
		product := &(*products)[idx]
		product.PreviewURL = product.LiveDemo
		productIDs = append(productIDs, product.ID)
	}

	var reviewMetrics []reviewMetric
	config.DB.Model(&models.Review{}).
		Select("product_id, avg(rating) as rating, count(*) as num_reviews").
		Where("product_id IN ? AND status = ?", productIDs, "approved").
		Group("product_id").
		Scan(&reviewMetrics)

	var salesMetrics []salesMetric
	config.DB.Table("order_items").
		Select("order_items.product_id, sum(order_items.quantity) as num_sales, sum(order_items.price * order_items.quantity) as revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("order_items.product_id IN ? AND (orders.payment_status = ? OR orders.status = ?)", productIDs, "paid", "paid").
		Group("order_items.product_id").
		Scan(&salesMetrics)

	reviewMap := make(map[uint]reviewMetric, len(reviewMetrics))
	for _, metric := range reviewMetrics {
		reviewMap[metric.ProductID] = metric
	}

	salesMap := make(map[uint]salesMetric, len(salesMetrics))
	for _, metric := range salesMetrics {
		salesMap[metric.ProductID] = metric
	}

	for idx := range *products {
		product := &(*products)[idx]
		if metric, ok := reviewMap[product.ID]; ok {
			product.Rating = metric.Rating
			product.NumReviews = metric.NumReviews
		}
		if metric, ok := salesMap[product.ID]; ok {
			product.NumSales = metric.NumSales
			product.Revenue = metric.Revenue
		}
	}
}

func enrichProduct(product *models.Product) {
	if product == nil {
		return
	}

	products := []models.Product{*product}
	enrichProducts(&products)
	*product = products[0]
}
 ```

## File: ./handlers/commerce_helpers.go
 ```go
package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"gorm.io/gorm"
)


func isPaidOrder(order models.Order) bool {
	return strings.EqualFold(order.PaymentStatus, "paid") || strings.EqualFold(order.Status, "paid")
}

func computeOrderEntitled(order models.Order) bool {
	switch strings.ToLower(strings.TrimSpace(order.EntitlementStatus)) {
	case "granted":
		return true
	case "revoked":
		return false
	default:
		return isPaidOrder(order)
	}
}

func userHasPaidOrderForProduct(userID uint, productID uint) (bool, error) {
	var count int64
	err := config.DB.
		Table("order_items").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.user_id = ? AND order_items.product_id = ? AND (orders.payment_status = ? OR orders.status = ?)", userID, productID, "paid", "paid").
		Count(&count).
		Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func hasExistingReview(userID uint, productID uint) (bool, error) {
	var count int64
	if err := config.DB.Model(&models.Review{}).
		Where("user_id = ? AND product_id = ?", userID, productID).
		Count(&count).
		Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func generateLicenseKey(userID uint, orderID uint, productID uint) string {
	return fmt.Sprintf("DS-%d-%d-%d-%s", userID, orderID, productID, strings.ToUpper(uuid.New().String()[:8]))
}

func issueMissingLicensesForOrder(orderID uint) error {
	var order models.Order
	if err := config.DB.Preload("OrderItems").First(&order, orderID).Error; err != nil {
		return err
	}
	if !isPaidOrder(order) {
		return nil
	}

	for _, item := range order.OrderItems {
		var product models.Product
		if err := config.DB.First(&product, item.ProductID).Error; err == nil {
			if product.Type == models.ProductTypeSubscription {
				config.DB.Model(&models.User{}).Where("id = ?", order.UserID).Update("subscription_plan", "pro")
				continue
			}
		}

		var existing models.License
		err := config.DB.Where("order_id = ? AND product_id = ? AND user_id = ?", order.ID, item.ProductID, order.UserID).First(&existing).Error
		if err == nil {
			continue
		}
		if err != gorm.ErrRecordNotFound {
			return err
		}

		license := models.License{
			UserID:     order.UserID,
			ProductID:  item.ProductID,
			OrderID:    order.ID,
			Type:       models.LicensePersonal,
			LicenseKey: generateLicenseKey(order.UserID, order.ID, item.ProductID),
			Status:     "active",
			ExpiryDate: nil,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		if err := config.DB.Create(&license).Error; err != nil {
			return err
		}
	}

	return nil
}
 ```

## File: ./handlers/testimonial.go
 ```go
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"gorm.io/gorm"
)

type CreateTestimonialReq struct {
	ProductID uint   `json:"productId" binding:"required"`
	Content   string `json:"content" binding:"required"`
	Rating    int    `json:"rating"`
}

func CreateTestimonial(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateTestimonialReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Rating == 0 {
		req.Rating = 5
	}

	hasPurchased, err := userHasPaidOrderForProduct(userID.(uint), req.ProductID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to verify purchase eligibility")
		return
	}
	if !hasPurchased {
		respondError(c, http.StatusForbidden, "Only users who purchased this product can submit a testimonial")
		return
	}

	var existing models.Testimonial
	err = config.DB.Where("user_id = ? AND product_id = ?", userID.(uint), req.ProductID).First(&existing).Error
	if err == nil {
		respondError(c, http.StatusBadRequest, "You have already submitted a testimonial for this product")
		return
	}
	if err != gorm.ErrRecordNotFound {
		respondError(c, http.StatusInternalServerError, "Failed to validate testimonial history")
		return
	}

	testimonial := models.Testimonial{
		UserID:    userID.(uint),
		ProductID: req.ProductID,
		Content:   strings.TrimSpace(req.Content),
		Rating:    req.Rating,
		Status:    "pending",
	}

	if err := config.DB.Create(&testimonial).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to create testimonial")
		return
	}

	if err := config.DB.Preload("User").Preload("Product").First(&testimonial, testimonial.ID).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load testimonial")
		return
	}

	c.JSON(http.StatusCreated, testimonial)
}

func GetApprovedTestimonials(c *gin.Context) {
	var testimonials []models.Testimonial
	if err := config.DB.
		Where("status = ?", "approved").
		Preload("User").
		Preload("Product").
		Order("created_at desc").
		Find(&testimonials).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch testimonials")
		return
	}
	c.JSON(http.StatusOK, testimonials)
}

func AdminListTestimonials(c *gin.Context) {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))

	var testimonials []models.Testimonial
	query := config.DB.Preload("User").Preload("Product").Order("created_at desc")
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if err := query.Find(&testimonials).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch testimonials")
		return
	}
	c.JSON(http.StatusOK, testimonials)
}

func AdminApproveTestimonial(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Model(&models.Testimonial{}).Where("id = ?", id).Update("status", "approved").Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to approve testimonial")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Testimonial approved"})
}

func AdminRejectTestimonial(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Model(&models.Testimonial{}).Where("id = ?", id).Update("status", "rejected").Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reject testimonial")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Testimonial rejected"})
}

func AdminDeleteTestimonial(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.Testimonial{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to delete testimonial")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Testimonial deleted"})
}
 ```

## File: ./handlers/doc.go
 ```go
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

func ListDocs(c *gin.Context) {
	category := c.Query("category")
	keyword := c.Query("search")
	var docs []models.PremiumDoc
	query := config.DB

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if keyword != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	if err := query.Find(&docs).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	for idx := range docs {
		docs[idx].Content = ""
	}

	c.JSON(http.StatusOK, docs)
}

func GetDoc(c *gin.Context) {
	id := c.Param("id")
	var doc models.PremiumDoc
	if err := config.DB.First(&doc, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Doc not found")
		return
	}

	user, err := optionalAuthenticatedUser(c)
	if err != nil {
		respondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	doc.HasAccess = canAccessDoc(doc, user)
	doc.Locked = !doc.HasAccess
	if doc.Locked {
		if strings.TrimSpace(doc.PreviewContent) != "" {
			doc.Content = doc.PreviewContent
		} else if len(doc.Content) > 600 {
			doc.Content = doc.Content[:600]
		}
	}
	c.JSON(http.StatusOK, doc)
}

type CreateDocReq struct {
	Title           string           `json:"title" binding:"required"`
	Description     string           `json:"description"`
	Content         string           `json:"content" binding:"required"`
	PreviewContent  string           `json:"previewContent"`
	Category        string           `json:"category"`
	Price           float64          `json:"price"`
	IsPremium       bool             `json:"isPremium"`
	Icon            string           `json:"icon"`
	TableOfContents []models.TOCItem `json:"tableOfContents"`
	Tags            []string         `json:"tags"`
}

func CreateDoc(c *gin.Context) {
	var req CreateDocReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	doc := models.PremiumDoc{
		Title:           req.Title,
		Description:     req.Description,
		Content:         req.Content,
		PreviewContent:  req.PreviewContent,
		Category:        req.Category,
		Price:           req.Price,
		IsPremium:       req.IsPremium,
		Icon:            req.Icon,
		TableOfContents: req.TableOfContents,
		DocTags:         req.Tags,
	}

	if err := config.DB.Create(&doc).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	doc.HasAccess = true
	c.JSON(http.StatusCreated, doc)
}

func UpdateDoc(c *gin.Context) {
	id := c.Param("id")
	var doc models.PremiumDoc
	if err := config.DB.First(&doc, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Doc not found")
		return
	}

	var req CreateDocReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Title != "" { doc.Title = req.Title }
	if req.Description != "" { doc.Description = req.Description }
	if req.Content != "" { doc.Content = req.Content }
	if req.PreviewContent != "" { doc.PreviewContent = req.PreviewContent }
	if req.Category != "" { doc.Category = req.Category }
	if req.Price != 0 { doc.Price = req.Price }
	doc.IsPremium = req.IsPremium
	if req.Icon != "" { doc.Icon = req.Icon }
	
	if req.TableOfContents != nil {
		doc.TableOfContents = req.TableOfContents
	}
	if req.Tags != nil {
		doc.DocTags = req.Tags
	}

	if err := config.DB.Save(&doc).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	doc.HasAccess = true
	c.JSON(http.StatusOK, doc)
}

func DeleteDoc(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.PremiumDoc{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Doc deleted successfully"})
}

func canAccessDoc(doc models.PremiumDoc, user *models.User) bool {
	if !doc.IsPremium || doc.Price == 0 {
		return true
	}

	if user == nil {
		return false
	}

	return user.Role == models.RoleAdmin || user.SubscriptionPlan == "pro"
}
 ```

## File: ./handlers/showcase.go
 ```go
package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type SubmitShowcaseReq struct {
	ProductID  uint   `json:"productId" binding:"required"`
	LiveURL    string `json:"liveUrl" binding:"required"`
	Screenshot string `json:"screenshot"`
}

func SubmitShowcase(c *gin.Context) {
	userId, _ := c.Get("userID")

	var req SubmitShowcaseReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	showcase := models.Showcase{
		UserID:     userId.(uint),
		ProductID:  req.ProductID,
		LiveURL:    req.LiveURL,
		Screenshot: req.Screenshot,
		Status:     models.ShowcasePending,
	}

	if err := config.DB.Create(&showcase).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to submit implementation")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Protocol Submitted: Our intelligence unit will verify your deployment shortly.",
		"showcase": showcase,
	})
}

func AdminListShowcases(c *gin.Context) {
	var showcases []models.Showcase
	if err := config.DB.Preload("Product").Order("created_at desc").Find(&showcases).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, showcases)
}

func AdminUpdateShowcaseStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status models.ShowcaseStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var showcase models.Showcase
	if err := config.DB.First(&showcase, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Implementation signal lost")
		return
	}

	showcase.Status = req.Status
	
	// Reward Logic: If Approved and not already paid
	if req.Status == models.ShowcaseApproved && !showcase.RewardPaid {
		var user models.User
		if err := config.DB.First(&user, showcase.UserID).Error; err == nil {
			user.MatrixCredits += 50 // ₹50 reward
			config.DB.Save(&user)
			showcase.RewardPaid = true
			fmt.Printf("Growth Matrix: Credited ₹50 to UserID %d for Verified Implementation %d\n", user.ID, showcase.ID)
		}
	}

	config.DB.Save(&showcase)
	c.JSON(http.StatusOK, showcase)
}
 ```

## File: ./handlers/chat.go
 ```go
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin for development
	},
}

// Client represents a connected user in the chat
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	UserID   uint
	UserName string
	IsPro    bool
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			
			// Notify others
			h.broadcastSystemMsg(fmt.Sprintf("%s joined the stream", client.UserName))
			h.broadcastOnlineCount()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				h.mu.Unlock()
				
				// Notify others
				h.broadcastSystemMsg(fmt.Sprintf("%s disconnected", client.UserName))
				h.broadcastOnlineCount()
			} else {
				h.mu.Unlock()
			}

		case message := <-h.Broadcast:
			h.mu.Lock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) broadcastSystemMsg(content string) {
	msg := models.ChatMessage{
		UserName:  "System",
		Content:   content,
		Type:      "system",
		CreatedAt: time.Now(),
	}
	payload, _ := json.Marshal(msg)
	h.Broadcast <- payload
}

func (h *Hub) broadcastOnlineCount() {
	h.mu.Lock()
	count := len(h.Clients)
	h.mu.Unlock()

	msg := gin.H{
			"type": "presence",
			"count": count,
			"userName": "System",
			"createdAt": time.Now(),
	}
	payload, _ := json.Marshal(msg)
	h.Broadcast <- payload
}

var GlobalHub = NewHub()

func init() {
	go GlobalHub.Run()
}

// ServeWs handles websocket requests from the peer.
func ServeChatWs(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		log.Println("WS Upgrade Error: user not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		log.Println("WS Upgrade Error: invalid userID type in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WS Upgrade Failed:", err)
		return
	}

	// Fetch user details for the chat
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		log.Println("WS Error: user not found in DB:", userID)
		conn.Close()
		return
	}

	client := &Client{
		Hub:      GlobalHub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		UserID:   userID,
		UserName: user.Name,
		IsPro:    user.IsPro,
	}
	client.Hub.Register <- client

	log.Printf("WS Link Established: %s (ID: %d)", user.Name, userID)

	// Start reader and writer routines
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	// Simple Rate Limiting State
	messageCount := 0
	lastReset := time.Now()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Rate Limiting Logic
		if time.Since(lastReset) > time.Minute {
			messageCount = 0
			lastReset = time.Now()
		}

		limit := 5 // Free users: 5 messages per minute
		if c.IsPro {
			limit = 50 // Pro users: 50 messages per minute
		}

		if messageCount >= limit {
			systemMsg := models.ChatMessage{
				UserName:  "System",
				Content:   "Rate limit exceeded. Upgrade to Pro for high-velocity chat.",
				Type:      "system",
				CreatedAt: time.Now(),
			}
			payload, _ := json.Marshal(systemMsg)
			c.Send <- payload
			continue
		}

		messageCount++

		// Persistence
		dbMsg := models.ChatMessage{
			UserID:    c.UserID,
			UserName:  c.UserName,
			Content:   string(message),
			IsPro:     c.IsPro,
			Type:      "text",
			CreatedAt: time.Now(),
		}

		// If message starts with "```", mark as code type (Advanced Feature)
		if len(message) > 3 && string(message[:3]) == "```" {
			dbMsg.Type = "code"
		}

		config.DB.Create(&dbMsg)

		// Broadcast
		payload, _ := json.Marshal(dbMsg)
		c.Hub.Broadcast <- payload
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte("\n"))
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func GetChatHistory(c *gin.Context) {
	var messages []models.ChatMessage
	config.DB.Order("created_at desc").Limit(50).Find(&messages)
	
	// Reverse to show chronological order in UI
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	
	c.JSON(http.StatusOK, messages)
}
 ```

## File: ./handlers/contact.go
 ```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

func CreateContactInquiry(c *gin.Context) {
	var inquiry models.ContactInquiry
	if err := c.ShouldBindJSON(&inquiry); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	user, _ := optionalAuthenticatedUser(c)
	if user != nil {
		inquiry.UserID = &user.ID
	}

	if err := config.DB.Create(&inquiry).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// 🧠 Advanced Trajectory: Asynchronous AI Enrichment
	go func(id uint, msg string) {
		sentiment, priority := AnalyzeInquiry(msg)
		config.DB.Model(&models.ContactInquiry{}).Where("id = ?", id).Updates(map[string]interface{}{
			"sentiment": sentiment,
			"priority":  priority,
		})
	}(inquiry.ID, inquiry.Message)

	c.JSON(http.StatusOK, gin.H{"message": "Thank you! Your inquiry has been received. Our team will get back to you shortly."})
}

func AdminListInquiries(c *gin.Context) {
	var inquiries []models.ContactInquiry
	if err := config.DB.Order("created_at desc").Find(&inquiries).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch inquiries")
		return
	}

	c.JSON(http.StatusOK, inquiries)
}

func AdminReplyToInquiry(c *gin.Context) {
	id := c.Param("id")
	var inquiry models.ContactInquiry
	if err := config.DB.First(&inquiry, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Inquiry not found")
		return
	}

	var req struct {
		Reply string `json:"reply" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	inquiry.Reply = req.Reply
	inquiry.Status = "replied"

	if err := config.DB.Save(&inquiry).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save reply")
		return
	}

	// Logic for "send them to their account" or "manually reply":
	// In a real system, this would trigger an email or push notification.
	// For this MVP, we simply store it. The frontend will show it in their dashboard if they are logged in.

	c.JSON(http.StatusOK, gin.H{"message": "Reply sent successfully", "inquiry": inquiry})
}

func MyInquiries(c *gin.Context) {
	user, err := optionalAuthenticatedUser(c)
	if err != nil || user == nil {
		respondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var inquiries []models.ContactInquiry
	if err := config.DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&inquiries).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch your inquiries")
		return
	}

	c.JSON(http.StatusOK, inquiries)
}
 ```

## File: ./handlers/oauth.go
 ```go
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

func getGoogleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"},
		Endpoint:     google.Endpoint,
	}
}

func getGithubOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GITHUB_REDIRECT_URL"),
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}
}

func GoogleLogin(c *gin.Context) {
	state := uuid.New().String()
	session := sessions.Default(c)
	session.Set("oauthState", state)
	session.Save()
	url := getGoogleOAuthConfig().AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
	session := sessions.Default(c)
	expectedState := session.Get("oauthState")
	if expectedState != c.Query("state") {
		respondError(c, http.StatusBadRequest, "Invalid state")
		return
	}
	session.Delete("oauthState")
	_ = session.Save()

	code := c.Query("code")
	token, err := getGoogleOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to exchange token")
		return
	}

	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get user info")
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	json.NewDecoder(resp.Body).Decode(&userInfo)

	handleOAuthUser(c, "google", userInfo.ID, userInfo.Name, userInfo.Email)
}

func GithubLogin(c *gin.Context) {
	state := uuid.New().String()
	session := sessions.Default(c)
	session.Set("oauthState", state)
	session.Save()
	url := getGithubOAuthConfig().AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GithubCallback(c *gin.Context) {
	session := sessions.Default(c)
	expectedState := session.Get("oauthState")
	if expectedState != c.Query("state") {
		respondError(c, http.StatusBadRequest, "Invalid state")
		return
	}
	session.Delete("oauthState")
	_ = session.Save()

	code := c.Query("code")
	token, err := getGithubOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to exchange token")
		return
	}

	client := getGithubOAuthConfig().Client(context.Background(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get user info")
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	json.NewDecoder(resp.Body).Decode(&userInfo)

	if userInfo.Email == "" {
		emailResp, err := client.Get("https://api.github.com/user/emails")
		if err == nil {
			var emails []struct {
				Email   string `json:"email"`
				Primary bool   `json:"primary"`
			}
			json.NewDecoder(emailResp.Body).Decode(&emails)
			emailResp.Body.Close()
			for _, e := range emails {
				if e.Primary {
					userInfo.Email = e.Email
					break
				}
			}
		}
	}

	handleOAuthUser(c, "github", fmt.Sprintf("%d", userInfo.ID), userInfo.Name, userInfo.Email)
}

func handleOAuthUser(c *gin.Context, provider, providerID, name, email string) {
	var user models.User
	result := config.DB.Where("provider = ? AND provider_id = ?", provider, providerID).First(&user)

	if result.Error != nil {
		if email != "" {
			config.DB.Where("email = ?", email).First(&user)
		}

		if user.ID == 0 {
			user = models.User{
				Name:             name,
				Email:            email,
				Password:         uuid.New().String(),
				Role:             models.RoleUser,
				SubscriptionPlan: "free",
				Provider:         provider,
				ProviderID:       providerID,
			}
			config.DB.Create(&user)
		} else {
			user.Provider = provider
			user.ProviderID = providerID
			config.DB.Save(&user)
		}
	}
	if user.Suspended {
		respondError(c, http.StatusForbidden, "Account suspended")
		return
	}

	redirectOAuthSuccess(c, user)
}
 ```

## File: ./handlers/helpers.go
 ```go
package handlers

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type authResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func respondError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}

func issueJWT(user models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", errors.New("JWT secret is not configured")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":          user.ID,
		"role":             user.Role,
		"subscriptionPlan": user.SubscriptionPlan,
		"exp":              time.Now().Add(72 * time.Hour).Unix(),
	})

	return token.SignedString([]byte(secret))
}

func respondAuthSuccess(c *gin.Context, status int, user models.User) {
	payload, err := buildAuthResponse(user)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(status, payload)
}

func buildAuthResponse(user models.User) (authResponse, error) {
	token, err := issueJWT(user)
	if err != nil {
		return authResponse{}, errors.New("failed to generate token")
	}

	return authResponse{
		Token: token,
		User:  user,
	}, nil
}

func redirectOAuthSuccess(c *gin.Context, user models.User) {
	payload, err := buildAuthResponse(user)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	if frontendURL == "" {
		c.JSON(http.StatusOK, payload)
		return
	}

	userJSON, err := json.Marshal(payload.User)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to encode OAuth session")
		return
	}

	encodedUser := base64.RawURLEncoding.EncodeToString(userJSON)
	params := url.Values{}
	params.Set("token", payload.Token)
	params.Set("user", encodedUser)

	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback?%s", frontendURL, params.Encode()))
}

func optionalAuthenticatedUser(c *gin.Context) (*models.User, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, nil
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, errors.New("invalid authorization header format")
	}

	secret := os.Getenv("JWT_SECRET")
	token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}

		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, errors.New("user id not found in token")
	}

	var user models.User
	if err := config.DB.First(&user, uint(userIDFloat)).Error; err != nil {
		return nil, err
	}
	if user.Suspended {
		return nil, errors.New("account suspended")
	}

	return &user, nil
}

func aiServiceURL() string {
	var siteConfig models.SiteConfig
	if config.DB != nil && config.DB.First(&siteConfig).Error == nil {
		if trimmed := strings.TrimRight(strings.TrimSpace(siteConfig.AISettings.ServiceURL), "/"); trimmed != "" {
			return trimmed
		}
	}
	return strings.TrimRight(os.Getenv("AI_SERVICE_URL"), "/")
}

func aiEnabled() bool {
	var siteConfig models.SiteConfig
	if config.DB != nil && config.DB.First(&siteConfig).Error == nil {
		if enabled, ok := siteConfig.Features["ai"]; ok && !enabled {
			return false
		}
		if !siteConfig.AISettings.Enabled {
			return false
		}
	}

	return true
}

func aiModel() string {
	var siteConfig models.SiteConfig
	if config.DB != nil && config.DB.First(&siteConfig).Error == nil {
		if trimmed := strings.TrimSpace(siteConfig.AISettings.Model); trimmed != "" {
			return trimmed
		}
	}

	return ""
}
 ```

## File: ./handlers/contracts_test.go
 ```go
package handlers

import (
	"net/http"
	"testing"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/middleware"
	"github.com/pushp314/bizcode/go-server/models"
)

func TestCreateOrderCreatesPendingDraft(t *testing.T) {
	setupTestDB(t)

	user := seedUser(t, "buyer@example.com", models.RoleUser, "free", "secret123")
	product := seedProduct(t, "Template Kit", 49)
	token := mustIssueToken(t, user)

	router := newRouter()
	router.POST("/api/orders", middleware.AuthMiddleware(), CreateOrder)

	recorder := performJSONRequest(t, router, http.MethodPost, "/api/orders", map[string]any{
		"items": []map[string]any{
			{
				"productId": product.ID,
				"quantity":  2,
			},
		},
	}, token)

	assertStatus(t, recorder, http.StatusCreated)

	var payload map[string]any
	decodeJSONBody(t, recorder, &payload)

	if payload["status"] != "pending" {
		t.Fatalf("expected pending order status, got %v", payload["status"])
	}
	if payload["paymentStatus"] != "pending" {
		t.Fatalf("expected pending payment status, got %v", payload["paymentStatus"])
	}
	if payload["totalPrice"] != 98.0 {
		t.Fatalf("expected total price 98, got %v", payload["totalPrice"])
	}
}

func TestGetDocReturnsPreviewWhenLocked(t *testing.T) {
	setupTestDB(t)

	doc := models.PremiumDoc{
		Title:          "Premium Architecture Guide",
		Description:    "Locked doc",
		Content:        "Full premium content that should not be exposed to anonymous users.",
		PreviewContent: "Preview excerpt",
		Category:       "React",
		Price:          29,
		IsPremium:      true,
	}
	if err := config.DB.Create(&doc).Error; err != nil {
		t.Fatalf("failed to seed doc: %v", err)
	}

	router := newRouter()
	router.GET("/api/docs/:id", GetDoc)

	recorder := performJSONRequest(t, router, http.MethodGet, "/api/docs/1", nil, "")
	assertStatus(t, recorder, http.StatusOK)

	var payload map[string]any
	decodeJSONBody(t, recorder, &payload)

	if payload["locked"] != true {
		t.Fatalf("expected locked doc response, got %v", payload["locked"])
	}
	if payload["hasAccess"] != false {
		t.Fatalf("expected hasAccess false, got %v", payload["hasAccess"])
	}
	if payload["content"] != "Preview excerpt" {
		t.Fatalf("expected preview content, got %v", payload["content"])
	}
}

func TestAIRecommendationRequiresConfiguredService(t *testing.T) {
	setupTestDB(t)
	unsetEnv(t, "AI_SERVICE_URL")

	router := newRouter()
	router.GET("/api/ai/recommend", GetAIRecommendation)

	recorder := performJSONRequest(t, router, http.MethodGet, "/api/ai/recommend?techStack=react", nil, "")
	assertStatus(t, recorder, http.StatusInternalServerError)
	assertErrorMessage(t, recorder, "AI service URL is not configured")
}

func TestUploadFileRequiresMultipartFile(t *testing.T) {
	setupTestDB(t)

	router := newRouter()
	router.POST("/api/upload", UploadFile)

	recorder := performMultipartRequest(t, router, http.MethodPost, "/api/upload", "")
	assertStatus(t, recorder, http.StatusBadRequest)
	assertErrorMessage(t, recorder, "Failed to get file from request")
}

func TestCreateRazorpayOrderRequiresCredentials(t *testing.T) {
	setupTestDB(t)
	unsetEnv(t, "RAZORPAY_KEY_ID")
	unsetEnv(t, "RAZORPAY_KEY_SECRET")

	user := seedUser(t, "payments@example.com", models.RoleUser, "free", "secret123")
	product := seedProduct(t, "Checkout Product", 99)
	token := mustIssueToken(t, user)

	router := newRouter()
	router.POST("/api/payments/create-order", middleware.AuthMiddleware(), CreateRazorpayOrder)

	recorder := performJSONRequest(t, router, http.MethodPost, "/api/payments/create-order", map[string]any{
		"items": []map[string]any{
			{
				"productId": product.ID,
				"quantity":  1,
			},
		},
	}, token)

	assertStatus(t, recorder, http.StatusInternalServerError)
	assertErrorMessage(t, recorder, "Razorpay credentials are not configured")
}

func TestVerifyRazorpayPaymentRejectsInvalidSignature(t *testing.T) {
	setupTestDB(t)
	setEnv(t, "RAZORPAY_KEY_SECRET", "razorpay-secret")

	user := seedUser(t, "verify@example.com", models.RoleUser, "free", "secret123")
	order := models.Order{
		UserID:          user.ID,
		TotalPrice:      49,
		Status:          "pending",
		PaymentStatus:   "pending",
		RazorpayOrderID: "order_test_123",
	}
	if err := config.DB.Create(&order).Error; err != nil {
		t.Fatalf("failed to seed order: %v", err)
	}

	token := mustIssueToken(t, user)
	router := newRouter()
	router.POST("/api/payments/verify", middleware.AuthMiddleware(), VerifyRazorpayPayment)

	recorder := performJSONRequest(t, router, http.MethodPost, "/api/payments/verify", map[string]any{
		"razorpayOrderId":   "order_test_123",
		"razorpayPaymentId": "pay_test_123",
		"razorpaySignature": "bad-signature",
	}, token)

	assertStatus(t, recorder, http.StatusForbidden)
	assertErrorMessage(t, recorder, "Invalid payment signature")
}
 ```

## File: ./handlers/ai_docs.go
 ```go
package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type DocSummaryReq struct {
	Markdown string `json:"markdown" binding:"required"`
}

type AskDocAIReq struct {
	Markdown       string `json:"markdown" binding:"required"`
	Question       string `json:"question" binding:"required"`
	ConversationID string `json:"conversationId"`
}

func GenerateDocSummary(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req DocSummaryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := "Please generate a concise summary, table of contents, and keyword tags for the following documentation:\n\n" + req.Markdown
	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
	})

	serviceURL := aiServiceURL()
	if serviceURL == "" {
		respondError(c, http.StatusInternalServerError, "AI service URL is not configured")
		return
	}

	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline or unreachable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respondError(c, http.StatusInternalServerError, "AI error")
		return
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	if err := json.Unmarshal(bodyBytes, &aiResp); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to parse AI response")
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": aiResp.Answer})
}

func AskDocAI(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req AskDocAIReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := "You are a technical support AI for BizCode. Use the following documentation context to answer the user's question accurately. Be concise and technical.\n\n[CONTEXT]\n" + req.Markdown + "\n\n[USER QUESTION]\n" + req.Question
	aiReqBody, _ := json.Marshal(map[string]interface{}{
		"prompt":         prompt,
		"model":          aiModel(),
		"conversationId": req.ConversationID,
		"stream":         true,
	})

	serviceURL := aiServiceURL()
	if serviceURL == "" {
		respondError(c, http.StatusInternalServerError, "AI service URL is not configured")
		return
	}

	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline or unreachable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respondError(c, http.StatusInternalServerError, "AI error")
		return
	}

	// Set headers for streaming back to the browser
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.Stream(func(w io.Writer) bool {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Bytes()
			var aiChunk struct {
				Response string `json:"response"`
				Done     bool   `json:"done"`
			}
			if err := json.Unmarshal(line, &aiChunk); err == nil {
				// We send the raw response text in a format the frontend can easily read
				c.SSEvent("message", aiChunk.Response)
				if aiChunk.Done {
					return false
				}
			}
		}
		return false
	})
}

func UniversalDocSearchChat(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req struct {
		Question       string `json:"question" binding:"required"`
		ConversationID string `json:"conversationId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// 1. Semantic Search Simulation (Keyword Matching across Docs)
	var docs []models.PremiumDoc
	keywords := strings.Split(req.Question, " ")
	query := config.DB.Limit(3)
	
	for _, kw := range keywords {
		if len(kw) > 3 {
			query = query.Or("title ILIKE ? OR content ILIKE ? OR description ILIKE ?", "%"+kw+"%", "%"+kw+"%", "%"+kw+"%")
		}
	}
	query.Find(&docs)

	// 2. Aggregate Context
	context := "Here are relevant documentation snippets to help you answer:\n\n"
	if len(docs) == 0 {
		context = "No specific documentation matches found. Use your general knowledge about our platform BizCode to help."
	} else {
		for _, doc := range docs {
			context += fmt.Sprintf("DOC [%s]: %s\n\n", doc.Title, doc.Content)
		}
	}

	// 3. AI Stream Request
	prompt := fmt.Sprintf("You are an elite BizCode Support AI. Use the provided INTERNAL CONTEXT to answer the user's question. If the context doesn't have the answer, use your technical knowledge but mention it's general guidance.\n\n[INTERNAL CONTEXT]\n%s\n\n[USER QUESTION]\n%s", context, req.Question)
	
	aiReqBody, _ := json.Marshal(map[string]interface{}{
		"prompt":         prompt,
		"model":          aiModel(),
		"conversationId": req.ConversationID,
		"stream":         true,
	})

	resp, err := http.Post(aiServiceURL()+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline")
		return
	}
	defer resp.Body.Close()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.Stream(func(w io.Writer) bool {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Bytes()
			var aiChunk struct {
				Response string `json:"response"`
				Done     bool   `json:"done"`
			}
			if err := json.Unmarshal(line, &aiChunk); err == nil {
				c.SSEvent("message", aiChunk.Response)
				if aiChunk.Done {
					return false
				}
			}
		}
		return false
	})
}
 ```

## File: ./handlers/analytics.go
 ```go
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
)

type RevenuePoint struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type CategoryMetric struct {
	Category string  `json:"category"`
	Count    int64   `json:"count"`
	Revenue  float64 `json:"revenue"`
}

func GetIntelligenceMetrics(c *gin.Context) {
	// 1. 7-Day Revenue Velocity (Sequential SQL Aggregation)
	var revenueStats []RevenuePoint
	config.DB.Raw(`
		SELECT 
			TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
			SUM(total_price) as revenue
		FROM orders
		WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'
		GROUP BY date_trunc('day', created_at)
		ORDER BY date_trunc('day', created_at) ASC
	`).Scan(&revenueStats)

	// 2. Top Performing Categories
	var categoryStats []CategoryMetric
	config.DB.Raw(`
		SELECT 
			p.category,
			COUNT(oi.id) as count,
			SUM(oi.price * oi.quantity) as revenue
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		JOIN orders o ON o.id = oi.order_id
		WHERE o.status = 'paid'
		GROUP BY p.category
		ORDER BY revenue DESC
		LIMIT 5
	`).Scan(&categoryStats)

	// 3. Conversion Matrix (Simplified: Orders vs Total Users)
	var totalUsers int64
	var totalOrders int64
	config.DB.Table("users").Count(&totalUsers)
	config.DB.Table("orders").Where("status = 'paid'").Count(&totalOrders)

	conversionRate := 0.0
	if totalUsers > 0 {
		conversionRate = (float64(totalOrders) / float64(totalUsers)) * 100
	}

	// 4. Activity Pulse
	var recentSales int64
	config.DB.Table("orders").Where("status = 'paid' AND created_at >= NOW() - INTERVAL '24 hours'").Count(&recentSales)

	c.JSON(http.StatusOK, gin.H{
		"revenueVelocity": revenueStats,
		"topCategories":   categoryStats,
		"conversionRate":  conversionRate,
		"recentSales":     recentSales,
		"totalUsers":      totalUsers,
		"totalOrders":     totalOrders,
		"timestamp":       time.Now(),
	})
}
 ```

## File: ./main.go
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
	allowCredentials := len(allowOrigins) > 0 && !(len(allowOrigins) == 1 && allowOrigins[0] == "*")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: allowCredentials,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/healthz", handlers.Healthz)
	r.GET("/readyz", handlers.Readyz)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	publicLimiter := middleware.RateLimitMiddleware(getEnvInt("RATE_LIMIT_RPM", 120), time.Minute)
	api := r.Group("/api")
	
	auth := api.Group("/auth")
	{
		auth.POST("/register", publicLimiter, handlers.Register)
		auth.POST("/login", publicLimiter, handlers.Login)
		auth.GET("/me", middleware.AuthMiddleware(), handlers.Me)
	}

	products := api.Group("/products")
	{
		products.GET("/", publicLimiter, handlers.ListProducts)
		products.GET("/:id", publicLimiter, handlers.GetProduct)
		products.GET("/:id/share", handlers.ServeProductSEO)
		products.GET("/:id/download", middleware.AuthMiddleware(), handlers.DownloadSecureAsset)
		products.POST("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.CreateProduct)
		products.PUT("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateProduct)
		products.DELETE("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.DeleteProduct)
	}

	orders := api.Group("/orders")
	orders.Use(middleware.AuthMiddleware())
	{
		orders.POST("/", handlers.CreateOrder)
		orders.GET("/myorders", handlers.MyOrders)
	}

	adminOrders := api.Group("/admin/orders")
	adminOrders.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminOrders.GET("/", handlers.AdminListOrders)
		adminOrders.GET("/:id", handlers.AdminGetOrder)
		adminOrders.PATCH("/:id", handlers.AdminUpdateOrder)
	}

	adminUsers := api.Group("/admin/users")
	adminUsers.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminUsers.GET("", handlers.ListUsers)
		adminUsers.PATCH("/:id", handlers.UpdateUser)
		adminUsers.POST("/:id/reset-password", handlers.ResetUserPassword)
	}

	siteConfig := api.Group("/config")
	{
		siteConfig.GET("/", handlers.GetConfig)
		siteConfig.GET("/admin", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.GetAdminConfig)
		siteConfig.PUT("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateConfig)
	}

	docs := api.Group("/docs")
	{
		docs.GET("/", publicLimiter, handlers.ListDocs)
		docs.GET("/:id", publicLimiter, handlers.GetDoc)
		docs.POST("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.CreateDoc)
		docs.PUT("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateDoc)
		docs.DELETE("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.DeleteDoc)
	}


	api.POST("/upload", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UploadFile)

	// OAuth
	auth.GET("/google/login", handlers.GoogleLogin)
	auth.GET("/google/callback", handlers.GoogleCallback)
	auth.GET("/github/login", handlers.GithubLogin)
	auth.GET("/github/callback", handlers.GithubCallback)

	// AI Extended
	ai := api.Group("/ai")
	{
		ai.GET("/recommend", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GetAIRecommendation)
		ai.POST("/roadmap", middleware.AuthMiddleware(), handlers.GetUserRoadmap)
		ai.POST("/docsummary", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GenerateDocSummary)
		ai.POST("/doc-universal", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.UniversalDocSearchChat)
		ai.POST("/chat", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.AskDocAI)
	}

	chat := api.Group("/chat")
	chat.Use(middleware.AuthMiddleware())
	{
		chat.GET("/ws", handlers.ServeChatWs)
		chat.GET("/history", handlers.GetChatHistory)
	}

	analytics := api.Group("/analytics")
	analytics.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		analytics.GET("/metrics", handlers.GetIntelligenceMetrics)
	}

	// Reviews
	products.POST("/:id/review", middleware.AuthMiddleware(), handlers.CreateReview)
	products.GET("/:id/reviews", handlers.GetReviews)
	products.GET("/:id/review-eligibility", middleware.AuthMiddleware(), handlers.GetReviewEligibility)

	adminReviews := api.Group("/admin/reviews")
	adminReviews.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminReviews.GET("/", handlers.AdminListReviews)
		adminReviews.PATCH("/:id", handlers.AdminUpdateReview)
		adminReviews.DELETE("/:id", handlers.AdminDeleteReview)
	}

	// Payments (Razorpay)
	payments := api.Group("/payments")
	{
		payments.POST("/create-order", middleware.AuthMiddleware(), handlers.CreateRazorpayOrder)
		payments.POST("/verify", middleware.AuthMiddleware(), handlers.VerifyRazorpayPayment)
	}

	// Testimonials
	api.GET("/testimonials", handlers.GetApprovedTestimonials)
	api.POST("/testimonials", middleware.AuthMiddleware(), handlers.CreateTestimonial)

	adminTestimonials := api.Group("/admin/testimonials")
	adminTestimonials.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminTestimonials.GET("/", handlers.AdminListTestimonials)
		adminTestimonials.PATCH("/:id/approve", handlers.AdminApproveTestimonial)
		adminTestimonials.PATCH("/:id/reject", handlers.AdminRejectTestimonial)
		adminTestimonials.DELETE("/:id", handlers.AdminDeleteTestimonial)
	}

	marketingHandler := handlers.NewMarketingHandler(config.DB)
	
	adminMarketing := api.Group("/admin/marketing")
	adminMarketing.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminMarketing.GET("/coupons", marketingHandler.ListCoupons)
		adminMarketing.POST("/coupons", marketingHandler.CreateCoupon)
		adminMarketing.DELETE("/coupons/:id", marketingHandler.DeleteCoupon)
	}

	// Showcase & Social Proof
	api.POST("/showcase", middleware.AuthMiddleware(), handlers.SubmitShowcase)
	adminShowcases := api.Group("/admin/showcases")
	adminShowcases.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminShowcases.GET("/", handlers.AdminListShowcases)
		adminShowcases.PATCH("/:id/status", handlers.AdminUpdateShowcaseStatus)
	}

	marketing := api.Group("/marketing")
	{
		marketing.GET("/validate", marketingHandler.ValidateCoupon)
		marketing.GET("/wishlist-deals", middleware.AuthMiddleware(), marketingHandler.GetWishlistDeals)
		marketing.POST("/personalized-offers", middleware.AuthMiddleware(), marketingHandler.GetPersonalizedOffers)
	}

	adminIntelligence := api.Group("/admin/intelligence")
	adminIntelligence.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminIntelligence.GET("/metrics", handlers.GetIntelligenceMetrics)
	}

	webhooks := api.Group("/webhooks")
	{
		webhooks.POST("/razorpay", handlers.RazorpayWebhook)
	}

	// Contact Inquiries
	api.POST("/contact", handlers.CreateContactInquiry)
	api.GET("/my-inquiries", middleware.AuthMiddleware(), handlers.MyInquiries)

	adminContact := api.Group("/admin/contact")
	adminContact.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminContact.GET("/", handlers.AdminListInquiries)
		adminContact.PATCH("/:id/reply", handlers.AdminReplyToInquiry)
	}

	adminLicenses := api.Group("/admin/licenses")
	adminLicenses.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminLicenses.POST("/issue", handlers.AdminIssueLicenses)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func allowedOriginsFromEnv() []string {
	raw := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if raw == "" {
		return []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}
	}

	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return []string{"http://localhost:5173"}
	}

	return origins
}

func sameSiteMode() http.SameSite {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAMESITE"))) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func getEnvInt(key string, fallback int) int {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
	}
	return fallback
}
 ```

## File: ./services/r2.go
 ```go
package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
	"time"
)

var S3Client *s3.Client

func InitR2() error {
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKeyID := os.Getenv("R2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("R2_SECRET_ACCESS_KEY")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return err
	}

	S3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
	})
	return nil
}

func UploadFile(file multipart.File, header *multipart.FileHeader) (string, error) {
	bucket := os.Getenv("R2_BUCKET_NAME")
	filename := uuid.New().String() + "-" + header.Filename

	_, err := S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(filename),
		Body:   file,
	})
	if err != nil {
		return "", err
	}

	publicURL := os.Getenv("R2_PUBLIC_URL")
	if publicURL != "" {
		return fmt.Sprintf("%s/%s", publicURL, filename), nil
	}

	accountID := os.Getenv("R2_ACCOUNT_ID")
	return fmt.Sprintf("https://%s.r2.cloudflarestorage.com/%s/%s", accountID, bucket, filename), nil
}

func CheckR2(ctx context.Context) error {
	if S3Client == nil {
		return errors.New("r2 client not initialized")
	}

	bucket := os.Getenv("R2_BUCKET_NAME")
	if bucket == "" {
		return errors.New("r2 bucket is not configured")
	}

	_, err := S3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucket),
		ExpectedBucketOwner: nil,
	})
	if err != nil {
		var noBucket *types.NotFound
		if errors.As(err, &noBucket) {
			return errors.New("r2 bucket not found")
		}
		return err
	}

	return nil
}

func GeneratePresignedURL(key string) (string, error) {
	if S3Client == nil {
		return "", errors.New("r2 client not initialized")
	}

	bucket := os.Getenv("R2_BUCKET_NAME")
	presignClient := s3.NewPresignClient(S3Client)

	// Set expiration to 15 minutes
	request, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(15*time.Minute))
	
	if err != nil {
		return "", err
	}

	return request.URL, nil
}
 ```

