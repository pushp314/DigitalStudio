package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
	"github.com/pushp314/bizcode/go-server/utils"
	"golang.org/x/crypto/bcrypt"
	"time"
)

type RegisterReq struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=6"`
	ReferrerCode string `json:"referrerCode"` // Partner code of the inviter
}

func Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		Name:             req.Name,
		Email:            req.Email,
		Password:         string(hashedPassword),
		Role:             models.RoleUser,
		SubscriptionPlan: "free",
		PartnerCode:      func(s string) *string { return &s }(utils.GeneratePartnerCode(req.Name)),
	}

	// Link Referrer if provided
	if req.ReferrerCode != "" {
		var referrer models.User
		if err := config.DB.Where("partner_code = ?", req.ReferrerCode).First(&referrer).Error; err == nil {
			user.ReferrerID = &referrer.ID
		}
	}

	// Growth Matrix: Trigger 10-minute Flash Window
	now := time.Now()
	flashExpiry := now.Add(10 * time.Minute)
	user.FlashSaleExpiresAt = &flashExpiry

	if err := config.DB.Create(&user).Error; err != nil {
		respondError(c, http.StatusBadRequest, "Email already exists or internal error")
		return
	}

	// Async Welcome Email
	go func(email, name string) {
		if err := services.Mailer.SendWelcomeEmail(email, name); err != nil {
			services.LogServiceError("email.welcome", err, "to", email)
		}
	}(user.Email, user.Name)

	respondAuthSuccess(c, http.StatusCreated, user)
}

type LoginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		respondError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}
	if user.Suspended {
		respondError(c, http.StatusForbidden, "Account suspended")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		respondError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	respondAuthSuccess(c, http.StatusOK, user)
}

func Me(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		respondError(c, http.StatusNotFound, "User not found in context")
		return
	}
	c.JSON(http.StatusOK, user)
}
func AdminListUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	c.JSON(http.StatusOK, users)
}

func AdminUpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if role, ok := req["role"].(string); ok {
		user.Role = models.Role(role)
	}
	if plan, ok := req["subscriptionPlan"].(string); ok {
		user.SubscriptionPlan = plan
	}
	if suspended, ok := req["suspended"].(bool); ok {
		user.Suspended = suspended
	}
	if password, ok := req["password"].(string); ok && password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err == nil {
			user.Password = string(hashedPassword)
		}
	}

	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update user")
		return
	}

	c.JSON(http.StatusOK, user)
}

func ChangePassword(c *gin.Context) {
	val, _ := c.Get("userID")
	uid := val.(uint)

	var req struct {
		OldPassword string `json:"oldPassword" binding:"required"`
		NewPassword string `json:"newPassword" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := config.DB.First(&user, uid).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		respondError(c, http.StatusUnauthorized, "Incorrect current password")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to hash new password")
		return
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save new password")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
func RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Refresh token is required")
		return
	}

	var storedToken models.RefreshToken
	if err := config.DB.Preload("User").Where("token = ?", req.RefreshToken).First(&storedToken).Error; err != nil {
		respondError(c, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	if storedToken.IsExpired() {
		respondError(c, http.StatusUnauthorized, "Refresh token expired")
		return
	}

	if storedToken.IsRevoked() {
		respondError(c, http.StatusUnauthorized, "Refresh token revoked")
		return
	}

	// Revoke old token
	now := time.Now()
	storedToken.RevokedAt = &now
	config.DB.Save(&storedToken)

	// Issue new pair
	respondAuthSuccess(c, http.StatusOK, storedToken.User)
}
