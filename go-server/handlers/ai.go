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

type aiEditorReq struct {
	Title     string      `json:"title"`
	TechStack interface{} `json:"techStack"`
	Content   string      `json:"content"`
	Category  string      `json:"category"`
	Features  interface{} `json:"features"`
}

func GenerateAIDescription(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req aiEditorReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		respondError(c, http.StatusBadRequest, "title is required")
		return
	}

	techStack := stringifyAIMixedValue(req.TechStack)
	prompt := fmt.Sprintf("Write a concise, professional marketplace description for a product titled %q. Tech stack: %s. Return plain text only in 2-4 sentences.", title, techStack)
	answer, err := requestAIAnswer(prompt)
	if err != nil || strings.TrimSpace(answer) == "" {
		answer = fallbackDescription(title, techStack)
	}

	c.JSON(http.StatusOK, gin.H{"description": strings.TrimSpace(answer)})
}

func SuggestAITags(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req aiEditorReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		respondError(c, http.StatusBadRequest, "title is required")
		return
	}

	prompt := fmt.Sprintf("Suggest 5 concise tags for a digital product titled %q. Context: %s. Return a JSON array of strings.", title, strings.TrimSpace(req.Content))
	answer, err := requestAIAnswer(prompt)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"tags": fallbackTags(title, req.Content)})
		return
	}

	var tags []string
	if err := json.Unmarshal([]byte(strings.TrimSpace(answer)), &tags); err != nil || len(tags) == 0 {
		tags = fallbackTags(title, req.Content)
	}

	c.JSON(http.StatusOK, gin.H{"tags": tags})
}

func RecommendAIPricing(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req aiEditorReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := fmt.Sprintf("Recommend a fair INR launch price for a digital product. Category: %s. Features: %s. Return ONLY a whole number.", strings.TrimSpace(req.Category), stringifyAIMixedValue(req.Features))
	answer, err := requestAIAnswer(prompt)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"price": fallbackPrice(req.Category)})
		return
	}

	var recommended int
	if _, err := fmt.Sscanf(strings.TrimSpace(answer), "%d", &recommended); err != nil || recommended <= 0 {
		recommended = fallbackPrice(req.Category)
	}

	c.JSON(http.StatusOK, gin.H{"price": recommended})
}

func SuggestUsernames(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Name is required for synthesis")
		return
	}

	prompt := fmt.Sprintf("Suggest 5 unique, developer-centric, tech-inspired usernames for a user named %q. Focus on clean, professional handles using prefixes like 'code', 'dev', 'pixel', 'byte', or technical suffixes. Return ONLY a JSON array of strings.", req.Name)
	answer, err := requestAIAnswer(prompt)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"suggestions": []string{"dev_" + strings.ToLower(strings.Fields(req.Name)[0])}})
		return
	}

	// Clean JSON from markdown if necessary
	cleanJSON := strings.TrimSpace(answer)
	if strings.HasPrefix(cleanJSON, "```json") {
		cleanJSON = strings.TrimPrefix(cleanJSON, "```json")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	} else if strings.HasPrefix(cleanJSON, "```") {
		cleanJSON = strings.TrimPrefix(cleanJSON, "```")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	}

	var suggestions []string
	if err := json.Unmarshal([]byte(strings.TrimSpace(cleanJSON)), &suggestions); err != nil {
		c.JSON(http.StatusOK, gin.H{"suggestions": []string{"dev_" + strings.ToLower(strings.Fields(req.Name)[0])}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}

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

	prompt := fmt.Sprintf("Given a catalogue of ready apps, templates, and software kits and a tech stack of %s, recommend three relevant products with IDs and one-sentence descriptions.", techStack)
	answer, err := requestAIAnswer(prompt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get AI recommendation: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": answer})
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

	// 2. Fetch Wishlist Titles
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
	
	prompt := fmt.Sprintf("%s\n\nTask: Generate a strategic 3-step implementation roadmap for this creator. What should they build next? Which documentation should they read? Suggest one specific ready product they don't own that would complete their toolkit. Keep it professional, encouraging, and high-density (max 150 words).", profileContext)

	answer, err := requestAIAnswer(prompt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to generate roadmap: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"roadmap": answer})
}

func AnalyzeInquiry(message string) (string, int) {
	if !aiEnabled() {
		return "neutral", 3
	}

	prompt := fmt.Sprintf("Analyze this customer inquiry: \"%s\"\n\nReturn ONLY a JSON object with two fields: \"sentiment\" (one word: calm, happy, frustrated, confused, or urgent) and \"priority\" (number 1 to 10 based on business impact).", message)

	answer, err := requestAIAnswer(prompt)
	if err != nil {
		return "neutral", 3
	}

	// Robustly extract JSON from AI response (some LLMs might wrap in markdown blocks)
	cleanJSON := answer
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
		fmt.Printf("AI Analysis Parse Error: %v | Raw: %s\n", err, answer)
		return "neutral", 3
	}

	return analysis.Sentiment, analysis.Priority
}

