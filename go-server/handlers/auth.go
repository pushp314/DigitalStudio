package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"golang.org/x/crypto/bcrypt"
)

type RegisterReq struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

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
	}

	if err := config.DB.Create(&user).Error; err != nil {
		respondError(c, http.StatusBadRequest, "Email already exists")
		return
	}

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

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		respondError(c, http.StatusUnauthorized, "Invalid credentials")
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
