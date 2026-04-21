package main

import (
	"log"
	"log/slog"
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
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.MaintenanceMiddleware())
	r.Use(func(c *gin.Context) { c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 5<<20); c.Next() })

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

	publicLimiter := middleware.RateLimitMiddleware("public", getEnvInt("RATE_LIMIT_RPM", 120), time.Minute)
	authLimiter := middleware.RateLimitMiddleware("auth", getEnvInt("AUTH_RATE_LIMIT_RPM", 20), time.Minute)
	paymentCreateLimiter := middleware.RateLimitMiddleware("payment_create", getEnvInt("PAYMENT_CREATE_RATE_LIMIT_RPM", 15), time.Minute)
	paymentVerifyLimiter := middleware.RateLimitMiddleware("payment_verify", getEnvInt("PAYMENT_VERIFY_RATE_LIMIT_RPM", 20), time.Minute)
	uploadLimiter := middleware.RateLimitMiddleware("upload", getEnvInt("UPLOAD_RATE_LIMIT_RPM", 30), time.Minute)
	webhookLimiter := middleware.RateLimitMiddleware("webhook", getEnvInt("WEBHOOK_RATE_LIMIT_RPM", 120), time.Minute)
	api := r.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authLimiter, handlers.Register)
		auth.POST("/login", authLimiter, handlers.Login)
		auth.GET("/me", middleware.AuthMiddleware(), handlers.Me)
	}

	products := api.Group("/products")
	{
		products.GET("/", publicLimiter, handlers.ListProducts)
		products.GET("/:id", publicLimiter, handlers.GetProduct)
		products.GET("/owned", middleware.AuthMiddleware(), handlers.GetOwnedProducts)
		products.GET("/:id/share", handlers.ServeProductSEO)
		products.GET("/:id/download", middleware.AuthMiddleware(), handlers.DownloadSecureAsset)
		products.POST("/", middleware.AuthMiddleware(), handlers.CreateProduct)
		products.PUT("/:id", middleware.AuthMiddleware(), handlers.UpdateProduct)
		products.DELETE("/:id", middleware.AuthMiddleware(), handlers.DeleteProduct)
	}

	categories := api.Group("/categories")
	{
		categories.GET("/", handlers.GetCategories)
		categories.GET("/:slug", handlers.GetCategoryBySlug)
	}

	orders := api.Group("/orders")
	orders.Use(middleware.AuthMiddleware())
	{
		orders.POST("/", handlers.CreateOrder)
		orders.GET("/myorders", handlers.MyOrders)
	}

	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		// Order Management
		adminOrders := admin.Group("/orders")
		{
			adminOrders.GET("/", handlers.AdminListOrders)
			adminOrders.GET("/:id", handlers.AdminGetOrder)
			adminOrders.PATCH("/:id", handlers.AdminUpdateOrder)
		}

		adminUsers := admin.Group("/users")
		{
			adminUsers.GET("", handlers.ListUsers)
			adminUsers.PATCH("/:id", handlers.UpdateUser)
			adminUsers.POST("/:id/reset-password", handlers.ResetUserPassword)
		}

		adminGithub := admin.Group("/github-requests")
		{
			adminGithub.GET("", handlers.GetAllGithubRequests)
			adminGithub.PATCH("/:id", handlers.ResolveGithubRequest)
		}

		adminCategories := admin.Group("/categories")
		{
			adminCategories.GET("/", handlers.GetCategories)
			adminCategories.POST("/", handlers.CreateCategory)
			adminCategories.PUT("/:id", handlers.UpdateCategory)
			adminCategories.DELETE("/:id", handlers.DeleteCategory)
		}

		adminIntents := admin.Group("/intents")
		{
			adminIntents.POST("/service", handlers.CreateServiceIntent)
			adminIntents.PUT("/service/:id", handlers.UpdateServiceIntent)
			adminIntents.POST("/expert", handlers.CreateExpertIntent)
			adminIntents.PUT("/expert/:id", handlers.UpdateExpertIntent)
		}
	}

	intents := api.Group("/intents")
	{
		intents.GET("/service", handlers.GetServiceIntents)
		intents.GET("/service/:slug", handlers.GetServiceIntentBySlug)
		intents.GET("/expert", handlers.GetExpertIntents)
		intents.GET("/expert/:slug", handlers.GetExpertIntentBySlug)
	}

	api.GET("/profile/:id", handlers.GetPublicProfile)
	api.GET("/users/:id/profile", handlers.GetPublicProfile)
	api.POST("/profile/:id/report", middleware.AuthMiddleware(), handlers.ReportUser)
	profile := api.Group("/profile", middleware.AuthMiddleware())
	{
		profile.GET("", handlers.Me)
		profile.PUT("", handlers.UpdateMyProfile)
		profile.POST("/upload-avatar", uploadLimiter, handlers.UploadProfileAvatar)
		profile.POST("/github-request", handlers.RequestGithubChange)
		profile.GET("/github-requests", handlers.GetMyGithubRequests)
		profile.POST("/change-password", handlers.ChangePassword)
		profile.GET("/inquiries", handlers.MyInquiries)
		profile.POST("/inquiries/:id/reply", handlers.UserReplyToInquiry)
	}

	siteConfig := api.Group("/config")
	{
		siteConfig.GET("/", handlers.GetConfig)
		siteConfig.GET("/admin", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.GetAdminConfig)
		siteConfig.PUT("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateConfig)
	}

	docs := api.Group("/docs")
	{
		docs.GET("/", publicLimiter, handlers.ListDocs)
		docs.GET("/:id", publicLimiter, handlers.GetDoc)
		docs.POST("/", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.CreateDoc)
		docs.PUT("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UpdateDoc)
		docs.DELETE("/:id", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.DeleteDoc)
		docs.GET("/:id/chat", middleware.AuthMiddleware(), handlers.GetDocChatHistory)
		docs.DELETE("/:id/chat", middleware.AuthMiddleware(), handlers.DeleteDocChat)
	}

	api.POST("/upload", uploadLimiter, middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.UploadFile)

	// OAuth
	auth.GET("/google/login", handlers.GoogleLogin)
	auth.GET("/google/callback", handlers.GoogleCallback)
	auth.GET("/github/login", handlers.GithubLogin)
	auth.GET("/github/callback", handlers.GithubCallback)
	auth.GET("/github/connect", middleware.OAuthAuthMiddleware(), handlers.GithubConnect)

	// AI Extended
	ai := api.Group("/ai")
	{
		ai.POST("/generate-description", middleware.AuthMiddleware(), handlers.GenerateAIDescription)
		ai.POST("/suggest-tags", middleware.AuthMiddleware(), handlers.SuggestAITags)
		ai.POST("/recommend-pricing", middleware.AuthMiddleware(), handlers.RecommendAIPricing)
		ai.POST("/suggest-usernames", middleware.AuthMiddleware(), handlers.SuggestUsernames)
		ai.GET("/recommend", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GetAIRecommendation)
		ai.POST("/roadmap", middleware.AuthMiddleware(), handlers.GetUserRoadmap)
		ai.POST("/docsummary", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GenerateDocSummary)
		ai.POST("/doc-universal", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.UniversalDocSearchChat)
		ai.POST("/chat", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.AskDocAI)
	}

	handlers.RegisterEliteRoutes(api)
	
	chat := api.Group("/chat")
	{
		chat.GET("/ws", handlers.ServeChatWs) // Authenticated via Ticket internally
		
		chatAuth := chat.Group("", middleware.AuthMiddleware())
		{
			// Tight rate limit on ticket issuance to prevent flood/abuse
			chatAuth.POST("/ticket", middleware.RateLimitMiddleware("chat_ticket", 10, time.Minute), handlers.CreateChatTicket)
			chatAuth.GET("/history", handlers.GetChatHistory)
			chatAuth.POST("/messages", handlers.SendChatMessage)
			chatAuth.PUT("/messages/:id", handlers.UpdateChatMessage)
			chatAuth.DELETE("/messages/:id", handlers.DeleteChatMessage)
			chatAuth.POST("/messages/:id/pin", handlers.PinChatMessage)
			chatAuth.POST("/messages/:id/report", handlers.ReportChatMessage)
			chatAuth.POST("/messages/bulk-delete", middleware.AdminMiddleware(), handlers.BulkDeleteMessages)
		}
	}

	analytics := api.Group("/analytics")
	analytics.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		analytics.GET("/metrics", handlers.GetIntelligenceMetrics)
	}

	// Reviews
	products.POST("/:id/review", middleware.AuthMiddleware(), handlers.CreateReview)
	products.GET("/:id/reviews", handlers.GetReviews)
	products.GET("/:id/review-eligibility", middleware.AuthMiddleware(), handlers.GetReviewEligibility)

	adminReviews := api.Group("/admin/reviews")
	adminReviews.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminReviews.GET("/", handlers.AdminListReviews)
		adminReviews.PATCH("/:id", handlers.AdminUpdateReview)
		adminReviews.DELETE("/:id", handlers.AdminDeleteReview)
	}

	// Payments (Razorpay)
	payments := api.Group("/payments")
	{
		payments.POST("/create-order", paymentCreateLimiter, middleware.AuthMiddleware(), handlers.CreateRazorpayOrder)
		payments.POST("/verify", paymentVerifyLimiter, middleware.AuthMiddleware(), handlers.VerifyRazorpayPayment)
	}

	licenses := api.Group("/licenses")
	{
		licenses.GET("/my", middleware.AuthMiddleware(), handlers.MyLicenses)
		licenses.POST("/validate", publicLimiter, handlers.ValidateLicense)
	}

	// Testimonials
	api.GET("/testimonials", handlers.GetApprovedTestimonials)
	api.POST("/testimonials", middleware.AuthMiddleware(), handlers.CreateTestimonial)

	adminTestimonials := api.Group("/admin/testimonials")
	adminTestimonials.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminTestimonials.GET("/", handlers.AdminListTestimonials)
		adminTestimonials.PATCH("/:id/approve", handlers.AdminApproveTestimonial)
		adminTestimonials.PATCH("/:id/reject", handlers.AdminRejectTestimonial)
		adminTestimonials.DELETE("/:id", handlers.AdminDeleteTestimonial)
	}

	marketingHandler := handlers.NewMarketingHandler(config.DB)

	adminMarketing := api.Group("/admin/marketing")
	adminMarketing.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminMarketing.GET("/coupons", marketingHandler.ListCoupons)
		adminMarketing.POST("/coupons", marketingHandler.CreateCoupon)
		adminMarketing.PATCH("/coupons/:id", marketingHandler.UpdateCoupon)
		adminMarketing.PATCH("/coupons/:id/revoke", marketingHandler.RevokeCoupon)
		adminMarketing.DELETE("/coupons/:id", marketingHandler.HardDeleteCoupon)
	}

	// Showcase & Social Proof
	api.POST("/showcase", middleware.AuthMiddleware(), handlers.SubmitShowcase)
	adminShowcases := api.Group("/admin/showcases")
	adminShowcases.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminShowcases.GET("/", handlers.AdminListShowcases)
		adminShowcases.PATCH("/:id/status", handlers.AdminUpdateShowcaseStatus)
	}

	marketing := api.Group("/marketing")
	{
		marketing.GET("/validate", marketingHandler.ValidateCoupon)
		marketing.POST("/wishlist-deals", middleware.AuthMiddleware(), marketingHandler.GetWishlistDeals)
		marketing.GET("/wishlist-deals", middleware.AuthMiddleware(), marketingHandler.GetWishlistDeals)
		marketing.POST("/personalized-offers", middleware.AuthMiddleware(), marketingHandler.GetPersonalizedOffers)
	}

	adminIntelligence := api.Group("/admin/intelligence")
	adminIntelligence.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminIntelligence.GET("/metrics", handlers.GetIntelligenceMetrics)
	}

	webhooks := api.Group("/webhooks")
	{
		webhooks.POST("/razorpay", webhookLimiter, handlers.RazorpayWebhook)
	}

	// Contact Inquiries
	api.POST("/contact", handlers.CreateContactInquiry)
	api.GET("/my-inquiries", middleware.AuthMiddleware(), handlers.MyInquiries)

	adminContact := api.Group("/admin/contact")
	adminContact.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminContact.GET("/", handlers.AdminListInquiries)
		adminContact.PATCH("/:id/reply", handlers.AdminReplyToInquiry)
	}

	adminLicenses := api.Group("/admin/licenses")
	adminLicenses.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminLicenses.POST("/issue", handlers.AdminIssueLicenses)
	}

	// Notifications
	notifications := api.Group("/notifications")
	{
		notifications.GET("/", middleware.AuthMiddleware(), handlers.GetMyNotifications)
		notifications.POST("/broadcast", middleware.AuthMiddleware(), middleware.AdminMiddleware(), handlers.AdminBroadcastNotification)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	
	// Start Background Orchestrators
	go startBackgroundPruner()

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func startBackgroundPruner() {
	ticker := time.NewTicker(1 * time.Hour)
	for range ticker.C {
		log.Println("Maintenance[Background]: Pruning expired protocol nodes...")
		
		// 1. Prune expired Chat Sessions
		result := config.DB.Where("status = ? AND expires_at < ?", "active", time.Now()).
			Update("status", "expired")
		if result.RowsAffected > 0 {
			log.Printf("Maintenance[Chat]: Pruned %d expired support sessions", result.RowsAffected)
		}

		// 2. Clear abandoned coupon reservations (logic in order_service would be ideal)
		// ... potentially more cleanup logic here
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
