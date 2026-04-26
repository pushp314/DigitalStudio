package handlers

import (
	"encoding/xml"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

type sitemapURLSet struct {
	XMLName xml.Name     `xml:"urlset"`
	Xmlns   string       `xml:"xmlns,attr"`
	URLs    []sitemapURL `xml:"url"`
}

type sitemapURL struct {
	Loc        string `xml:"loc"`
	LastMod    string `xml:"lastmod,omitempty"`
	ChangeFreq string `xml:"changefreq,omitempty"`
	Priority   string `xml:"priority,omitempty"`
}

func ServeSitemap(c *gin.Context) {
	siteURL := strings.TrimRight(getFrontendURL(), "/")
	if siteURL == "" {
		siteURL = "https://bizcode.appnity.co.in"
	}

	now := time.Now().UTC().Format("2006-01-02")
	urls := []sitemapURL{
		buildSitemapURL(siteURL, "/", now, "daily", "1.00"),
		buildSitemapURL(siteURL, "/assets", now, "daily", "0.95"),
		buildSitemapURL(siteURL, "/hire-developer", now, "weekly", "0.85"),
		buildSitemapURL(siteURL, "/custom-request", now, "weekly", "0.85"),
		buildSitemapURL(siteURL, "/ai-requirements-generator", now, "weekly", "0.75"),
		buildSitemapURL(siteURL, "/blog", now, "weekly", "0.80"),
	}

	seenCategories := map[string]bool{}
	for _, category := range seoCategoryRoutes {
		urls = append(urls, buildSitemapURL(siteURL, "/assets/"+category.Slug, now, "daily", category.Priority))
		seenCategories[category.Slug] = true
	}

	if config.DB != nil {
		var categories []models.ProductCategory
		if err := config.DB.Where("is_active = ?", true).Order("sort_order asc").Find(&categories).Error; err == nil {
			for _, category := range categories {
				product := models.Product{Category: category.Name, CategoryRel: &category}
				categorySlug := canonicalCategorySlug(product)
				if !seenCategories[categorySlug] {
					urls = append(urls, buildSitemapURL(siteURL, "/assets/"+categorySlug, now, "weekly", "0.75"))
					seenCategories[categorySlug] = true
				}
			}
		}
	}

	for _, blogSlug := range blogSitemapSlugs {
		urls = append(urls, buildSitemapURL(siteURL, "/blog/"+blogSlug, now, "monthly", "0.70"))
	}

	var products []models.Product
	if config.DB != nil {
		if err := config.DB.
			Preload("CategoryRel").
			Where("moderation_status = ? AND status_flags NOT ILIKE ?", models.ModStatusApproved, "%archived%").
			Order("updated_at desc").
			Find(&products).Error; err == nil {
			for _, product := range products {
				lastmod := product.UpdatedAt.UTC().Format("2006-01-02")
				if product.UpdatedAt.IsZero() {
					lastmod = now
				}
				urls = append(urls, buildSitemapURL(siteURL, canonicalProductPath(product), lastmod, "weekly", "0.80"))
			}
		}
	}

	payload, err := xml.MarshalIndent(sitemapURLSet{
		Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
		URLs:  urls,
	}, "", "  ")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Unable to generate sitemap")
		return
	}

	c.Header("Content-Type", "application/xml; charset=utf-8")
	c.Data(http.StatusOK, "application/xml; charset=utf-8", append([]byte(xml.Header), payload...))
}

func buildSitemapURL(siteURL string, path string, lastmod string, changefreq string, priority string) sitemapURL {
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	return sitemapURL{
		Loc:        siteURL + path,
		LastMod:    lastmod,
		ChangeFreq: changefreq,
		Priority:   priority,
	}
}
