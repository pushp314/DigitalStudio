package handlers

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/middleware"
	"github.com/pushp314/digitalstudio/go-server/models"
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

func TestAuthMiddlewareRejectsQueryTokenOutsideWebsocket(t *testing.T) {
	setupTestDB(t)

	user := seedUser(t, "query-token@example.com", models.RoleUser, "free", "secret123")
	token := mustIssueToken(t, user)

	router := newRouter()
	router.GET("/api/secure", middleware.AuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	recorder := performJSONRequest(t, router, http.MethodGet, "/api/secure?token="+token, nil, "")
	assertStatus(t, recorder, http.StatusUnauthorized)
}

func TestWebsocketAuthMiddlewareAllowsQueryToken(t *testing.T) {
	setupTestDB(t)

	user := seedUser(t, "ws-token@example.com", models.RoleUser, "free", "secret123")
	token := mustIssueToken(t, user)

	router := newRouter()
	router.GET("/api/chat/ws", middleware.WebsocketAuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	recorder := performJSONRequest(t, router, http.MethodGet, "/api/chat/ws?token="+token, nil, "")
	assertStatus(t, recorder, http.StatusOK)
}