func requestAIAnswer(prompt string) (string, error) {
	provider := aiProvider()
	model := aiModel()
	apiKey := aiApiKey()

	if provider == "gemini" {
		if model == "" {
			model = "gemini-1.5-flash"
		}
		if apiKey == "" {
			return "", fmt.Errorf("Gemini API key is not configured")
		}

		apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)
		
		reqPayload := map[string]interface{}{
			"contents": []map[string]interface{}{
				{
					"parts": []map[string]interface{}{
						{"text": prompt},
					},
				},
			},
		}

		body, _ := json.Marshal(reqPayload)
		resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(body))
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			respBody, _ := io.ReadAll(resp.Body)
			return "", fmt.Errorf("Gemini API error (%d): %s", resp.StatusCode, string(respBody))
		}

		var geminiResp struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
			return "", err
		}

		if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
			return geminiResp.Candidates[0].Content.Parts[0].Text, nil
		}
		return "", fmt.Errorf("Gemini API returned no content")
	}

	// Legacy Proxy Fallback
	aiReqBody, _ := json.Marshal(map[string]string{
		"prompt": prompt,
		"model":  model,
	})

	serviceURL := aiServiceURL()
	if serviceURL == "" {
		return "", fmt.Errorf("AI service URL is not configured")
	}

	resp, err := http.Post(serviceURL+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("AI service returned error (%d): %s", resp.StatusCode, string(body))
	}

	var aiResp struct {
		Answer string `json:"answer"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return "", err
	}

	return aiResp.Answer, nil
}

func stringifyAIMixedValue(value interface{}) string {
	switch typed := value.(type) {
	case []interface{}:
		parts := make([]string, 0, len(typed))
		for _, item := range typed {
			parts = append(parts, stringifyAIMixedValue(item))
		}
		return strings.Join(parts, ", ")
	case []string:
		return strings.Join(typed, ", ")
	case string:
		return typed
	default:
		bytes, err := json.Marshal(typed)
		if err != nil {
			return ""
		}
		return string(bytes)
	}
}

func fallbackDescription(title string, techStack string) string {
	if strings.TrimSpace(techStack) == "" {
		return fmt.Sprintf("%s is a production-ready digital product built to help teams ship faster with a clean starting point and practical implementation details.", title)
	}
	return fmt.Sprintf("%s is a production-ready digital product built with %s. It gives teams a clean starting point for shipping faster with clear structure, practical features, and room to customize.", title, techStack)
}

func fallbackTags(title string, content interface{}) []string {
	joined := strings.ToLower(strings.TrimSpace(title + " " + stringifyAIMixedValue(content)))
	candidates := []string{"react", "nextjs", "saas", "dashboard", "ui", "template", "documentation", "api", "go", "typescript"}
	tags := make([]string, 0, 5)
	for _, candidate := range candidates {
		if strings.Contains(joined, candidate) {
			tags = append(tags, candidate)
		}
		if len(tags) == 5 {
			break
		}
	}
	if len(tags) == 0 {
		tags = []string{"template", "web", "starter"}
	}
	return tags
}

func fallbackPrice(category string) int {
	switch strings.ToLower(strings.TrimSpace(category)) {
	case "subscription":
		return 29
	case "fullstack", "saas", "dashboard":
		return 79
	case "component", "ui_kit", "icon_set":
		return 29
	default:
		return 49
	}
}
