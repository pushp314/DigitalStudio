package handlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
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

// GetPublicProfile returns sanitized user data for community discovery
func GetPublicProfile(c *gin.Context) {
	idOrUsername := c.Param("id")
	var user models.User

	// Try numeric ID first, then username
	if id, err := strconv.ParseUint(idOrUsername, 10, 32); err == nil {
		if err := config.DB.First(&user, id).Error; err != nil {
			config.DB.Where("username = ?", idOrUsername).First(&user)
		}
	} else {
		config.DB.Where("username = ?", idOrUsername).First(&user)
	}

	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Trigger GitHub Sync if linked and not synced in last hour
	if user.Github != "" {
		shouldSync := user.LastGithubSync == nil || time.Since(*user.LastGithubSync) > time.Hour
		if shouldSync {
			if stats, err := services.FetchGithubStats(user.Github); err == nil {
				user.TotalCommits = stats.Commits
				user.TotalStars = stats.Stars
				user.TotalFollowers = stats.Followers
				user.TotalGists = stats.Gists
				user.GithubAccountAge = stats.AccountAge
				now := time.Now()
				user.LastGithubSync = &now
				config.DB.Save(&user)
			}
		}
	}

	// Fetch user's approved products
	var products []models.Product
	config.DB.Where("author_id = ? AND moderation_status = ?", user.ID, models.ModStatusApproved).Order("created_at desc").Limit(6).Find(&products)

	// Fetch user's approved showcases and expose the legacy public-card shape.
	var showcases []models.Showcase
	config.DB.Preload("Product").
		Where("user_id = ? AND status = ?", user.ID, models.ShowcaseApproved).
		Order("created_at desc").
		Limit(4).
		Find(&showcases)
	publicShowcases := make([]gin.H, 0, len(showcases))
	for _, showcase := range showcases {
		title := showcase.Product.Title
		if title == "" {
			title = "Live implementation"
		}
		thumbnail := showcase.Screenshot
		if thumbnail == "" {
			thumbnail = showcase.Product.Image
		}
		publicShowcases = append(publicShowcases, gin.H{
			"id":          showcase.ID,
			"projectName": title,
			"liveUrl":     showcase.LiveURL,
			"thumbnail":   thumbnail,
			"productId":   showcase.ProductID,
			"createdAt":   showcase.CreatedAt,
		})
	}

	// Sanitize output
	sanitized := gin.H{
		"id":               user.ID,
		"username":         user.Username,
		"name":             user.Name,
		"role":             user.Role,
		"subscriptionPlan": user.SubscriptionPlan,
		"createdAt":        user.CreatedAt,
		"bio":              user.Bio,
		"website":          user.Website,
		"github":           user.Github,
		"twitter":          user.Twitter,
		"xp":               user.XP,
		"rank":             user.Rank,
		"commits":          user.TotalCommits,
		"stars":            user.TotalStars,
		"followers":        user.TotalFollowers,
		"gists":            user.TotalGists,
		"accountAge":       user.GithubAccountAge,
		"deployments":      user.TotalDeployments,
		"avatarUrl":        user.AvatarURL,
		"products":         products,
		"showcases":        publicShowcases,
	}

	c.JSON(http.StatusOK, sanitized)
}

// UpdateMyProfile allows a user to update their own profile fields
func UpdateMyProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Name         string `json:"name"`
		Username     string `json:"username"`
		Bio          string `json:"bio"`
		Website      string `json:"website"`
		Github       string `json:"github"`
		Twitter      string `json:"twitter"`
		ChatSettings string `json:"chatSettings"`
		AvatarURL    string `json:"avatarUrl"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalizedUsername := ""
	if req.Username != "" {
		var valid bool
		normalizedUsername, valid = normalizeUsername(req.Username)
		if !valid {
			respondError(c, http.StatusBadRequest, "Username must be 3-30 characters and use only letters, numbers, and underscores")
			return
		}
	}

	if normalizedUsername != "" && (user.Username == nil || normalizedUsername != *user.Username) {
		// 30-Day Restriction Logic
		if user.LastUsernameChangeAt != nil {
			nextAvailable := user.LastUsernameChangeAt.Add(30 * 24 * time.Hour)
			if time.Now().Before(nextAvailable) {
				daysLeft := int(time.Until(nextAvailable).Hours() / 24)
				if daysLeft < 1 {
					respondError(c, http.StatusForbidden, "Identity locked. You can update your handle again in less than a day.")
				} else {
					respondError(c, http.StatusForbidden, fmt.Sprintf("Identity locked. You can update your handle again in %d days.", daysLeft))
				}
				return
			}
		}

		var existing models.User
		if err := config.DB.Where("username = ?", normalizedUsername).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
		user.Username = &normalizedUsername
		now := time.Now()
		user.LastUsernameChangeAt = &now
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	user.Bio = req.Bio
	user.Website = req.Website
	user.Github = req.Github
	user.Twitter = req.Twitter
	if req.ChatSettings != "" {
		user.ChatSettings = req.ChatSettings
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}

	if err := config.DB.Save(&user).Error; err != nil {
		log.Printf("Profile update failed for user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ReportUser logs a violation for a specific user profile
func ReportUser(c *gin.Context) {
	idOrUsername := c.Param("id")
	var user models.User
	// Try numeric ID first, then username
	if id, err := strconv.ParseUint(idOrUsername, 10, 32); err == nil {
		if err := config.DB.First(&user, id).Error; err != nil {
			config.DB.Where("username = ?", idOrUsername).First(&user)
		}
	} else {
		config.DB.Where("username = ?", idOrUsername).First(&user)
	}

	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
		return
	}

	actorID, _ := c.Get("userID")
	actor := actorID.(uint)
	resourceID := user.ID
	reportedName := user.Name
	if user.Username != nil && *user.Username != "" {
		reportedName = "@" + *user.Username
	}
	services.WriteAuditLog(nil, services.AuditEvent{
		RequestID:    requestIDFromContext(c),
		ActorUserID:  &actor,
		EventType:    "user.profile_reported",
		ResourceType: "user",
		ResourceID:   &resourceID,
		Message:      fmt.Sprintf("User %s reported: %s", reportedName, req.Reason),
		Metadata: map[string]interface{}{
			"reason": req.Reason,
		},
	})

	c.JSON(http.StatusOK, gin.H{"status": "Violation logged for administrative review"})
}

func normalizeUsername(raw string) (string, bool) {
	username := strings.ToLower(strings.TrimLeft(strings.TrimSpace(raw), "@"))
	if len(username) < 3 || len(username) > 30 {
		return "", false
	}
	for _, ch := range username {
		if (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_' {
			continue
		}
		return "", false
	}
	return username, true
}
