package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"github.com/pushp314/digitalstudio/go-server/services"
	"strings"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin for development
	},
}

// Client represents a connected user in the chat
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	UserID   uint
	UserName string
	IsPro    bool
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte, 1024), // Buffered to handle bursts
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovering from Hub Panic: %v. Restarting Hub...", r)
			go h.Run()
		}
	}()
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			
			// Notify others
			h.broadcastSystemMsg(fmt.Sprintf("%s joined the stream", client.UserName))
			h.broadcastPresence()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				h.mu.Unlock()
				
				// Notify others
				h.broadcastSystemMsg(fmt.Sprintf("%s disconnected", client.UserName))
				h.broadcastPresence()
			} else {
				h.mu.Unlock()
			}

		case message := <-h.Broadcast:
			h.mu.Lock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) broadcastSystemMsg(content string) {
	msg := models.ChatMessage{
		UserName:  "System",
		Content:   content,
		Type:      "system",
		CreatedAt: time.Now(),
	}
	payload, _ := json.Marshal(msg)
	h.Broadcast <- payload
}

func (h *Hub) broadcastPresence() {
	h.mu.Lock()
	userList := []gin.H{}
	unique := make(map[uint]string)
	for client := range h.Clients {
		if client.UserID != 0 {
			unique[client.UserID] = client.UserName
		}
	}
	h.mu.Unlock()

	for id, name := range unique {
		userList = append(userList, gin.H{"id": id, "name": name})
	}

	msg := gin.H{
		"type":      "presence",
		"count":     len(userList),
		"users":     userList,
		"createdAt": time.Now(),
	}
	payload, _ := json.Marshal(msg)
	h.Broadcast <- payload
}

var GlobalHub = NewHub()

func init() {
	go GlobalHub.Run()
}

func CreateChatTicket(c *gin.Context) {
	userID, _ := c.Get("userID")
	ticket := services.GlobalUserCache.IssueTicket(userID.(uint))
	c.JSON(http.StatusOK, gin.H{"ticket": ticket})
}

// ServeChatWs handles websocket requests from the peer.
func ServeChatWs(c *gin.Context) {
	var userID uint
	var exists bool

	// 1. Try Ticket authentication (Production Standard)
	ticket := c.Query("ticket")
	if ticket != "" {
		if uid, valid := services.GlobalUserCache.VerifyTicket(ticket); valid {
			userID = uid
			exists = true
		}
	}

	// 2. Fallback to Context (if middleware succeeded, though we prefer Ticket for WS)
	if !exists {
		if uidVal, ok := c.Get("userID"); ok {
			userID = uidVal.(uint)
			exists = true
		}
	}

	if !exists {
		log.Println("WS Upgrade Blocked: No valid security ticket or session context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized protocol access"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WS Upgrade Failed:", err)
		return
	}

	// Fetch user details for the chat
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		log.Println("WS Error: user not found in DB:", userID)
		conn.Close()
		return
	}

	client := &Client{
		Hub:      GlobalHub,
		Conn:     conn,
		Send:     make(chan []byte, 512),
		UserID:   userID,
		UserName: user.Name,
		IsPro:    user.IsPro,
	}
	client.Hub.Register <- client

	log.Printf("WS Link Established: %s (ID: %d)", user.Name, userID)

	// Start reader and writer routines
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// 1. Pre-Processing: Extract content and identify if it's a signal
		content := string(message)

		// 2. Signal Interception (Does NOT count towards rate limit)
		if strings.HasPrefix(content, "@typing:") {
			typingMsg := gin.H{
				"userId":    c.UserID,
				"userName":  c.UserName,
				"type":      "typing",
				"createdAt": time.Now(),
			}
			p, _ := json.Marshal(typingMsg)
			c.Hub.Broadcast <- p
			continue
		}

		if strings.HasPrefix(content, "@read:") {
			readMsg := gin.H{
				"userId":    c.UserID,
				"userName":  c.UserName,
				"type":      "read",
				"createdAt": time.Now(),
			}
			p, _ := json.Marshal(readMsg)
			c.Hub.Broadcast <- p
			continue
		}

	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte("\n"))
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func GetChatHistory(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	lastIDStr := c.Query("lastId")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 50
	}

	var messages []models.ChatMessage
	query := config.DB.Order("created_at desc").Limit(limit)

	if lastIDStr != "" {
		lastID, err := strconv.ParseUint(lastIDStr, 10, 32)
		if err == nil {
			var lastMsg models.ChatMessage
			if err := config.DB.First(&lastMsg, lastID).Error; err == nil {
				query = query.Where("created_at < ?", lastMsg.CreatedAt)
			}
		}
	}

	if err := query.Find(&messages).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to load history")
		return
	}
	
	// Reverse to show chronological order in UI
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	
	c.JSON(http.StatusOK, messages)
}

func SendChatMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		respondError(c, http.StatusUnauthorized, "User session expired")
		return
	}

	var req struct {
		Content        string `json:"content"`
		CID            string `json:"cid"`
		ParentID       *uint  `json:"parentId"`
		ReplyToName    string `json:"replyToName"`
		ReplyToContent string `json:"replyToContent"`
		AttachmentURL  string `json:"attachmentUrl"`
		IsImage        bool   `json:"isImage"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	isPro := user.IsPro || user.SubscriptionPlan == "pro" || user.Role == "admin"

	// THE 2-MESSAGE PER DAY LIMITATION FOR NORMAL USERS
	if !isPro {
		var count int64
		today := time.Now().Truncate(24 * time.Hour)
		config.DB.Model(&models.ChatMessage{}).Where("user_id = ? AND created_at >= ?", user.ID, today).Count(&count)
		if count >= 2 {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Daily interaction limit (2/2) reached. Acquire Pro Membership for unlimited real-time uplink.",
				"limitReached": true,
				"reason": "FREEMIUM_EXHAUSTED",
			})
			return
		}
		
		// Text Length Limit (100 chars)
		if len(req.Content) > 100 {
			respondError(c, http.StatusForbidden, "Text limit (100 chars) reached. Purchase membership to expand bandwidth.")
			return
		}

		// Block Images for Normal Users
		if req.IsImage || req.AttachmentURL != "" {
			respondError(c, http.StatusForbidden, "Visual data transmission is exclusive to Pro Members.")
			return
		}

        // Block Emojis for Normal Users (Check for non-ASCII or common emoji ranges)
        for _, r := range req.Content {
            if r > 127 { // Simple catch-all for non-standard ASCII (emojis etc)
                respondError(c, http.StatusForbidden, "Emotional payloads (emojis) require Pro Membership protocol.")
                return
            }
        }
	}

    // --- AI BOT ASSISTANCE FOR PRO USERS ---
    isBotRequest := strings.HasPrefix(strings.ToLower(strings.TrimSpace(req.Content)), "@bot")
    if isBotRequest && !isPro {
        respondError(c, http.StatusForbidden, "Technical Consultant @bot is available only for Pro Membership nodes.")
        return
    }

	// Sanitization
	content := strings.TrimSpace(req.Content)
	if content == "" && !req.IsImage {
		respondError(c, http.StatusBadRequest, "Invalid message content")
		return
	}

	dbMsg := models.ChatMessage{
		UserID:         user.ID,
		UserName:       user.Name,
		UserAvatar:     user.AvatarURL,
		UserHandle:     func() string {
			if user.Username != nil {
				return *user.Username
			}
			return fmt.Sprintf("%d", user.ID)
		}(),
		Content:        content,
		IsPro:          isPro,
		Role:           string(user.Role),
		Type:           func() string {
			if req.IsImage { return "image" }
			if len(content) > 3 && content[:3] == "```" { return "code" }
			return "text"
		}(),
		AttachmentURL:  req.AttachmentURL,
		IsImage:        req.IsImage,
		ParentID:       req.ParentID,
		ReplyToName:    req.ReplyToName,
		ReplyToContent: req.ReplyToContent,
		CreatedAt:      time.Now(),
	}

	// Force migrate just in case
	config.DB.AutoMigrate(&models.ChatMessage{})

	if err := config.DB.Create(&dbMsg).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to persist message")
		return
	}

	// Award XP for contribution
	services.AwardXP(&user, services.XPMsgSent)
	config.DB.Save(&user)

	// Immediate Broadcast to all connected clients
	broadcastData := gin.H{
		"id":             dbMsg.ID,
		"cid":            req.CID,
		"userId":         dbMsg.UserID,
		"userName":       dbMsg.UserName,
		"username":       dbMsg.UserHandle,
		"userAvatar":     dbMsg.UserAvatar,
		"content":        dbMsg.Content,
		"attachmentUrl":  dbMsg.AttachmentURL,
		"isImage":        dbMsg.IsImage,
		"type":           dbMsg.Type,
		"isPro":          dbMsg.IsPro,
		"role":           user.Role,
		"parentId":       dbMsg.ParentID,
		"replyToName":    dbMsg.ReplyToName,
		"replyToContent": dbMsg.ReplyToContent,
		"createdAt":      dbMsg.CreatedAt,
	}
	p, _ := json.Marshal(broadcastData)
	GlobalHub.Broadcast <- p

	// If it was a bot request, trigger bot reply
	if isBotRequest {
		go func() {
			botPrompt := strings.TrimSpace(strings.TrimPrefix(strings.ToLower(content), "@bot"))
			if botPrompt == "" {
				botPrompt = "Hello! I am your DigitalStudio technical consultant. How can I help with a product, setup, deployment, or custom build today?"
			} else {
				// Augment prompt for technical context
				botPrompt = "You are a technical consultant for DigitalStudio, a developer commerce and service platform for ready apps, implementation help, and custom builds. A Pro member asks: " + botPrompt + "\n\nProvide a technical, concise, and helpful response (max 100 words)."
			}

			botAnswer, err := requestAIAnswer(botPrompt)
			if err != nil {
				botAnswer = "My internal reasoning circuits are currently offline. Please try again in safe mode."
			}

			botMsg := models.ChatMessage{
				UserName:   "DigitalStudio Consultant @bot",
				UserHandle: "bot",
				Content:    botAnswer,
				IsPro:      true,
				Role:       "admin",
				Type:       "text",
				CreatedAt:  time.Now(),
			}
			config.DB.Create(&botMsg)

			botPayload, _ := json.Marshal(gin.H{
				"id":         botMsg.ID,
				"userId":     0,
				"userName":   botMsg.UserName,
				"username":   botMsg.UserHandle,
				"content":    botMsg.Content,
				"type":       "text",
				"isPro":      true,
				"role":       "admin",
				"createdAt":  botMsg.CreatedAt,
				"isBot":      true,
			})
			GlobalHub.Broadcast <- botPayload
		}()
	}

	c.JSON(http.StatusCreated, broadcastData)
}

func UpdateChatMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	msgID := c.Param("id")

	var user models.User
	config.DB.First(&user, userID)
	if user.SubscriptionPlan != "pro" && user.Role != "admin" {
		respondError(c, http.StatusForbidden, "Edit feature is exclusive to Pro users")
		return
	}

	var msg models.ChatMessage
	if err := config.DB.First(&msg, msgID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Message not found")
		return
	}

	if msg.UserID != user.ID && user.Role != "admin" {
		respondError(c, http.StatusForbidden, "You can only edit your own messages")
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	msg.Content = strings.TrimSpace(req.Content)
	config.DB.Save(&msg)

	// Broadcast the update
	updateSig := gin.H{
		"id":      msg.ID,
		"type":    "edit",
		"content": msg.Content,
	}
	p, _ := json.Marshal(updateSig)
	GlobalHub.Broadcast <- p

	c.JSON(http.StatusOK, msg)
}

func DeleteChatMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	msgID := c.Param("id")

	var msg models.ChatMessage
	if err := config.DB.First(&msg, msgID).Error; err != nil {
		respondError(c, http.StatusNotFound, "Message not found")
		return
	}

	if msg.UserID != userID.(uint) {
		var user models.User
		config.DB.First(&user, userID)
		if user.Role != "admin" {
			respondError(c, http.StatusForbidden, "Unauthorized to delete this message")
			return
		}
	}

	config.DB.Delete(&msg)

	// Broadcast the deletion signal
	deleteSig := gin.H{
		"id":   msg.ID,
		"type": "delete",
	}
	p, _ := json.Marshal(deleteSig)
	GlobalHub.Broadcast <- p

	c.Status(http.StatusNoContent)
}

func PinChatMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	msgID := c.Param("id")

	var user models.User
	config.DB.First(&user, userID)
	if user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Pinning is restricted to administrative nodes"})
		return
	}

	var msg models.ChatMessage
	if err := config.DB.First(&msg, msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	msg.IsPinned = !msg.IsPinned
	config.DB.Save(&msg)

	// Broadcast Pin Signal
	sig := gin.H{
		"id":       msg.ID,
		"type":     "metadata_update",
		"isPinned": msg.IsPinned,
	}
	p, _ := json.Marshal(sig)
	GlobalHub.Broadcast <- p

	c.JSON(http.StatusOK, msg)
}

func ReportChatMessage(c *gin.Context) {
	msgID := c.Param("id")

	var msg models.ChatMessage
	if err := config.DB.First(&msg, msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	msg.ReportCount++
	config.DB.Save(&msg)

	// We don't broadcast report counts for privacy, just notify admin in real-time if needed
	if msg.ReportCount >= 5 {
		// Log critical violation for auditing
		log.Printf("CRITICAL: Message %d has reached violation threshold (%d reports)", msg.ID, msg.ReportCount)
	}

	c.JSON(http.StatusOK, gin.H{"status": "Violation logged for administrative review"})
}

func BulkDeleteMessages(c *gin.Context) {
	userID, _ := c.Get("userID")
	var admin models.User
	config.DB.First(&admin, userID)
	if admin.Role != "admin" {
		respondError(c, http.StatusForbidden, "Bulk moderation restricted to administrative nodes")
		return
	}

	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "ID array required for bulk purge")
		return
	}

	if len(req.IDs) == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	if err := config.DB.Where("id IN ?", req.IDs).Delete(&models.ChatMessage{}).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Bulk purge operation failed")
		return
	}

	// Broadcast Bulk Deletion Signal
	sig := gin.H{
		"ids":  req.IDs,
		"type": "bulk_delete",
	}
	p, _ := json.Marshal(sig)
	GlobalHub.Broadcast <- p

	c.Status(http.StatusNoContent)
}
