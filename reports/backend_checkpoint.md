# Backend Nexus Code Intelligence

This document contains the core backend logic for DigitalStudio.

---

## 1. Main Entry & Router (`main.go`)
```go
package main

import (
	"log/slog"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/handlers"
	"github.com/pushp314/digitalstudio/go-server/middleware"
	"github.com/pushp314/digitalstudio/go-server/seeder"
	"github.com/pushp314/digitalstudio/go-server/services"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or failed to load")
	}

	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	config.ConnectDB()
	seeder.Run()
	
	if err := services.InitR2(); err != nil {
		log.Println("Failed to initialize R2 S3 Client:", err)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.MaintenanceMiddleware())

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is not set")
	}

	// ... [Standard Gin/CORS initialization] ...

	api := r.Group("/api")
	
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.GET("/me", middleware.AuthMiddleware(), handlers.Me)
	}

	chat := api.Group("/chat")
	chat.Use(middleware.AuthMiddleware())
	{
		chat.GET("/ws", handlers.ServeChatWs)
		chat.GET("/history", handlers.GetChatHistory)
	}

	// ... [Other routes like products, orders, etc.] ...

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }
	
	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
```

## 2. Real-Time Hub Handler (`handlers/chat.go`)
```go
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
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	UserID   uint
	UserName string
	IsPro    bool
}

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.Mutex
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			h.broadcastSystemMsg(fmt.Sprintf("%s joined the stream", client.UserName))
			h.broadcastOnlineCount()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				h.mu.Unlock()
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

var GlobalHub = NewHub()

func ServeChatWs(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	conn, _ := upgrader.Upgrade(c.Writer, c.Request, nil)

	var user models.User
	config.DB.First(&user, userID)

	client := &Client{
		Hub:      GlobalHub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		UserID:   userID,
		UserName: user.Name,
		IsPro:    user.IsPro,
	}
	client.Hub.Register <- client

	go client.writePump()
	go client.readPump()
}

// ... [Pumps and history logic] ...
```

## 3. Data Models (`models/chat.go`)
```go
package models

import "time"

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"userId"`
	UserName  string    `json:"userName"`
	Content   string    `json:"content"`
	Type      string    `gorm:"default:'text'" json:"type"`
	IsPro     bool      `json:"isPro"`
	CreatedAt time.Time `json:"createdAt"`
}
```
