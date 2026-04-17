package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
)

func ListDocs(c *gin.Context) {
	category := c.Query("category")
	var docs []models.PremiumDoc
	query := config.DB

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if err := query.Find(&docs).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	for idx := range docs {
		docs[idx].Content = ""
	}

	c.JSON(http.StatusOK, docs)
}

func GetDoc(c *gin.Context) {
	id := c.Param("id")
	var doc models.PremiumDoc
	if err := config.DB.First(&doc, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Doc not found")
		return
	}

	user, err := optionalAuthenticatedUser(c)
	if err != nil {
		respondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	doc.HasAccess = canAccessDoc(doc, user)
	doc.Locked = !doc.HasAccess
	if doc.Locked {
		if strings.TrimSpace(doc.PreviewContent) != "" {
			doc.Content = doc.PreviewContent
		} else if len(doc.Content) > 600 {
			doc.Content = doc.Content[:600]
		}
	}
	c.JSON(http.StatusOK, doc)
}

type CreateDocReq struct {
	Title           string           `json:"title" binding:"required"`
	Description     string           `json:"description"`
	Content         string           `json:"content" binding:"required"`
	PreviewContent  string           `json:"previewContent"`
	Category        string           `json:"category"`
	Price           float64          `json:"price"`
	IsPremium       bool             `json:"isPremium"`
	Icon            string           `json:"icon"`
	TableOfContents []models.TOCItem `json:"tableOfContents"`
	Tags            []string         `json:"tags"`
}

func CreateDoc(c *gin.Context) {
	var req CreateDocReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	doc := models.PremiumDoc{
		Title:           req.Title,
		Description:     req.Description,
		Content:         req.Content,
		PreviewContent:  req.PreviewContent,
		Category:        req.Category,
		Price:           req.Price,
		IsPremium:       req.IsPremium,
		Icon:            req.Icon,
		TableOfContents: req.TableOfContents,
		DocTags:         req.Tags,
	}

	if err := config.DB.Create(&doc).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	doc.HasAccess = true
	c.JSON(http.StatusCreated, doc)
}

func UpdateDoc(c *gin.Context) {
	id := c.Param("id")
	var doc models.PremiumDoc
	if err := config.DB.First(&doc, id).Error; err != nil {
		respondError(c, http.StatusNotFound, "Doc not found")
		return
	}

	var req CreateDocReq
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.Title != "" { doc.Title = req.Title }
	if req.Description != "" { doc.Description = req.Description }
	if req.Content != "" { doc.Content = req.Content }
	if req.PreviewContent != "" { doc.PreviewContent = req.PreviewContent }
	if req.Category != "" { doc.Category = req.Category }
	if req.Price != 0 { doc.Price = req.Price }
	doc.IsPremium = req.IsPremium
	if req.Icon != "" { doc.Icon = req.Icon }
	
	if req.TableOfContents != nil {
		doc.TableOfContents = req.TableOfContents
	}
	if req.Tags != nil {
		doc.DocTags = req.Tags
	}

	if err := config.DB.Save(&doc).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	doc.HasAccess = true
	c.JSON(http.StatusOK, doc)
}

func DeleteDoc(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.PremiumDoc{}, id).Error; err != nil {
		respondError(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Doc deleted successfully"})
}

func canAccessDoc(doc models.PremiumDoc, user *models.User) bool {
	if !doc.IsPremium || doc.Price == 0 {
		return true
	}

	if user == nil {
		return false
	}

	return user.Role == models.RoleAdmin || user.SubscriptionPlan == "pro"
}
