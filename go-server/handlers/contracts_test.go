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
	assertStatus(t, recorder, http.StatusServiceUnavailable)
	assertErrorMessage(t, recorder, "AI service is not configured")
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
