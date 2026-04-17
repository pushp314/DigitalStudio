package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DocSummaryReq struct {
	Markdown string `json:"markdown" binding:"required"`
}

func GenerateDocSummary(c *gin.Context) {
	var req DocSummaryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := "Please generate a concise summary, table of contents, and keyword tags for the following documentation:\n\n" + req.Markdown
	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
	})

	serviceURL := aiServiceURL()
	if serviceURL == "" {
		respondError(c, http.StatusInternalServerError, "AI service URL is not configured")
		return
	}

	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline or unreachable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respondError(c, http.StatusInternalServerError, "AI error")
		return
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	if err := json.Unmarshal(bodyBytes, &aiResp); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to parse AI response")
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": aiResp.Answer})
}
