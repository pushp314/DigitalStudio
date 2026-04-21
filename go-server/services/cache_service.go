package services

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pushp314/digitalstudio/go-server/models"
)

type cachedUser struct {
	User      models.User
	ExpiresAt time.Time
}

type UserCache struct {
	mu      sync.RWMutex
	store   map[uint]cachedUser
	ttl     time.Duration
	tickets map[string]uint // Ticket -> UserID
}

var GlobalUserCache = &UserCache{
	store:   make(map[uint]cachedUser),
	tickets: make(map[string]uint),
	ttl:     20 * time.Second,
}

func (c *UserCache) IssueTicket(userID uint) string {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	ticket := uuid.New().String()
	c.tickets[ticket] = userID
	
	// Automatic expiry logic for tickets
	go func(t string) {
		time.Sleep(60 * time.Second)
		c.mu.Lock()
		delete(c.tickets, t)
		c.mu.Unlock()
	}(ticket)
	
	return ticket
}

func (c *UserCache) VerifyTicket(ticket string) (uint, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	userID, ok := c.tickets[ticket]
	if ok {
		delete(c.tickets, ticket) // One-time use
	}
	return userID, ok
}

func (c *UserCache) Get(userID uint) (models.User, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, ok := c.store[userID]
	if !ok || time.Now().After(item.ExpiresAt) {
		return models.User{}, false
	}
	return item.User, true
}

func (c *UserCache) Set(user models.User) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.store[user.ID] = cachedUser{
		User:      user,
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

func (c *UserCache) Invalidate(userID uint) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.store, userID)
}
