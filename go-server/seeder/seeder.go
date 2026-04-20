package seeder

import (
	"log"
	"os"

	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"golang.org/x/crypto/bcrypt"
)

func Run() {
	if os.Getenv("ENABLE_SEEDER") != "true" {
		log.Println("Seeder disabled. Set ENABLE_SEEDER=true to seed default data.")
		return
	}
	if os.Getenv("APP_ENV") == "production" {
		log.Fatal("ENABLE_SEEDER must remain disabled in production")
	}
	log.Println("Seeder started...")
	
	// Ensure site configuration exists before proceeding

	var admin models.User
	config.DB.Where("email = ?", "admin@codestudio.com").First(&admin)
	
	if admin.ID == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin = models.User{
			Name:     "Admin User",
			Email:    "admin@codestudio.com",
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		}
		if err := config.DB.Create(&admin).Error; err != nil {
			log.Println("Failed to create admin seeder:", err)
		} else {
			log.Println("Admin user created: admin@codestudio.com / admin123")
		}
	}
	
	// 2. Site Configuration
	var configCount int64
	config.DB.Model(&models.SiteConfig{}).Count(&configCount)
	if configCount == 0 {
		siteConfig := models.SiteConfig{
			HeroTitle:           "High-Performance Marketplace for Modern Teams",
			HeroSubtitle:        "Deploy premium React templates, technical docs, and AI-powered modules in minutes. Built for developers by developers.",
			Announcements: []string{
				"✨ New Release: Horizon AI Analytics Dashboard is now available!",
				"💎 Pro Member Sale: Save 20% on all licenses this week.",
				"📚 Technical Manuals: Deep dive into React-Go Clean Architecture.",
				"🚀 Join our Discord for exclusive product walkthroughs and support.",
			},
			ShowAnnouncement:    true,
			SupportEmail:        "support@digitalstudio.com",
			Features: map[string]bool{
				"docs":          true,
				"reviews":       true,
				"analytics":     true,
				"ai":            true,
				"payments":      true,
				"subscriptions": true,
				"licenses":      true,
				"testimonials":  true,
				"wishlist":      true,
			},
			MemberPlans: []models.MemberPlan{
				{
					Name:       "Standard",
					Badge:      "Community",
					Price:      0,
					Period:     "forever",
					Features:   []string{"Browse Marketplace", "Access Free Docs", "Public Community Support"},
					ButtonText: "Explore Assets",
					IsPopular:  false,
					IsPrimary:  false,
				},
				{
					Name:       "Pro Membership",
					Badge:      "Most Popular",
					Price:      1999,
					Period:     "month",
					Features:   []string{"Unlimited Premium Documentation", "Unlimited AI Recommendations", "Early Access to Drops", "Private Slack Community", "Priority Support"},
					ButtonText: "Get All-Access Now",
					IsPopular:  true,
					IsPrimary:  true,
				},
			},
			FAQs: []models.FAQItem{
				{Question: "What technologies do you support?", Answer: "Our marketplace primarily features React, Next.js, and Tailwind CSS templates, with Go and Node.js backend modules."},
				{Question: "Do I get free updates?", Answer: "Yes! Every purchase includes lifetime access to all future updates for that specific product."},
				{Question: "How does the license work?", Answer: "Standard products come with a Commercial License for one project. Extended licenses are available for agency use."},
			},
			SocialProof: models.SocialProofConfig{
				Rating:        "4.95/5",
				Summary:       "Rated #1 for Code Quality in 2026",
				CreatorsLabel: "Trusted by 2,000+ scaling engineering teams",
				TrustedCompanies: []string{"Vercel", "Stripe", "Prisma", "Supabase"},
			},
			ShowcaseItems: []models.ShowcaseItem{
				{
					Title:       "Admin Experience",
					Subtitle:    "Fully managed dashboards",
					Description: "Our templates include full-featured admin surfaces for order tracking and user management.",
					Image:       "https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=1200",
					Footer:      "Dashboard View",
				},
			},
			Contact: models.ContactConfig{
				Heading: "Get in touch",
				Email:   "hello@digitalstudio.com",
				Phone:   "+1 (555) 000-0000",
				Address: "Global Studio HQ",
			},
			AISettings: models.AISettings{
				Enabled: true,
				Model:   "qwen2.5:1.5b",
			},
			FrontendURL: os.Getenv("FRONTEND_URL"),
		}
		config.DB.Create(&siteConfig)
		log.Println("Advanced Site Config Seeded")
	}

	// 3. Regular Users for Management Testing
	var userCount int64
	config.DB.Model(&models.User{}).Count(&userCount)
	if userCount <= 1 { // Only admin exists
		pass, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
		testUsers := []models.User{
			{Name: "James Wilson", Email: "james@example.com", Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "pro"},
			{Name: "Sarah Chen", Email: "sarah@example.com", Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "free"},
			{Name: "Elena Rodriguez", Email: "elena@example.com", Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "pro"},
		}
		for _, u := range testUsers {
			config.DB.Create(&u)
		}
		log.Println("Test Users Seeded")
	}

	// 4. Products
	products := []models.Product{
		{
			AuthorID: admin.ID,
			Title: "Horizon AI Dashboard",
			Slug: "horizon-ai",
			Category: "SaaS",
			Price: 4999,
			Image: "https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=800",
			Description: "Next-gen analytics dashboard with real-time AI processing hooks.",
			Type: models.ProductTypeTemplate,
			StatusFlags: "featured,new",
			TechStacks: []string{"React", "Next.js", "Go"},
			FileURL: "https://github.com/pushp314/digitalstudio/archive/refs/heads/main.zip",
		},
		{
			AuthorID: admin.ID,
			Title: "Nexus Portfolio",
			Slug: "nexus-portfolio",
			Category: "Portfolio",
			Price: 1999,
			Image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=800",
			Description: "Minimalist, high-performance portfolio for creative developers.",
			Type: models.ProductTypeTemplate,
			StatusFlags: "trending",
			TechStacks: []string{"React", "GSAP"},
			FileURL: "https://github.com/pushp314/digitalstudio/archive/refs/heads/main.zip",
		},
		{
			AuthorID: admin.ID,
			Title: "DigitalStudio Pro Pass",
			Slug: "pro-membership",
			Category: "Membership",
			Price: 29,
			Image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?q=80&w=800",
			Description: "Unlimited access to all documents and premium template unlocks.",
			Type: models.ProductTypeSubscription,
			StatusFlags: "featured",
			RequiresSubscription: false,
			TechStacks: []string{"All-Access"},
		},
		{
			AuthorID: admin.ID,
			Title: "DigitalStudio Elite Pass",
			Slug: "institutional-membership",
			Category: "Institutional",
			Price: 59,
			Image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800",
			Description: "Institutional grade access for teams with dedicated CTO support.",
			Type: models.ProductTypeSubscription,
			StatusFlags: "premium",
			RequiresSubscription: false,
			TechStacks: []string{"Enterprise"},
		},
	}

	for _, p := range products {
		var existing models.Product
		if err := config.DB.Where("slug = ?", p.Slug).First(&existing).Error; err != nil {
			config.DB.Create(&p)
			log.Printf("Seeded: %s", p.Title)
		}
	}

	// 5. Mock Orders for Dashboard Metrics
	var orderCount int64
	config.DB.Model(&models.Order{}).Count(&orderCount)
	if orderCount == 0 {
		var firstProduct models.Product
		config.DB.First(&firstProduct)
		var firstUser models.User
		config.DB.Where("role = ?", models.RoleUser).First(&firstUser)

		orders := []models.Order{
			{
				UserID: firstUser.ID,
				TotalPrice: 59,
				Status: "paid",
				PaymentStatus: "paid",
				OrderItems: []models.OrderItem{
					{ProductID: firstProduct.ID, Price: 59, Quantity: 1},
				},
			},
			{
				UserID: firstUser.ID,
				TotalPrice: 99,
				Status: "paid",
				PaymentStatus: "paid",
				OrderItems: []models.OrderItem{
					{ProductID: 3, Price: 99, Quantity: 1}, // Assume 3 is Pro pass in some fresh db
				},
			},
		}
		for _, o := range orders {
			config.DB.Create(&o)
		}
		log.Println("Mock Orders Seeded")
	}
	log.Println("Product seeding check finished")

	var docCount int64
	config.DB.Model(&models.PremiumDoc{}).Count(&docCount)
	if docCount == 0 {
		docs := []models.PremiumDoc{
			{
				Title:       "Modern UI/UX Patterns for SaaS",
				Description: "Elevate your dashboard experience with these modern design principles.",
				Category:    "Design",
				IsPremium:   true,
				Icon:        "🎨",
				Image:       "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
				Content: `
# SaaS Design Patterns

Modern SaaS applications require high interaction densities without sacrificing clarity.

## 1. Interaction Consistency
Ensure that every primary action (e.g. Save, Delete) is physically located in the same relative position across all views.

## 2. Progressive Disclosure
Don't overwhelm users. Use tooltips, modals, and collapsible sections to hide advanced settings until needed.

## 3. Dark Mode First
Design your palette with dark mode in mind from day one to ensure accessible contrast ratios in both themes.
`,
				PreviewContent: "Learn the core design principles used in top-tier SaaS dashboards, from progressive disclosure to accessibility-first color tokens.",
				TableOfContents: []models.TOCItem{
					{ID: "saas-design-patterns", Title: "SaaS Design Patterns", Level: 1},
					{ID: "interaction-consistency", Title: "Interaction Consistency", Level: 2},
					{ID: "progressive-disclosure", Title: "Progressive Disclosure", Level: 2},
				},
				Price: 19,
			},
			{
				Title:       "Scalable Go-Backend Architecture",
				Description: "A deep dive into clean architecture using Go and Gin.",
				Category:    "Backend",
				IsPremium:   true,
				Icon:        "⚙️",
				Image:       "https://images.unsplash.com/photo-1518433278993-0a7df1849bc2?auto=format&fit=crop&q=80&w=800",
				Content: `
# Clean Architecture in Go

Building robust backends requires strict separation of concerns.

## Dependency Injection
Avoid global state. Pass your database connections and service dependencies through constructors.

## Interface-Driven Development
Define your repositories as interfaces. This allows for seamless mocking in unit tests.

## Error Handling
Don't just return errors. Wrap them with context using fmt.Errorf to ensure logs remain traceable.
`,
				PreviewContent: "Master the art of building production-ready Go backends using clean architecture, dependency injection, and interface-driven design.",
				TableOfContents: []models.TOCItem{
					{ID: "clean-architecture-in-go", Title: "Clean Architecture in Go", Level: 1},
					{ID: "dependency-injection", Title: "Dependency Injection", Level: 2},
				},
				Price: 25,
			},
			{
				Title:       "Getting Started with DigitalStudio",
				Description: "The essential guide to using our marketplace templates effectively.",
				Category:    "General",
				IsPremium:   false,
				Icon:        "🚀",
				Image:       "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
				Content: `
# Welcome to DigitalStudio

We are excited to help you ship your next big idea.

## Installation
All our templates are delivered as ZIP files containing a standard React/Vite structure. Just run npm install to begin.

## Configuration
Edit the .env file to add your API keys and environment variables.

## Support
Our team is available for technical support Monday through Friday via the dashboard contact form.
`,
				PreviewContent: "Get up and running with your new templates in minutes. Basic installation, configuration, and support overview.",
				TableOfContents: []models.TOCItem{
					{ID: "welcome-to-digitalstudio", Title: "Welcome to DigitalStudio", Level: 1},
				},
			},
		}
		for _, d := range docs {
			config.DB.Create(&d)
		}
		log.Println("Premium docs seeded")
	}

	// 6. Testimonials
	var testimonyCount int64
	config.DB.Model(&models.Testimonial{}).Count(&testimonyCount)
	if testimonyCount == 0 {
		jamesEmail := "james@example.com"
		sarahEmail := "sarah@example.com"
		
		var james models.User
		if err := config.DB.Where("email = ?", jamesEmail).First(&james).Error; err != nil {
			pass, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
			james = models.User{Name: "James Wilson", Email: jamesEmail, Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "pro"}
			config.DB.Create(&james)
		}

		var sarah models.User
		if err := config.DB.Where("email = ?", sarahEmail).First(&sarah).Error; err != nil {
			pass, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
			sarah = models.User{Name: "Sarah Chen", Email: sarahEmail, Password: string(pass), Role: models.RoleUser, SubscriptionPlan: "free"}
			config.DB.Create(&sarah)
		}
		
		var horizon models.Product
		if err := config.DB.Where("slug = ?", "horizon-ai").First(&horizon).Error; err != nil {
			log.Println("Skipping testimonial seeding: horizon-ai product not found")
			return
		}

		var nexus models.Product
		if err := config.DB.Where("slug = ?", "nexus-portfolio").First(&nexus).Error; err != nil {
			log.Println("Skipping testimonial seeding: nexus-portfolio product not found")
			return
		}

		testimonies := []models.Testimonial{
			{
				UserID: james.ID,
				ProductID: horizon.ID,
				Content: "The Horizon AI dashboard saved us weeks of development. The Go- Gin integration is flawlessly implemented and extremely scalable.",
				Rating: 5,
				Status: "approved",
			},
			{
				UserID: sarah.ID,
				ProductID: nexus.ID,
				Content: "Minimalist yet powerful. The Nexus Portfolio's GSAP animations are buttery smooth. Highly recommended for creative devs!",
				Rating: 5,
				Status: "approved",
			},
			{
				UserID: james.ID,
				ProductID: nexus.ID,
				Content: "Excellent code quality. The clean architecture patterns helped our team standardize our internal tools quickly.",
				Rating: 4,
				Status: "approved",
			},
		}
		for _, t := range testimonies {
			config.DB.Create(&t)
		}
		log.Println("Verified Testimonials Seeded")
	}

	log.Println("Seeder finished successfully")
}
