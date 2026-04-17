package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/services"
)

func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "Failed to get file from request")
		return
	}
	defer file.Close()

	url, err := services.UploadFile(file, header)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to upload file to R2: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"filePath": url})
}
