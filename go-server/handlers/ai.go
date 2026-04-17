package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAIRecommendation(c *gin.Context) {
	techStack := c.Query("techStack")
	if techStack == "" {
		respondError(c, http.StatusBadRequest, "techStack query parameter is required")
		return
	}

	prompt := fmt.Sprintf("Given a catalogue of templates and a tech stack of %s, recommend three relevant products with IDs and one-sentence descriptions.", techStack)

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
		respondError(c, http.StatusInternalServerError, "AI service returned an error")
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
