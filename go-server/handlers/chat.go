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
		Broadcast:  make(chan []byte),
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
			h.broadcastOnlineCount()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				h.mu.Unlock()
				
				// Notify others
				h.broadcastSystemMsg(fmt.Sprintf("%s disconnected", client.UserName))
				h.broadcastOnlineCount()
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

func (h *Hub) broadcastOnlineCount() {
	h.mu.Lock()
	count := len(h.Clients)
	h.mu.Unlock()

	msg := gin.H{
			"type": "presence",
			"count": count,
			"userName": "System",
			"createdAt": time.Now(),
	}
	payload, _ := json.Marshal(msg)
	h.Broadcast <- payload
}

var GlobalHub = NewHub()

func init() {
	go GlobalHub.Run()
}

// ServeWs handles websocket requests from the peer.
func ServeChatWs(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		log.Println("WS Upgrade Error: user not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		log.Println("WS Upgrade Error: invalid userID type in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
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
		Content string `json:"content" binding:"required"`
		CID     string `json:"cid"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Sanitization
	content := strings.TrimSpace(req.Content)
	if content == "" || strings.HasPrefix(content, "@") {
		respondError(c, http.StatusBadRequest, "Invalid message content")
		return
	}

	dbMsg := models.ChatMessage{
		UserID:    user.ID,
		UserName:  user.Name,
		Content:   content,
		IsPro:     user.SubscriptionPlan == "pro",
		Type:      "text",
		CreatedAt: time.Now(),
	}

	if len(content) > 3 && content[:3] == "```" {
		dbMsg.Type = "code"
	}

	// Force migrate just in case
	config.DB.AutoMigrate(&models.ChatMessage{})

	if err := config.DB.Create(&dbMsg).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to persist message")
		return
	}

	// Immediate Broadcast to all connected clients
	broadcastMsg := gin.H{
		"id":        dbMsg.ID,
		"cid":       req.CID,
		"userId":    dbMsg.UserID,
		"userName":  dbMsg.UserName,
		"content":   dbMsg.Content,
		"type":      dbMsg.Type,
		"isPro":     dbMsg.IsPro,
		"createdAt": dbMsg.CreatedAt,
	}
	p, _ := json.Marshal(broadcastMsg)
	GlobalHub.Broadcast <- p

	c.JSON(http.StatusCreated, broadcastMsg)
}
