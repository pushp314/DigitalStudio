package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func ListUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	c.JSON(http.StatusOK, users)
}
