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
		products.GET("/:id/share", handlers.ServeProductSEO)
		products.GET("/:id/download", middleware.AuthMiddleware(), handlers.DownloadSecureAsset)
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

	adminOrders := api.Group("/admin/orders")
	adminOrders.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminOrders.GET("/", handlers.AdminListOrders)
		adminOrders.GET("/:id", handlers.AdminGetOrder)
		adminOrders.PATCH("/:id", handlers.AdminUpdateOrder)
	}

	adminUsers := api.Group("/admin/users")
	adminUsers.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		adminUsers.GET("", handlers.ListUsers)
		adminUsers.PATCH("/:id", handlers.UpdateUser)
		adminUsers.POST("/:id/reset-password", handlers.ResetUserPassword)
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
		ai.POST("/roadmap", middleware.AuthMiddleware(), handlers.GetUserRoadmap)
		ai.POST("/docsummary", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.GenerateDocSummary)
		ai.POST("/doc-universal", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.UniversalDocSearchChat)
		ai.POST("/chat", middleware.AuthMiddleware(), middleware.ProMiddleware(), handlers.AskDocAI)
	}

	chat := api.Group("/chat")
	chat.Use(middleware.AuthMiddleware())
	{
		chat.GET("/ws", handlers.ServeChatWs)
		chat.GET("/history", handlers.GetChatHistory)
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
		payments.POST("/create-order", middleware.AuthMiddleware(), handlers.CreateRazorpayOrder)
		payments.POST("/verify", middleware.AuthMiddleware(), handlers.VerifyRazorpayPayment)
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
		adminMarketing.DELETE("/coupons/:id", marketingHandler.DeleteCoupon)
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
		webhooks.POST("/razorpay", handlers.RazorpayWebhook)
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
