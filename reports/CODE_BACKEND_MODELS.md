# Backend Models - BizCode

This file contains all GORM database models.

---

## models/user.go
```go
package models

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Name             string         `json:"name"`
	Email            string         `gorm:"uniqueIndex" json:"email"`
	Password         string         `json:"-"`
	Role             string         `gorm:"default:'user'" json:"role"`
	SubscriptionPlan string         `gorm:"default:'free'" json:"subscriptionPlan"`
	ProExpiresAt     *time.Time     `json:"proExpiresAt"`
	IsPro            bool           `gorm:"default:false" json:"isPro"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}
```

## models/product.go
```go
package models

import "time"

type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Slug        string    `gorm:"uniqueIndex" json:"slug"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Category    string    `json:"category"`
	Thumbnail   string    `json:"thumbnail"`
	AssetURL    string    `json:"assetUrl"`
	PreviewURL  string    `json:"previewUrl"`
	IsFeatured  bool      `json:"isFeatured"`
	LicenseType string    `json:"licenseType"`
	Version     string    `json:"version"`
	CreatedAt   time.Time `json:"createdAt"`
}
```

## models/chat.go
```go
package models

import "time"

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	Content   string    `json:"content"`
	Type      string    `gorm:"default:'text'" json:"type"`
	IsPro     bool      `json:"isPro"`
	CreatedAt time.Time `json:"createdAt"`
}
```

## models/order.go
```go
package models

import "time"

type Order struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `json:"userId"`
	ProductID     uint      `json:"productId"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Status        string    `json:"status"` // pending, completed, failed
	PaymentID     string    `json:"paymentId"`
	OrderReference string    `json:"orderReference"`
	CreatedAt     time.Time `json:"createdAt"`
}

type OrderItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderID   uint    `json:"orderId"`
	ProductID uint    `json:"productId"`
	Price     float64 `json:"price"`
}
```

## models/site_config.go
```go
package models

import (
	"encoding/json"
	"gorm.io/gorm"
)

type SiteConfig struct {
	gorm.Model
	MaintenanceMode    bool            `json:"maintenanceMode"`
	MaintenanceMessage string          `json:"maintenanceMessage"`
	ShowAnnouncement   bool            `json:"showAnnouncement"`
	Announcements      json.RawMessage `json:"announcements" gorm:"type:jsonb"`
	HeroTitle          string          `json:"heroTitle"`
	HeroSubtitle       string          `json:"heroSubtitle"`
	Features           json.RawMessage `json:"features" gorm:"type:jsonb"`
	ThemeConfig        json.RawMessage `json:"themeConfig" gorm:"type:jsonb"`
}
```

## models/review.go
```go
package models

import "time"

type Review struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID uint      `json:"productId"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	IsVerified bool      `json:"isVerified"`
	CreatedAt time.Time `json:"createdAt"`
}
```

## models/testimonial.go
```go
package models

import "time"

type Testimonial struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	Avatar    string    `json:"avatar"`
	Content   string    `json:"content"`
	Rating    int       `json:"rating"`
	JobTitle  string    `json:"jobTitle"`
	IsApproved bool     `gorm:"default:false" json:"isApproved"`
	CreatedAt time.Time `json:"createdAt"`
}
```
