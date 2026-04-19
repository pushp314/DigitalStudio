package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func ServeProductSEO(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/templates")
		return
	}

	// Dynamic Metadata Payload
	title := fmt.Sprintf("%s | DigitalStudio Premium", product.Title)
	description := product.Description
	if len(description) > 160 {
		description = description[:157] + "..."
	}
	image := product.Image
	price := fmt.Sprintf("₹%.2f", product.Price)
	siteURL := "https://digitalstudio.com" // Update for production

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>%s</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="%s/templates/%s">
    <meta property="og:title" content="%s">
    <meta property="og:description" content="%s">
    <meta property="og:image" content="%s">
    <meta property="product:price:amount" content="%.2f">
    <meta property="product:price:currency" content="INR">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="%s/templates/%s">
    <meta property="twitter:title" content="%s">
    <meta property="twitter:description" content="%s">
    <meta property="twitter:image" content="%s">

    <!-- Pulse Redirect -->
    <script>
        setTimeout(function() {
            window.location.href = "/templates/%s";
        }, 300);
    </script>
</head>
<body>
    <h1>%s</h1>
    <p>%s</p>
    <p>Price: %s</p>
    <img src="%s" alt="%s">
</body>
</html>`, 
	title, siteURL, id, title, description, image, product.Price, 
	siteURL, id, title, description, image, id, title, description, price, image, title)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
