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
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
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
		&models.Coupon{},
		&models.Testimonial{},
		&models.ContactInquiry{},
		&models.ChatMessage{},
		&models.AuditLog{},
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
