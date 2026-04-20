package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
	"golang.org/x/crypto/bcrypt"
	"strconv"
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
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	var users []models.User
	query := config.DB.Order("created_at desc")

	if search != "" {
		searchStr := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", searchStr, searchStr)
	}

	var total int64
	query.Model(&models.User{}).Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
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

	if actorID, ok := c.Get("userID"); ok {
		actor := actorID.(uint)
		resourceID := user.ID
		services.WriteAuditLog(nil, services.AuditEvent{
			RequestID:    requestIDFromContext(c),
			ActorUserID:  &actor,
			EventType:    "admin.user_updated",
			ResourceType: "user",
			ResourceID:   &resourceID,
			Message:      "Admin updated user profile fields",
			Metadata: map[string]interface{}{
				"role":             user.Role,
				"subscriptionPlan": user.SubscriptionPlan,
				"suspended":        user.Suspended,
			},
		})
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

	if actorID, ok := c.Get("userID"); ok {
		actor := actorID.(uint)
		resourceID := user.ID
		services.WriteAuditLog(nil, services.AuditEvent{
			RequestID:    requestIDFromContext(c),
			ActorUserID:  &actor,
			EventType:    "admin.user_password_reset",
			ResourceType: "user",
			ResourceID:   &resourceID,
			Message:      "Admin reset a user password",
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
