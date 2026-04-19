package handlers

import (
	"bufio"
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

type DocSummaryReq struct {
	Markdown string `json:"markdown" binding:"required"`
}

type AskDocAIReq struct {
	Markdown       string `json:"markdown" binding:"required"`
	Question       string `json:"question" binding:"required"`
	ConversationID string `json:"conversationId"`
}

func GenerateDocSummary(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req DocSummaryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := "Please generate a concise summary, table of contents, and keyword tags for the following documentation:\n\n" + req.Markdown
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

func AskDocAI(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req AskDocAIReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	prompt := "You are a technical support AI for DigitalStudio. Use the following documentation context to answer the user's question accurately. Be concise and technical.\n\n[CONTEXT]\n" + req.Markdown + "\n\n[USER QUESTION]\n" + req.Question
	aiReqBody, _ := json.Marshal(map[string]interface{}{
		"prompt":         prompt,
		"model":          aiModel(),
		"conversationId": req.ConversationID,
		"stream":         true,
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

	// Set headers for streaming back to the browser
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.Stream(func(w io.Writer) bool {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Bytes()
			var aiChunk struct {
				Response string `json:"response"`
				Done     bool   `json:"done"`
			}
			if err := json.Unmarshal(line, &aiChunk); err == nil {
				// We send the raw response text in a format the frontend can easily read
				c.SSEvent("message", aiChunk.Response)
				if aiChunk.Done {
					return false
				}
			}
		}
		return false
	})
}

func UniversalDocSearchChat(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	var req struct {
		Question       string `json:"question" binding:"required"`
		ConversationID string `json:"conversationId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// 1. Semantic Search Simulation (Keyword Matching across Docs)
	var docs []models.PremiumDoc
	keywords := strings.Split(req.Question, " ")
	query := config.DB.Limit(3)
	
	for _, kw := range keywords {
		if len(kw) > 3 {
			query = query.Or("title ILIKE ? OR content ILIKE ? OR description ILIKE ?", "%"+kw+"%", "%"+kw+"%", "%"+kw+"%")
		}
	}
	query.Find(&docs)

	// 2. Aggregate Context
	context := "Here are relevant documentation snippets to help you answer:\n\n"
	if len(docs) == 0 {
		context = "No specific documentation matches found. Use your general knowledge about our platform DigitalStudio to help."
	} else {
		for _, doc := range docs {
			context += fmt.Sprintf("DOC [%s]: %s\n\n", doc.Title, doc.Content)
		}
	}

	// 3. AI Stream Request
	prompt := fmt.Sprintf("You are an elite DigitalStudio Support AI. Use the provided INTERNAL CONTEXT to answer the user's question. If the context doesn't have the answer, use your technical knowledge but mention it's general guidance.\n\n[INTERNAL CONTEXT]\n%s\n\n[USER QUESTION]\n%s", context, req.Question)
	
	aiReqBody, _ := json.Marshal(map[string]interface{}{
		"prompt":         prompt,
		"model":          aiModel(),
		"conversationId": req.ConversationID,
		"stream":         true,
	})

	resp, err := http.Post(aiServiceURL()+"/ai/prompt", "application/json", bytes.NewBuffer(aiReqBody))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "AI service offline")
		return
	}
	defer resp.Body.Close()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.Stream(func(w io.Writer) bool {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Bytes()
			var aiChunk struct {
				Response string `json:"response"`
				Done     bool   `json:"done"`
			}
			if err := json.Unmarshal(line, &aiChunk); err == nil {
				c.SSEvent("message", aiChunk.Response)
				if aiChunk.Done {
					return false
				}
			}
		}
		return false
	})
}
