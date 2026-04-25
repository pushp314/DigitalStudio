package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/services"
)

func UploadFile(c *gin.Context) {
	scope := services.UploadScope(strings.TrimSpace(c.PostForm("scope")))
	if scope == "" {
		scope = services.UploadScopePublicImage
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "Failed to get file from request")
		return
	}
	defer file.Close()

	result, err := services.UploadValidatedFile(c.Request.Context(), file, header, scope)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "r2 client") || strings.Contains(err.Error(), "bucket") {
			status = http.StatusInternalServerError
		}
		respondError(c, status, err.Error())
		return
	}

	c.JSON(http.StatusOK, result)
}

func UploadProfileAvatar(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "Failed to get file from request")
		return
	}
	defer file.Close()

	// Hardcode scope to PublicImage for profile avatars
	result, err := services.UploadValidatedFile(c.Request.Context(), file, header, services.UploadScopePublicImage)
	if err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	c.JSON(http.StatusOK, result)
}
