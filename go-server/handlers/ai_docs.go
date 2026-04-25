package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
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
	answer, err := requestAIAnswer(prompt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to generate summary: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": answer})
}

func AskDocAI(c *gin.Context) {
	if !aiEnabled() {
		respondError(c, http.StatusServiceUnavailable, "AI features are currently disabled")
		return
	}

	// 1. Identification & Authorization (Pro Members Only)
	currentUser := c.MustGet("user").(models.User)
	if currentUser.SubscriptionPlan != "pro" && currentUser.Role != models.RoleAdmin {
		respondError(c, http.StatusForbidden, "Documentation Assistant is reserved for Pro members only")
		return
	}

	var req AskDocAIReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	docIDStr := c.Query("docId") // We expect docId in query or req
	if docIDStr == "" {
		respondError(c, http.StatusBadRequest, "docId is required")
		return
	}
	var docID uint
	fmt.Sscanf(docIDStr, "%d", &docID)

	// 2. Load History for Context Management
	var session models.DocChatSession
	config.DB.Where("user_id = ? AND doc_id = ?", currentUser.ID, docID).Limit(1).Find(&session)

	// Prepare history context — keep only last 6 messages to limit token usage
	historyContext := ""
	if session.History != "" {
		var messages []map[string]string
		if err := json.Unmarshal([]byte(session.History), &messages); err == nil {
			// Only use last 6 messages for context window
			start := 0
			if len(messages) > 6 {
				start = len(messages) - 6
			}
			for _, m := range messages[start:] {
				historyContext += fmt.Sprintf("[%s]: %s\n", strings.ToUpper(m["role"]), m["content"])
			}
		}
	}

	// Truncate doc content to prevent token budget blowout (max ~8K chars ≈ 2K tokens)
	docContent := req.Markdown
	if len(docContent) > 8000 {
		docContent = docContent[:8000] + "\n\n[DOCUMENT TRUNCATED FOR BREVITY]"
	}

	// 3. Orchestrate AI Prompt
	prompt := fmt.Sprintf("You are a concise technical assistant for BizCode. Answer in 2-4 paragraphs max. Use the documentation and history below.\n\n[DOCUMENTATION]\n%s\n\n[HISTORY]\n%s\n\n[USER INQUIRY]\n%s", docContent, historyContext, req.Question)
	
	// 4. Gemini Streaming Orchestration
	model := aiModel()
	apiKey := aiApiKey()

	if apiKey == "" {
		respondError(c, http.StatusInternalServerError, "Gemini API key is not configured")
		return
	}

	apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s", model, apiKey)
	
	reqPayload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": 1024,
			"temperature":     0.7,
		},
	}

	body, _ := json.Marshal(reqPayload)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Post(apiURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gemini service unreachable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respondError(c, resp.StatusCode, "Gemini API failure")
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	var fullAIResponse strings.Builder

	c.Stream(func(w io.Writer) bool {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if !strings.HasPrefix(line, "data: ") {
				continue
			}

			data := strings.TrimPrefix(line, "data: ")
			var geminiChunk struct {
				Candidates []struct {
					Content struct {
						Parts []struct {
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"content"`
				} `json:"candidates"`
			}

			if err := json.Unmarshal([]byte(data), &geminiChunk); err == nil {
				if len(geminiChunk.Candidates) > 0 && len(geminiChunk.Candidates[0].Content.Parts) > 0 {
					text := geminiChunk.Candidates[0].Content.Parts[0].Text
					fullAIResponse.WriteString(text)
					fmt.Fprintf(c.Writer, "data: %s\n\n", text)
					c.Writer.Flush()
				}
			}
		}
		
		// Persistence after stream completion
		if fullAIResponse.Len() > 0 {
			saveDocChat(currentUser.ID, docID, req.Question, fullAIResponse.String())
		}
		return false
	})
}

// Internal helper to persist history
func saveDocChat(userID, docID uint, question, answer string) {
	var session models.DocChatSession
	config.DB.Where("user_id = ? AND doc_id = ?", userID, docID).Limit(1).Find(&session)

	var messages []map[string]string
	if session.History != "" {
		json.Unmarshal([]byte(session.History), &messages)
	}
	
	// Truncate history to keep performance (last 10 messages)
	if len(messages) > 10 {
		messages = messages[len(messages)-10:]
	}

	messages = append(messages, map[string]string{"role": "user", "content": question})
	messages = append(messages, map[string]string{"role": "ai", "content": answer})

	histBytes, _ := json.Marshal(messages)
	session.History = string(histBytes)
	session.UserID = userID
	session.DocID = docID

	if session.ID == 0 {
		config.DB.Create(&session)
	} else {
		config.DB.Save(&session)
	}
}

func GetDocChatHistory(c *gin.Context) {
	currentUser := c.MustGet("user").(models.User)
	docID := c.Param("id")

	var session models.DocChatSession
	config.DB.Where("user_id = ? AND doc_id = ?", currentUser.ID, docID).Limit(1).Find(&session)
	
	if session.ID == 0 {
		// Just return empty history if not found
		c.JSON(http.StatusOK, gin.H{"history": []interface{}{}})
		return
	}

	var messages []interface{}
	if session.History != "" {
		json.Unmarshal([]byte(session.History), &messages)
	}
	c.JSON(http.StatusOK, gin.H{"history": messages})
}

func DeleteDocChat(c *gin.Context) {
	currentUser := c.MustGet("user").(models.User)
	docID := c.Param("id")

	if err := config.DB.Where("user_id = ? AND doc_id = ?", currentUser.ID, docID).Delete(&models.DocChatSession{}).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to clear guide history")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Guide history cleared successfully"})
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
		context = "No specific documentation matches found. Use your general knowledge about Devnity, ready apps, implementation support, and custom builds to help."
	} else {
		for _, doc := range docs {
			context += fmt.Sprintf("DOC [%s]: %s\n\n", doc.Title, doc.Content)
		}
	}

	// 3. Gemini Stream Request
	prompt := fmt.Sprintf("You are a Devnity support assistant. Use the provided internal context to answer the user's question. If the context does not have the answer, use your technical knowledge but mention it is general guidance.\n\n[INTERNAL CONTEXT]\n%s\n\n[USER QUESTION]\n%s", context, req.Question)
	
	requestAIStream(c, prompt)
}
