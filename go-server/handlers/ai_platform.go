package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

// ---------- Input Validators ----------

const maxQueryLen = 500
const maxMarkdownLen = 8000

func validateStringLen(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) > max {
		return s[:max]
	}
	return s
}

// ---------- JSON Extraction Helpers ----------

// extractJSON tries to extract a valid JSON object from an AI response that might be wrapped in markdown fences.
func extractJSON(raw string) string {
	clean := strings.TrimSpace(raw)

	// Strip markdown code fences
	if strings.HasPrefix(clean, "```json") {
		clean = strings.TrimPrefix(clean, "```json")
		clean = strings.TrimSuffix(strings.TrimSpace(clean), "```")
	} else if strings.HasPrefix(clean, "```") {
		clean = strings.TrimPrefix(clean, "```")
		clean = strings.TrimSuffix(strings.TrimSpace(clean), "```")
	}

	clean = strings.TrimSpace(clean)

	// If still not starting with { or [, try to find the first JSON object
	if !strings.HasPrefix(clean, "{") && !strings.HasPrefix(clean, "[") {
		if idx := strings.Index(clean, "{"); idx >= 0 {
			clean = clean[idx:]
		}
	}

	return clean
}

// ---------- POST /api/ai/recommend-products ----------

type RecommendProductsReq struct {
	Query    string `json:"query" binding:"required"`
	Budget   string `json:"budget"`
	Category string `json:"category"`
}

type ProductRecommendation struct {
	Type   string `json:"type"`   // product | service | custom_request
	Title  string `json:"title"`
	Reason string `json:"reason"`
	CTA    string `json:"cta"` // View Product | Request Custom Build | Talk to Expert
}

type RecommendProductsResp struct {
	Summary         string                  `json:"summary"`
	Recommendations []ProductRecommendation `json:"recommendations"`
	NextQuestions   []string                `json:"nextQuestions"`
}

func RecommendProducts(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req RecommendProductsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Query is required")
		return
	}

	query := validateStringLen(req.Query, maxQueryLen)
	if query == "" {
		respondError(c, http.StatusBadRequest, "Query cannot be empty")
		return
	}

	// Fetch available product titles and categories for context
	var products []models.Product
	config.DB.Select("id, title, category, price, product_type").
		Where("status = ?", "approved").
		Limit(50).Find(&products)

	var catalog strings.Builder
	for _, p := range products {
		catalog.WriteString(fmt.Sprintf("- %s (₹%d, %s, %s)\n", p.Title, int(p.Price), p.Category, p.Type))
	}

	prompt := fmt.Sprintf(`You are the AI assistant for BizCode, a software marketplace that sells ready-made apps, templates, UI kits, and code products. You also offer custom development and expert consultations.

A user is looking for: "%s"
Budget preference: %s
Category preference: %s

Available products in catalog:
%s

Based on the user's needs, recommend up to 3 options. Each recommendation should be one of:
- "product" — if an existing catalog item matches
- "service" — if they need expert help or consultation  
- "custom_request" — if nothing matches and they need a custom build

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "summary": "Brief 1-2 sentence summary of what user needs",
  "recommendations": [
    {"type": "product|service|custom_request", "title": "Name", "reason": "Why this fits", "cta": "View Product|Talk to Expert|Request Custom Build"}
  ],
  "nextQuestions": ["Follow-up question 1", "Follow-up question 2"]
}`, query, req.Budget, req.Category, catalog.String())

	answer, err := requestAIAnswer(prompt)
	if err != nil {
		// Graceful fallback
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": RecommendProductsResp{
				Summary:         "We couldn't process your request right now. Please browse our catalog or contact support.",
				Recommendations: []ProductRecommendation{{Type: "service", Title: "Talk to an Expert", Reason: "Our team can help you find the right solution.", CTA: "Talk to Expert"}},
				NextQuestions:   []string{},
			},
		})
		return
	}

	var resp RecommendProductsResp
	cleanJSON := extractJSON(answer)
	if err := json.Unmarshal([]byte(cleanJSON), &resp); err != nil {
		// Fallback with raw summary
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": RecommendProductsResp{
				Summary:         strings.TrimSpace(answer),
				Recommendations: []ProductRecommendation{},
				NextQuestions:   []string{},
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": resp})
}

