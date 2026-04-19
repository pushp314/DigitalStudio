package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"golang.org/x/crypto/bcrypt"
)

type UpdateUserReq struct {
	Name             string `json:"name"`
	Role             string `json:"role"`
	SubscriptionPlan string `json:"subscriptionPlan"`
	Suspended        *bool  `json:"suspended"`
}

type ResetPasswordReq struct {
	Password string `json:"password" binding:"required,min=6"`
}

func ListUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	c.JSON(http.StatusOK, users)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req UpdateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if strings.TrimSpace(req.Name) != "" {
		user.Name = req.Name
	}
	if strings.TrimSpace(req.Role) != "" {
		switch models.Role(strings.ToLower(req.Role)) {
		case models.RoleUser, models.RoleAdmin, models.RoleContributor:
			user.Role = models.Role(strings.ToLower(req.Role))
		default:
			respondError(c, http.StatusBadRequest, "Unsupported role")
			return
		}
	}
	if strings.TrimSpace(req.SubscriptionPlan) != "" {
		user.SubscriptionPlan = strings.ToLower(req.SubscriptionPlan)
	}
	if req.Suspended != nil {
		user.Suspended = *req.Suspended
	}

	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to update user")
		return
	}

	c.JSON(http.StatusOK, user)
}

func ResetUserPassword(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req ResetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
