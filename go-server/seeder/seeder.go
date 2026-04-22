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

	// 1.5 Categories
	var catCount int64
	config.DB.Model(&models.ProductCategory{}).Count(&catCount)
	if catCount == 0 {
		cats := []models.ProductCategory{
			{Name: "SaaS Starters", Slug: "saas-starters", SortOrder: 1, Description: "Full-stack apps ready to launch."},
			{Name: "Dashboards", Slug: "dashboards", SortOrder: 2, Description: "Admin and analytical dashboards."},
			{Name: "Website Kits", Slug: "website-kits", SortOrder: 3, Description: "High-quality landing page and website assets."},
			{Name: "UI Systems", Slug: "ui-systems", SortOrder: 4, Description: "Reusable UI components and design systems."},
		}
		for _, c := range cats {
			config.DB.Create(&c)
		}
	}

	// 1.6 Service Intents
	var serviceCount int64
	config.DB.Model(&models.ServiceIntent{}).Count(&serviceCount)
	if serviceCount == 0 {
		intents := []models.ServiceIntent{
			{
				Name: "Custom Build",
				Slug: "custom-build",
				Headline: "End-to-End Product Engineering",
				Subheadline: "From concept to production-ready system.",
				Description: "Hire our core team to build your entire application with our signature high-fidelity architecture and performance standards.",
				CTA: "Request Custom Quote",
				SortOrder: 1,
			},
			{
				Name: "Fix Existing Project",
				Slug: "fix-existing-project",
				Headline: "Expert Debugging & Optimization",
				Subheadline: "Stable. Scaleable. Secure.",
				Description: "Having trouble with your existing codebase? We specialize in refactoring, security hardening, and performance tuning for Go and React environments.",
				CTA: "Open Support Request",
				SortOrder: 2,
			},
			{
				Name: "Consultation",
				Slug: "consultation",
				Headline: "Strategic Technical Advisory",
				Subheadline: "Build with confidence.",
				Description: "Not sure about your tech stack? Talk to our leads for a 1:1 strategy session on architecture, scaling, and deployment optimization.",
				CTA: "Book Consultation",
				SortOrder: 3,
			},
		}
		for _, i := range intents {
			config.DB.Create(&i)
		}
		log.Println("Service Intents Seeded")
	}

	// 1.7 Expert Intents
	var expertCount int64
	config.DB.Model(&models.ExpertIntent{}).Count(&expertCount)
	if expertCount == 0 {
		intents := []models.ExpertIntent{
			{
				Name: "Get Help Choosing",
				Slug: "help-choosing",
				Headline: "Expert Navigation",
				Subheadline: "Find the perfect starting point.",
				Description: "Unsure which ready-app or guide fits your project? Talk to an expert for a curated recommendation based on your technical goals.",
				CTA: "Talk to Expert",
				IsPaid: false,
				SortOrder: 1,
			},
			{
				Name: "Pre-Purchase Questions",
				Slug: "pre-purchase-questions",
				Headline: "Clarity & Confidence",
				Subheadline: "Get all the details before you commit.",
				Description: "Need specific technical details about a product's architecture or implementation? We're here to answer every pre-sales question.",
				CTA: "Ask a Question",
				IsPaid: false,
				SortOrder: 2,
			},
			{
				Name: "Product Recommendation",
				Slug: "product-recommendation",
				Headline: "Personalized Discovery",
				Subheadline: "Tailored to your roadmap.",
				Description: "Deep dive into your project requirements with a lead developer to receive a personalized asset list and implementation roadmap.",
				CTA: "Get Recommendation",
				IsPaid: true,
				BaseFee: 99,
				SortOrder: 3,
			},
		}
		for _, i := range intents {
			config.DB.Create(&i)
		}
		log.Println("Expert Intents Seeded")
	}

	// 2. Site Configuration
	var configCount int64
	config.DB.Model(&models.SiteConfig{}).Count(&configCount)
	if configCount == 0 {
		siteConfig := models.SiteConfig{
			HeroTitle:           "Buy ready apps. Customize them. Or let us build for you.",
			HeroSubtitle:        "Skip months of development with production-ready apps, technical guides, expert help, and custom build support in one place.",
			Announcements: []string{
				"New ready app: Horizon AI Analytics Dashboard is now available.",
				"Pro members get priority support and premium implementation guides.",
				"Need changes? Request custom work from the DigitalStudio team.",
				"Submit your own project for approval-based listing.",
			},
			ShowAnnouncement:    true,
			SupportEmail:        "support@digitalstudio.app",
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
					Badge:      "Free",
					Price:      0,
					Period:     "forever",
					Features:   []string{"Browse ready apps", "Buy individual products", "Access free guides", "Use standard support"},
					ButtonText: "Explore Apps",
					IsPopular:  false,
					IsPrimary:  false,
				},
				{
					Name:       "Pro Membership",
					Badge:      "Most Popular",
					Price:      1999,
					Period:     "month",
					Features:   []string{"Premium implementation guides", "Priority support", "Community chat access", "Product setup help"},
					ButtonText: "Upgrade to Pro",
					IsPopular:  true,
					IsPrimary:  true,
				},
			},
			FAQs: []models.FAQItem{
				{Question: "What technologies do you support?", Answer: "DigitalStudio lists ready apps, templates, fullstack projects, UI kits, and backend modules across React, Next.js, Tailwind CSS, Go, and Node.js."},
				{Question: "Do I get free updates?", Answer: "Yes! Every purchase includes lifetime access to all future updates for that specific product."},
				{Question: "How does the license work?", Answer: "Standard products come with a Commercial License for one project. Extended licenses are available for agency use."},
			},
			SocialProof: models.SocialProofConfig{
				Rating:        "4.95/5",
				Summary:       "Trusted by builders who need production-ready systems",
				CreatorsLabel: "Used by founders, agencies, and technical teams",
				TrustedCompanies: []string{"Vercel", "Stripe", "Prisma", "Supabase"},
			},
			ShowcaseItems: []models.ShowcaseItem{
				{
					Title:       "Admin Experience",
					Subtitle:    "Fully managed dashboards",
					Description: "Our ready products include full-featured admin surfaces for order tracking and user management.",
					Image:       "https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=1200",
					Footer:      "Dashboard View",
				},
			},
			Contact: models.ContactConfig{
				Heading: "Get in touch",
				Email:   "hello@digitalstudio.app",
				Phone:   "+1 (555) 000-0000",
				Address: "Global Studio HQ",
			},
			AISettings: models.AISettings{
				Enabled:  true,
				Provider: "gemini",
				Model:    "gemini-1.5-flash",
				APIKey:   "AIzaSyB5T8vy3jUPPnaApyLObuvj4iDhMXP6vWI",
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
	var saasCat models.ProductCategory
	config.DB.Where("slug = ?", "saas-starters").First(&saasCat)
	var dashboardCat models.ProductCategory
	config.DB.Where("slug = ?", "dashboards").First(&dashboardCat)

	products := []models.Product{
		{
			AuthorID: admin.ID,
			Title: "Horizon AI Dashboard",
			Slug: "horizon-ai",
			Category: "SaaS",
			CategoryID: func() *uint { if saasCat.ID != 0 { return &saasCat.ID }; return nil }(),
			Price: 4999,
			Image: "https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=800",
			Description: "Production-ready analytics dashboard with real-time AI processing hooks, admin surfaces, and room for custom implementation.",
			Type:        models.ProductTypeFullstack,
			StatusFlags: "featured,new,bestseller",
			TechStacks:  []string{"React", "Next.js", "Go"},
			LiveDemo:    "https://horizon-ui.com/horizon-tailwind-react-ts-main/",
			FileURL:     "https://github.com/pushp314/digitalstudio/archive/refs/heads/main.zip",
		},
		{
			AuthorID: admin.ID,
			Title: "Launch Portfolio Kit",
			Slug: "launch-portfolio-kit",
			Category: "Portfolio",
			Price: 1999,
			Image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=800",
			Description: "Minimalist portfolio kit for founders, creators, and agencies who need a polished launch presence quickly.",
			Type:        models.ProductTypeTemplate,
			StatusFlags: "trending,featured",
			TechStacks:  []string{"React", "GSAP"},
			LiveDemo:    "https://portfolio-starter-kit.vercel.app/",
			FileURL:     "https://github.com/pushp314/digitalstudio/archive/refs/heads/main.zip",
		},
		{
			AuthorID: admin.ID,
			Title: "DigitalStudio Pro Membership",
			Slug: "pro-membership",
			Category: "Membership",
			Price: 29,
			Image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?q=80&w=800",
			Description: "Premium guides, community chat access, priority support, and implementation help for active builders.",
			Type: models.ProductTypeSubscription,
			StatusFlags: "featured",
			RequiresSubscription: false,
			TechStacks: []string{"All-Access"},
		},
		{
			AuthorID: admin.ID,
			Title: "DigitalStudio Team Support",
			Slug: "institutional-membership",
			Category: "Institutional",
			Price: 59,
			Image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800",
			Description: "Team-oriented support for custom development, deployment planning, and technical handoff.",
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
				Description: "The essential guide to buying ready products, requesting help, and using post-purchase support.",
				Category:    "General",
				IsPremium:   false,
				Icon:        "🚀",
				Image:       "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
				Content: `
# Welcome to DigitalStudio

We are excited to help you ship your next big idea.

## Installation
Products are delivered through your account after payment verification. Many code products include a ZIP or repository-style structure with setup notes.

## Configuration
Edit the .env file to add your API keys and environment variables.

## Support
Our team can help with product fit, setup, deployment, implementation questions, and custom development requests.
`,
				PreviewContent: "Get up and running with your new product in minutes. Basic installation, configuration, and support overview.",
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

		var portfolio models.Product
		if err := config.DB.Where("slug = ?", "launch-portfolio-kit").First(&portfolio).Error; err != nil {
			log.Println("Skipping testimonial seeding: launch-portfolio-kit product not found")
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
				ProductID: portfolio.ID,
				Content: "Minimalist yet powerful. The Launch Portfolio Kit helped us ship a polished launch presence quickly.",
				Rating: 5,
				Status: "approved",
			},
			{
				UserID: james.ID,
				ProductID: portfolio.ID,
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
