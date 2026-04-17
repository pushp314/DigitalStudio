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
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
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

	return &user, nil
}

func aiServiceURL() string {
	return strings.TrimRight(os.Getenv("AI_SERVICE_URL"), "/")
}
