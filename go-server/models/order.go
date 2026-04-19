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
