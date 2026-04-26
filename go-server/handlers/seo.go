package handlers

import (
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
)

func ServeProductSEO(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/apps")
		return
	}

	// Dynamic Metadata Payload
	title := strings.TrimSpace(product.SEOTitle)
	if title == "" {
		title = fmt.Sprintf("%s | BizCode", product.Title)
	}
	description := strings.TrimSpace(product.SEODescription)
	if description == "" {
		description = product.Description
	}
	if len(description) > 160 {
		description = description[:157] + "..."
	}
	image := strings.TrimSpace(product.OGImage)
	if image == "" {
		image = product.Image
	}
	price := fmt.Sprintf("₹%.2f", product.Price)
	siteURL := getFrontendURL()
	canonicalPath := canonicalProductPath(product)
	canonicalURL := strings.TrimRight(siteURL, "/") + canonicalPath
	productSchema, _ := json.Marshal(map[string]interface{}{
		"@context":    "https://schema.org",
		"@type":       "Product",
		"name":        product.Title,
		"description": description,
		"image":       image,
		"brand":       map[string]string{"@type": "Brand", "name": "BizCode"},
		"sku":         fmt.Sprintf("%d", product.ID),
		"category":    product.Category,
		"offers": map[string]interface{}{
			"@type":         "Offer",
			"url":           canonicalURL,
			"priceCurrency": "INR",
			"price":         product.Price,
			"availability":  "https://schema.org/InStock",
		},
	})

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>%s</title>
    <meta name="description" content="%s">
    <link rel="canonical" href="%s">
    <meta name="robots" content="index,follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="%s">
    <meta property="og:title" content="%s">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s">
    <meta property="product:price:amount" content="%.2f">
    <meta property="product:price:currency" content="INR">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="%s">
    <meta property="twitter:title" content="%s">
    <meta property="twitter:description" content="%s">
    <meta property="twitter:image" content="%s">
    <script type="application/ld+json">%s</script>

    <!-- Client Redirect -->
    <script>
        setTimeout(function() {
            window.location.href = "%s";
        }, 150);
    </script>
</head>
<body>
    <h1>%s</h1>
    <p>%s</p>
    <p>Price: %s</p>
    <img src="%s" alt="%s">
</body>
</html>`,
		html.EscapeString(title), html.EscapeString(description), canonicalURL,
		canonicalURL, html.EscapeString(title), html.EscapeString(description), image, product.Price,
		canonicalURL, html.EscapeString(title), html.EscapeString(description), image, string(productSchema), canonicalURL,
		html.EscapeString(title), html.EscapeString(description), price, image, html.EscapeString(title))

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