// ---------- POST /api/ai/generate-requirements ----------

type GenerateRequirementsReq struct {
	Idea         string `json:"idea" binding:"required"`
	BusinessType string `json:"businessType"`
	Budget       string `json:"budget"`
}

type GenerateRequirementsResp struct {
	ProjectSummary    string   `json:"projectSummary"`
	Modules           []string `json:"modules"`
	Features          []string `json:"features"`
	TechStack         []string `json:"techStack"`
	AdminPanel        []string `json:"adminPanel"`
	Complexity        string   `json:"complexity"` // low | medium | high
	EstimatedTimeline string   `json:"estimatedTimeline"`
	ClientQuestions   []string `json:"clientQuestions"`
}

func GenerateRequirements(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req GenerateRequirementsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Project idea is required")
		return
	}

	idea := validateStringLen(req.Idea, maxQueryLen)
	if idea == "" {
		respondError(c, http.StatusBadRequest, "Project idea cannot be empty")
		return
	}

	prompt := fmt.Sprintf(`You are a senior software architect at BizCode. A client has described a project idea. Convert it into a structured requirement document.

Project idea: "%s"
Business type: %s
Budget range: %s

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "projectSummary": "2-3 sentence professional summary",
  "modules": ["Module 1", "Module 2"],
  "features": ["Feature 1", "Feature 2"],
  "techStack": ["React", "Node.js", "PostgreSQL"],
  "adminPanel": ["User management", "Analytics dashboard"],
  "complexity": "low|medium|high",
  "estimatedTimeline": "e.g. 4-6 weeks",
  "clientQuestions": ["Question 1 to clarify scope", "Question 2"]
}`, idea, req.BusinessType, req.Budget)

	answer, err := requestAIAnswer(prompt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to generate requirements. Please try again.")
		return
	}

	var resp GenerateRequirementsResp
	cleanJSON := extractJSON(answer)
	if err := json.Unmarshal([]byte(cleanJSON), &resp); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to parse AI response. Please try again.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": resp})
}

// ---------- POST /api/ai/improve-product-content (Admin Only) ----------

type ImproveContentReq struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

type ImproveContentResp struct {
	ImprovedTitle    string   `json:"improvedTitle"`
	ShortDescription string   `json:"shortDescription"`
	LongDescription  string   `json:"longDescription"`
	SEOTitle         string   `json:"seoTitle"`
	SEODescription   string   `json:"seoDescription"`
	Keywords         []string `json:"keywords"`
}

func ImproveProductContent(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req ImproveContentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Title is required")
		return
	}

	title := validateStringLen(req.Title, 200)
	desc := validateStringLen(req.Description, maxMarkdownLen)
	category := validateStringLen(req.Category, 100)

	prompt := fmt.Sprintf(`You are a senior copywriter for BizCode, a premium software marketplace. Improve the following product listing for maximum conversion and SEO performance.

Current title: "%s"
Current description: "%s"
Category: "%s"

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "improvedTitle": "Improved product title (max 80 chars)",
  "shortDescription": "Compelling 2-sentence buyer summary",
  "longDescription": "Professional 3-4 paragraph product description in markdown with features, benefits, and use cases",
  "seoTitle": "SEO-optimized meta title (max 60 chars)",
  "seoDescription": "SEO meta description (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`, title, desc, category)

	answer, err := requestAIAnswer(prompt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to improve content. Please try again.")
		return
	}

	var resp ImproveContentResp
	cleanJSON := extractJSON(answer)
	if err := json.Unmarshal([]byte(cleanJSON), &resp); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to parse AI response. Please try again.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": resp})
}
