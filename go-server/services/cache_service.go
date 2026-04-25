package services

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/utils"
	"github.com/redis/go-redis/v9"
)

type CacheService interface {
	Get(ctx context.Context, key string, dest interface{}) error
	Set(ctx context.Context, key string, val interface{}, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	InvalidateByPrefix(ctx context.Context, prefix string) error
}

type redisCacheService struct {
	client *redis.Client
}

func NewCacheService(cfg config.Config) CacheService {
	if cfg.RedisURL == "" {
		log.Println("[Cache] Redis URL not provided, caching disabled.")
		return &noopCacheService{}
	}

	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisURL,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := client.Ping(ctx).Result(); err != nil {
		log.Printf("[Cache] Failed to connect to Redis: %v. Caching disabled.\n", err)
		return &noopCacheService{}
	}

	log.Println("[Cache] Redis connected successfully.")
	return &redisCacheService{client: client}
}

func (s *redisCacheService) Get(ctx context.Context, key string, dest interface{}) error {
	val, err := s.client.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (s *redisCacheService) Set(ctx context.Context, key string, val interface{}, ttl time.Duration) error {
	data, err := json.Marshal(val)
	if err != nil {
		return err
	}
	return s.client.Set(ctx, key, data, ttl).Err()
}

func (s *redisCacheService) Delete(ctx context.Context, key string) error {
	return s.client.Del(ctx, key).Err()
}

func (s *redisCacheService) InvalidateByPrefix(ctx context.Context, prefix string) error {
	iter := s.client.Scan(ctx, 0, prefix+"*", 0).Iterator()
	for iter.Next(ctx) {
		if err := s.client.Del(ctx, iter.Val()).Err(); err != nil {
			log.Printf("[Cache] Failed to delete key %s: %v\n", iter.Val(), err)
		}
	}
	return iter.Err()
}

// No-op implementation for when Redis is disabled
type noopCacheService struct{}

func (s *noopCacheService) Get(ctx context.Context, key string, dest interface{}) error {
	return redis.Nil
}
func (s *noopCacheService) Set(ctx context.Context, key string, val interface{}, ttl time.Duration) error {
	return nil
}
func (s *noopCacheService) Delete(ctx context.Context, key string) error {
	return nil
}
func (s *noopCacheService) InvalidateByPrefix(ctx context.Context, prefix string) error {
	return nil
}

var Cache CacheService

func InitCache() {
	Cache = NewCacheService(config.AppConfig)
}

// GlobalUserCache handles short-lived chat tickets and user metadata caching
type UserCache struct {
	tickets map[string]ticketInfo
	users   map[uint]models.User
	mu      sync.RWMutex
}

type ticketInfo struct {
	UserID    uint
	ExpiresAt time.Time
}

func NewUserCache() *UserCache {
	uc := &UserCache{
		tickets: make(map[string]ticketInfo),
		users:   make(map[uint]models.User),
	}
	go uc.prune()
	return uc
}

func (c *UserCache) IssueTicket(userID uint) string {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	ticket := fmt.Sprintf("tkt_%s", hex.EncodeToString(utils.GenerateRandomBytes(16)))
	c.tickets[ticket] = ticketInfo{
		UserID:    userID,
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	return ticket
}

func (c *UserCache) VerifyTicket(ticket string) (uint, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	
	info, ok := c.tickets[ticket]
	if !ok || time.Now().After(info.ExpiresAt) {
		return 0, false
	}
	return info.UserID, true
}

func (c *UserCache) Get(userID uint) (models.User, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	user, ok := c.users[userID]
	return user, ok
}

func (c *UserCache) Set(user models.User) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.users[user.ID] = user
}

func (c *UserCache) prune() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for t, info := range c.tickets {
			if now.After(info.ExpiresAt) {
				delete(c.tickets, t)
			}
		}
		// Clear user cache periodically to avoid staleness
		if len(c.users) > 1000 {
			c.users = make(map[uint]models.User)
		}
		c.mu.Unlock()
	}
}

var GlobalUserCache = NewUserCache()
