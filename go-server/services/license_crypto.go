package services

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/pushp314/bizcode/go-server/config"
)

// LicenseTokenClaims are the signed claims embedded inside a license token.
type LicenseTokenClaims struct {
	LicenseID   string `json:"lid"`
	ProductID   uint   `json:"pid"`
	UserID      uint   `json:"uid"`
	Plan        string `json:"plan"`
	MaxAct      int    `json:"max_act"`
	BindingMode string `json:"bind,omitempty"`
	IssuedAt    int64  `json:"iat"`
	ExpiresAt   int64  `json:"exp,omitempty"` // 0 = perpetual
}

var (
	signingKeyOnce sync.Once
	privateKey     ed25519.PrivateKey
	publicKey      ed25519.PublicKey
	keyInitErr     error
)

// InitLicenseKeys loads Ed25519 keys for license signing from the central config.
func InitLicenseKeys() error {
	signingKeyOnce.Do(func() {
		seed := config.AppConfig.LicenseSigningKey
		if len(seed) == ed25519.SeedSize {
			privateKey = ed25519.NewKeyFromSeed(seed)
			publicKey = privateKey.Public().(ed25519.PublicKey)
		} else if config.AppConfig.AppEnv != "production" {
			// Generate ephemeral keys for local development ONLY
			pub, priv, err := ed25519.GenerateKey(nil)
			if err != nil {
				keyInitErr = fmt.Errorf("failed to generate ephemeral Ed25519 key: %w", err)
				return
			}
			privateKey = priv
			publicKey = pub
			slog.Warn("license_keys_ephemeral",
				slog.String("note", "Using ephemeral keys for DEV. Set LICENSE_SIGNING_KEY for stable production licenses."),
				slog.String("public_key", base64.StdEncoding.EncodeToString(pub)),
			)
		} else {
			keyInitErr = errors.New("LICENSE_SIGNING_KEY is missing or invalid in production")
		}
	})
	return keyInitErr
}

// GetPublicKeyBase64 returns the public verification key in base64 for embedding in products.
func GetPublicKeyBase64() string {
	if publicKey == nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(publicKey)
}

// SignLicenseToken creates a signed license token from claims.
// Format: base64(claims_json).base64(ed25519_signature)
func SignLicenseToken(claims LicenseTokenClaims) (string, error) {
	if privateKey == nil {
		if err := InitLicenseKeys(); err != nil {
			return "", err
		}
	}
	if privateKey == nil {
		return "", errors.New("signing key not initialized")
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("failed to marshal claims: %w", err)
	}

	claimsB64 := base64.RawURLEncoding.EncodeToString(claimsJSON)
	signature := ed25519.Sign(privateKey, claimsJSON)
	sigB64 := base64.RawURLEncoding.EncodeToString(signature)

	return claimsB64 + "." + sigB64, nil
}

// VerifyLicenseToken verifies the signature and decodes claims.
func VerifyLicenseToken(token string) (*LicenseTokenClaims, error) {
	if publicKey == nil {
		if err := InitLicenseKeys(); err != nil {
			return nil, err
		}
	}

	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return nil, errors.New("invalid token format")
	}

	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("invalid claims encoding")
	}

	sigBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid signature encoding")
	}

	if !ed25519.Verify(publicKey, claimsJSON, sigBytes) {
		return nil, errors.New("signature verification failed")
	}

	var claims LicenseTokenClaims
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, fmt.Errorf("failed to decode claims: %w", err)
	}

	// Check expiry
	if claims.ExpiresAt > 0 && time.Unix(claims.ExpiresAt, 0).Before(time.Now()) {
		return &claims, errors.New("token expired")
	}

	return &claims, nil
}

// HashToken creates a SHA-256 hash of a token for safe storage.
func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
