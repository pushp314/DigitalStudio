package utils

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pushp314/bizcode/go-server/models"
)

const TokenIssuer = "bizcode-api"

type AuthClaims struct {
	UserID           uint        `json:"user_id"`
	Role             models.Role `json:"role"`
	SubscriptionPlan string      `json:"subscriptionPlan"`
	jwt.RegisteredClaims
}

func IssueJWT(user models.User) (string, error) {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		return "", errors.New("jwt secret is not configured")
	}

	now := time.Now()
	normalized := NormalizeUserAccess(user)
	claims := AuthClaims{
		UserID:           normalized.ID,
		Role:             normalized.Role,
		SubscriptionPlan: normalized.SubscriptionPlan,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatUint(uint64(normalized.ID), 10),
			Issuer:    TokenIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now.Add(-1 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(now.Add(72 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseJWT(tokenString string) (*AuthClaims, error) {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		return nil, errors.New("jwt secret is not configured")
	}

	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithLeeway(30*time.Second),
	)

	token, err := parser.ParseWithClaims(tokenString, &AuthClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	if claims.UserID == 0 {
		if claims.Subject == "" {
			return nil, errors.New("token subject is missing")
		}
		parsed, convErr := strconv.ParseUint(claims.Subject, 10, 64)
		if convErr != nil || parsed == 0 {
			return nil, errors.New("token subject is invalid")
		}
		claims.UserID = uint(parsed)
	}

	return claims, nil
}
func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
