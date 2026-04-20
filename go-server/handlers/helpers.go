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

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/middleware"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/utils"
)

type authResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
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

func getFrontendURL() string {
	var siteConfig models.SiteConfig
	if config.DB != nil {
		// Ensure schema is up to date for this struct to avoid 500 errors on missing columns
		_ = config.DB.AutoMigrate(&models.SiteConfig{})
		if config.DB.First(&siteConfig).Error == nil {
			if url := strings.TrimRight(strings.TrimSpace(siteConfig.FrontendURL), "/"); url != "" {
				return url
			}
		}
	}
	url := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	if url == "" {
		return "http://localhost:5173" // Default fallback
	}
	return url
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
