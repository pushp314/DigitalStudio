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

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is not set")
	}

	store := cookie.NewStore([]byte(sessionSecret))
	store.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production" || sameSiteMode() == http.SameSiteNoneMode,
		SameSite: sameSiteMode(),
		MaxAge:   60 * 60,
	})
	r.Use(sessions.Sessions("digitalstudio_session", store))

	allowOrigins := allowedOriginsFromEnv()
	allowCredentials := len(allowOrigins) > 0 && !(len(allowOrigins) == 1 && allowOrigins[0] == "*")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: allowCredentials,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/healthz", handlers.Healthz)
	r.GET("/readyz", handlers.Readyz)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	publicLimiter := middleware.RateLimitMiddleware(getEnvInt("RATE_LIMIT_RPM", 120), time.Minute)
	api := r.Group("/api")
	
	auth := api.Group("/auth")
	{
		auth.POST("/register", publicLimiter, handlers.Register)
		auth.POST("/login", publicLimiter, handlers.Login)
		auth.GET("/me", middleware.AuthMiddleware(), handlers.Me)
	}

	products := api.Group("/products")
	{
		products.GET("/", publicLimiter, handlers.ListProducts)
		products.GET("/:id", publicLimiter, handlers.GetProduct)
		products.POST("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.CreateProduct)
		products.PUT("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateProduct)
		products.DELETE("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.DeleteProduct)
	}

	orders := api.Group("/orders")
	orders.Use(middleware.AuthMiddleware())
	{
		orders.POST("/", handlers.CreateOrder)
		orders.GET("/myorders", handlers.MyOrders)
	}

	users := api.Group("/users")
	users.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		users.GET("/", handlers.ListUsers)
	}

	siteConfig := api.Group("/config")
	{
		siteConfig.GET("/", handlers.GetConfig)
		siteConfig.PUT("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateConfig)
	}

	docs := api.Group("/docs")
	{
		docs.GET("/", publicLimiter, handlers.ListDocs)
		docs.GET("/:id", publicLimiter, handlers.GetDoc)
		docs.POST("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.CreateDoc)
		docs.PUT("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateDoc)
		docs.DELETE("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.DeleteDoc)
	}


	api.POST("/upload", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UploadFile)

	// OAuth
	auth.GET("/google/login", handlers.GoogleLogin)
	auth.GET("/google/callback", handlers.GoogleCallback)
	auth.GET("/github/login", handlers.GithubLogin)
	auth.GET("/github/callback", handlers.GithubCallback)

	// AI Extended
	ai := api.Group("/ai")
	{
		ai.GET("/recommend", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GetAIRecommendation)
		ai.POST("/docsummary", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GenerateDocSummary)
	}

	// Analytics
	analytics := api.Group("/analytics")
	analytics.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		analytics.GET("/sales", handlers.GetSalesAnalytics)
		analytics.GET("/top-products", handlers.GetTopProducts)
	}

	// Reviews
	products.POST("/:id/review", middleware.AuthMiddleware(), handlers.CreateReview)
	products.GET("/:id/reviews", handlers.GetReviews)

	// Payments (Razorpay)
	payments := api.Group("/payments")
	{
		payments.POST("/create-order", middleware.AuthMiddleware(), handlers.CreateRazorpayOrder)
		payments.POST("/verify", middleware.AuthMiddleware(), handlers.VerifyRazorpayPayment)
	}

	// Webhooks
	webhooks := api.Group("/webhooks")
	{
		webhooks.POST("/razorpay", handlers.RazorpayWebhook)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func allowedOriginsFromEnv() []string {
	raw := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if raw == "" {
		return []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}
	}

	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return []string{"http://localhost:5173"}
	}

	return origins
}

func sameSiteMode() http.SameSite {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAMESITE"))) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func getEnvInt(key string, fallback int) int {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
	}
	return fallback
}
