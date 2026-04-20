package models

import (
	"time"
)

type OrderStatus string

const (
	OrderStatusPending  OrderStatus = "pending"
	OrderStatusPaid     OrderStatus = "paid"
	OrderStatusFailed   OrderStatus = "failed"
	OrderStatusRefunded OrderStatus = "refunded"
)

type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusPaid     PaymentStatus = "paid"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusRefunded PaymentStatus = "refunded"
)

type EntitlementStatus string

const (
	EntitlementAuto    EntitlementStatus = "auto"
	EntitlementGranted EntitlementStatus = "granted"
	EntitlementRevoked EntitlementStatus = "revoked"
)

type Order struct {
	ID                   uint        `gorm:"primaryKey" json:"id"`
	UserID               uint        `gorm:"not null" json:"userId"`
	User                 User        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user,omitempty"`
	SubtotalPrice        float64     `gorm:"type:numeric(10,2);not null;default:0" json:"subtotalPrice"`
	DiscountAmount       float64     `gorm:"type:numeric(10,2);not null;default:0" json:"discountAmount"`
	TotalPrice           float64     `gorm:"type:numeric(10,2);not null;default:0" json:"totalPrice"`
	Currency             string      `gorm:"type:varchar(8);not null;default:'INR'" json:"currency"`
	Status               string      `gorm:"type:varchar(50);default:'pending'" json:"status"`
	PaymentStatus        string      `gorm:"type:varchar(50);default:'pending'" json:"paymentStatus"`
	EntitlementStatus    string      `gorm:"type:varchar(50);default:'auto'" json:"entitlementStatus"`
	CouponID             *uint       `json:"couponId,omitempty"`
	CouponCode           string      `gorm:"type:varchar(100);default:''" json:"couponCode,omitempty"`
	CouponReserved       bool        `gorm:"not null;default:false" json:"couponReserved"`
	RazorpayOrderID      string      `gorm:"type:varchar(255)" json:"razorpayOrderId"`
	RazorpayPaymentID    string      `gorm:"type:varchar(255)" json:"razorpayPaymentId"`
	RazorpaySignature    string      `gorm:"type:varchar(255)" json:"razorpaySignature"`
	SettledAt            *time.Time  `json:"settledAt,omitempty"`
	PaymentCapturedAt    *time.Time  `json:"paymentCapturedAt,omitempty"`
	SettlementSource     string      `gorm:"type:varchar(50)" json:"settlementSource,omitempty"`
	PartnerRewardSettled bool        `gorm:"not null;default:false" json:"partnerRewardSettled"`
	PartnerRewardAmount  float64     `gorm:"type:numeric(10,2);not null;default:0" json:"partnerRewardAmount"`
	OrderItems           []OrderItem `gorm:"foreignKey:OrderID" json:"orderItems,omitempty"`
	Entitled             bool        `gorm:"-" json:"entitled"`
	CreatedAt            time.Time   `json:"createdAt"`
	UpdatedAt            time.Time   `json:"updatedAt"`
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
		Raw(sql string, values ...interface{}) interface {
			Scan(dest interface{}) interface{}
		}
	}
	// Simplified check for now: exists a paid order with this product
	// We'll use a direct query in the handler for simplicity with DB object
	return false
}
