package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
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
		Send:     make(chan []byte, 256),
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

	// Simple Rate Limiting State
	messageCount := 0
	lastReset := time.Now()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Rate Limiting Logic
		if time.Since(lastReset) > time.Minute {
			messageCount = 0
			lastReset = time.Now()
		}

		limit := 5 // Free users: 5 messages per minute
		if c.IsPro {
			limit = 50 // Pro users: 50 messages per minute
		}

		if messageCount >= limit {
			systemMsg := models.ChatMessage{
				UserName:  "System",
				Content:   "Rate limit exceeded. Upgrade to Pro for high-velocity chat.",
				Type:      "system",
				CreatedAt: time.Now(),
			}
			payload, _ := json.Marshal(systemMsg)
			c.Send <- payload
			continue
		}

		messageCount++

		// Persistence
		dbMsg := models.ChatMessage{
			UserID:    c.UserID,
			UserName:  c.UserName,
			Content:   string(message),
			IsPro:     c.IsPro,
			Type:      "text",
			CreatedAt: time.Now(),
		}

		// If message starts with "```", mark as code type (Advanced Feature)
		if len(message) > 3 && string(message[:3]) == "```" {
			dbMsg.Type = "code"
		}

		config.DB.Create(&dbMsg)

		// Broadcast
		payload, _ := json.Marshal(dbMsg)
		c.Hub.Broadcast <- payload
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
	var messages []models.ChatMessage
	config.DB.Order("created_at desc").Limit(50).Find(&messages)
	
	// Reverse to show chronological order in UI
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	
	c.JSON(http.StatusOK, messages)
}
