package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func GetAIRecommendation(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	techStack := c.Query("techStack")
	if techStack == "" {
		respondError(c, http.StatusBadRequest, "techStack query parameter is required")
		return
	}

	prompt := fmt.Sprintf("Given a catalogue of templates and a tech stack of %s, recommend three relevant products with IDs and one-sentence descriptions.", techStack)

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
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
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("AI Service ERROR (%d): %s\n", resp.StatusCode, string(body))
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

func GetUserRoadmap(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	userID, _ := c.Get("userID")
	var req struct {
		WishlistIDs []uint `json:"wishlistIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	// 1. Fetch Purchases
	var orders []models.Order
	config.DB.Preload("OrderItems.Product").Where("user_id = ? AND status = 'paid'", userID).Find(&orders)

	var purchases []string
	for _, o := range orders {
		for _, item := range o.OrderItems {
			if item.Product.Title != "" {
				purchases = append(purchases, item.Product.Title)
			}
		}
	}

	// 2. Fetch Wishlist Titles (Optional but helpful if we had IDs)
	var wishlistNames []string
	if len(req.WishlistIDs) > 0 {
		var products []models.Product
		config.DB.Where("id IN ?", req.WishlistIDs).Find(&products)
		for _, p := range products {
			wishlistNames = append(wishlistNames, p.Title)
		}
	}

	// 3. Build Strategic Prompt
	profileContext := fmt.Sprintf("User Profile: Purchases: [%s], Wishlist: [%s].", 
		strings.Join(purchases, ", "), strings.Join(wishlistNames, ", "))
	
	prompt := fmt.Sprintf("%s\n\nTask: Generate a strategic 3-step 'Elite Roadmap' for this creator. What should they build next? Which documentation should they read? Suggest one specific template they don't own that would complete their toolkit. Keep it professional, encouraging, and high-density (max 150 words).", profileContext)

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
	})

	serviceURL := aiServiceURL()
	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline")
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	json.Unmarshal(bodyBytes, &aiResp)

	c.JSON(http.StatusOK, gin.H{"roadmap": aiResp.Answer})
}

func AnalyzeInquiry(message string) (string, int) {
	if !aiEnabled() {
		return "neutral", 3
	}

	prompt := fmt.Sprintf("Analyze this customer inquiry: \"%s\"\n\nReturn ONLY a JSON object with two fields: \"sentiment\" (one word: calm, happy, frustrated, confused, or urgent) and \"priority\" (number 1 to 10 based on business impact).", message)

	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  aiModel(),
	})

	serviceURL := aiServiceURL()
	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		return "neutral", 3
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var aiResp struct{ Answer string `json:"answer"` }
	json.Unmarshal(bodyBytes, &aiResp)

	// Robustly extract JSON from AI response (some LLMs might wrap in markdown blocks)
	cleanJSON := aiResp.Answer
	if strings.Contains(cleanJSON, "```json") {
		parts := strings.Split(cleanJSON, "```json")
		if len(parts) > 1 {
			cleanJSON = strings.Split(parts[1], "```")[0]
		}
	} else if strings.Contains(cleanJSON, "```") {
		parts := strings.Split(cleanJSON, "```")
		if len(parts) > 1 {
			cleanJSON = parts[1]
		}
	}

	var analysis struct {
		Sentiment string `json:"sentiment"`
		Priority  int    `json:"priority"`
	}
	if err := json.Unmarshal([]byte(strings.TrimSpace(cleanJSON)), &analysis); err != nil {
		fmt.Printf("AI Analysis Parse Error: %v | Raw: %s\n", err, aiResp.Answer)
		return "neutral", 3
	}

	return analysis.Sentiment, analysis.Priority
}
