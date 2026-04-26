package handlers

import (
	"fmt"
	"strings"

	"github.com/gosimple/slug"
	"github.com/pushp314/bizcode/go-server/models"
)

type seoCategoryRoute struct {
	Slug     string
	Priority string
}

var seoCategoryRoutes = []seoCategoryRoute{
	{Slug: "saas-templates", Priority: "0.90"},
	{Slug: "dashboard-templates", Priority: "0.90"},
	{Slug: "fullstack-projects", Priority: "0.90"},
	{Slug: "website-templates", Priority: "0.85"},
	{Slug: "ui-systems", Priority: "0.80"},
}

var blogSitemapSlugs = []string{
	"best-saas-templates-to-launch-fast",
	"how-to-build-a-dashboard-in-24-hours",
	"fullstack-projects-you-can-sell",
	"saas-starter-kit-vs-custom-build",
	"react-admin-dashboard-template-checklist",
	"deployment-ready-project-checklist",
	"how-to-choose-a-saas-template",
	"admin-panel-ui-best-practices",
	"custom-saas-development-costs",
	"developer-assets-for-startups",
}

func canonicalProductPath(product models.Product) string {
	categorySlug := canonicalCategorySlug(product)
	productSlug := strings.TrimSpace(product.Slug)
	if productSlug == "" {
		productSlug = slug.Make(product.Title)
	}
	if productSlug == "" {
		productSlug = fmt.Sprintf("product-%d", product.ID)
	}
	return fmt.Sprintf("/assets/%s/%s", categorySlug, productSlug)
}

func canonicalCategorySlug(product models.Product) string {
	if product.Type == models.ProductTypeFullstack {
		return "fullstack-projects"
	}

	source := ""
	if product.CategoryRel != nil {
		source = product.CategoryRel.Slug
	}
	if strings.TrimSpace(source) == "" {
		source = product.Category
	}

	switch strings.ToLower(strings.TrimSpace(source)) {
	case "saas", "saas-starters", "saas-starter", "saas templates", "saas-templates":
		return "saas-templates"
	case "dashboard", "dashboards", "dashboard-templates", "admin-dashboard", "admin dashboards":
		return "dashboard-templates"
	case "portfolio", "website", "website-kits", "websites", "landing-pages", "website-templates":
		return "website-templates"
	case "ui", "ui-systems", "ui systems", "ui-kit", "ui-kits", "components":
		return "ui-systems"
	}

	if strings.TrimSpace(source) == "" {
		return "developer-assets"
	}
	return slug.Make(source)
}
