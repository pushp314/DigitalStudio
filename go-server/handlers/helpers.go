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
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/middleware"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/utils"
)

type authResponse struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refreshToken,omitempty"`
	User         models.User `json:"user"`
}

func respondError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}

func issueJWT(user models.User) (string, error) {
	return utils.IssueJWT(user)
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
	user = utils.NormalizeUserAccess(user)
	token, err := issueJWT(user)
	if err != nil {
		return authResponse{}, errors.New("failed to generate access token")
	}

	refreshTokenString, err := utils.GenerateRefreshToken()
	if err != nil {
		return authResponse{}, errors.New("failed to generate refresh token")
	}

	refreshToken := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshTokenString,
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days
	}

	if err := config.DB.Create(&refreshToken).Error; err != nil {
		return authResponse{}, errors.New("failed to persist refresh token")
	}

	return authResponse{
		Token:        token,
		RefreshToken: refreshTokenString,
		User:         user,
	}, nil
}

func redirectOAuthSuccess(c *gin.Context, user models.User) {
	payload, err := buildAuthResponse(user)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	frontendURL := getFrontendURL()
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

	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if tokenString == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, errors.New("invalid authorization header format")
	}

	claims, err := utils.ParseJWT(tokenString)
	if err != nil {
		return nil, errors.New("invalid token")
	}

	var user models.User
	if err := config.DB.First(&user, claims.UserID).Error; err != nil {
		return nil, err
	}
	if user.Suspended {
		return nil, errors.New("account suspended")
	}

	normalized := utils.NormalizeUserAccess(user)
	return &normalized, nil
}

func requestIDFromContext(c *gin.Context) string {
	if c == nil {
		return ""
	}
	if requestID, ok := c.Get(middleware.RequestIDKey); ok {
		if value, valid := requestID.(string); valid {
			return value
		}
	}
	return ""
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

func getFrontendURL() string {
	var siteConfig models.SiteConfig
	if config.DB != nil {
		// Ensure schema is up to date for this struct to avoid 500 errors on missing columns
		_ = config.DB.AutoMigrate(&models.SiteConfig{}, &models.RefreshToken{})
		if config.DB.First(&siteConfig).Error == nil {
			if url := strings.TrimRight(strings.TrimSpace(siteConfig.FrontendURL), "/"); url != "" {
				return url
			}
		}
	}
	return getEnv("FRONTEND_URL", "http://localhost:5173")
}


func aiModel() string {
	var siteConfig models.SiteConfig
	if config.DB != nil && config.DB.First(&siteConfig).Error == nil {
		if trimmed := strings.TrimSpace(siteConfig.AISettings.Model); trimmed != "" {
			return trimmed
		}
	}

	return "gemini-2.5-flash"
}

func aiApiKey() string {
	var siteConfig models.SiteConfig
	if config.DB != nil && config.DB.First(&siteConfig).Error == nil {
		if trimmed := strings.TrimSpace(siteConfig.AISettings.APIKey); trimmed != "" {
			return trimmed
		}
	}
	return getEnv("AI_API_KEY", "")
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
