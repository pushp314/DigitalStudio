package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pushp314/bizcode/go-server/config"
	"github.com/pushp314/bizcode/go-server/models"
	"github.com/pushp314/bizcode/go-server/services"
)

func CreateContactInquiry(c *gin.Context) {
	var raw map[string]interface{}
	if err := c.ShouldBindJSON(&raw); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Decision logic to route to correct handler/logic
	if _, ok := raw["expertIntentId"]; ok {
		// Expert Help Path
		// Manually bind from raw map or use a re-binding trick
		// For simplicity, I'll use gorm's ability to create from map with Table name specified
		// But structs are better for hooks. I'll just manually call the logic here.
		
		user, _ := optionalAuthenticatedUser(c)
		newReq := models.ExpertHelpRequest{
			SharedInquiryFields: models.SharedInquiryFields{
				Name: raw["name"].(string),
				Email: raw["email"].(string),
				Message: raw["message"].(string),
			},
		}
		if s, ok := raw["subject"].(string); ok { newReq.Subject = s }
		if eid, ok := raw["expertIntentId"].(float64); ok { 
			val := uint(eid)
			newReq.ExpertIntentID = &val 
		}
		if user != nil { newReq.UserID = &user.ID }
		
		if err := config.DB.Create(&newReq).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "Failed to save expert request")
			return
		}
		backgroundAnalyzeInquiry("expert", newReq.ID, newReq.Message)
		c.JSON(http.StatusOK, gin.H{"message": "Expert help request received"})
		return
	}

	// Assume Hire Developer Path or general inquiry
	newReq := models.HireDeveloperRequest{
		SharedInquiryFields: models.SharedInquiryFields{
			Name: raw["name"].(string),
			Email: raw["email"].(string),
			Message: raw["message"].(string),
		},
	}
	if s, ok := raw["subject"].(string); ok { newReq.Subject = s }
	if sid, ok := raw["serviceIntentId"].(float64); ok { 
		val := uint(sid)
		newReq.ServiceIntentID = &val 
	}
	user, _ := optionalAuthenticatedUser(c)
	if user != nil { newReq.UserID = &user.ID }

	if err := config.DB.Create(&newReq).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save hire request")
		return
	}
	backgroundAnalyzeInquiry("hire", newReq.ID, newReq.Message)
	c.JSON(http.StatusOK, gin.H{"message": "Hire developer request received"})
}

func CreateHireDeveloperRequest(c *gin.Context) {
	var req models.HireDeveloperRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	user, _ := optionalAuthenticatedUser(c)
	if user != nil {
		req.UserID = &user.ID
	}
	if err := config.DB.Create(&req).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save request")
		return
	}
	
	backgroundAnalyzeInquiry("hire", req.ID, req.Message)
	c.JSON(http.StatusOK, gin.H{"message": "Request received"})
}

func CreateExpertHelpRequest(c *gin.Context) {
	var req models.ExpertHelpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	user, _ := optionalAuthenticatedUser(c)
	if user != nil {
		req.UserID = &user.ID
	}
	if err := config.DB.Create(&req).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to save request")
		return
	}
	
	backgroundAnalyzeInquiry("expert", req.ID, req.Message)
	c.JSON(http.StatusOK, gin.H{"message": "Request received"})
}

func backgroundAnalyzeInquiry(table string, id uint, msg string) {
	go func(t string, i uint, m string) {
		sentiment, priority := AnalyzeInquiry(m)
		targetTable := "hire_developer_requests"
		if t == "expert" {
			targetTable = "expert_help_requests"
		}
		config.DB.Table(targetTable).Where("id = ?", i).Updates(map[string]interface{}{
			"sentiment": sentiment,
			"priority":  priority,
		})
	}(table, id, msg)
}

func AdminListInquiries(c *gin.Context) {
	// For admin, we might want to list both. Combined view or separate?
	// The user asked for "Verify database tables actually exist: ... hire_developer_requests ... expert_help_requests"
	// I'll provide separate list endpoints or one that combines them.
	
	var hireReqs []models.HireDeveloperRequest
	var expertReqs []models.ExpertHelpRequest
	
	config.DB.Preload("ServiceIntent").Find(&hireReqs)
	config.DB.Preload("ExpertIntent").Find(&expertReqs)
	
	c.JSON(http.StatusOK, gin.H{
		"hireRequests": hireReqs,
		"expertRequests": expertReqs,
	})
}
func MyInquiries(c *gin.Context) {
	user, _ := c.Get("user")
	currUser := user.(models.User)

	var hireReqs []models.HireDeveloperRequest
	var expertReqs []models.ExpertHelpRequest

	config.DB.Where("user_id = ?", currUser.ID).Preload("ServiceIntent").Find(&hireReqs)
	config.DB.Where("user_id = ?", currUser.ID).Preload("ExpertIntent").Find(&expertReqs)

	c.JSON(http.StatusOK, gin.H{
		"hireRequests":   hireReqs,
		"expertRequests": expertReqs,
	})
}

func UserReplyToInquiry(c *gin.Context) {
	id := c.Param("id")
	user, _ := c.Get("user")
	currUser := user.(models.User)

	var body struct {
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Try Expert Help Request First
	var expertReq models.ExpertHelpRequest
	if err := config.DB.Where("id = ? AND user_id = ?", id, currUser.ID).First(&expertReq).Error; err == nil {
		expertReq.Message += "\n\nUser Update: " + body.Message
		expertReq.Status = "pending" // reset if it was replied?
		config.DB.Save(&expertReq)
		c.JSON(http.StatusOK, gin.H{"message": "Expert request updated"})
		return
	}

	// Try Hire Developer Request
	var hireReq models.HireDeveloperRequest
	if err := config.DB.Where("id = ? AND user_id = ?", id, currUser.ID).First(&hireReq).Error; err == nil {
		hireReq.Message += "\n\nUser Update: " + body.Message
		hireReq.Status = "pending"
		config.DB.Save(&hireReq)
		c.JSON(http.StatusOK, gin.H{"message": "Hire request updated"})
		return
	}

	respondError(c, http.StatusNotFound, "Inquiry not found or access denied")
}

func AdminReplyToInquiry(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Reply string `json:"reply" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Try Expert Help Request First
	var expertReq models.ExpertHelpRequest
	if err := config.DB.First(&expertReq, id).Error; err == nil {
		expertReq.Reply = body.Reply
		expertReq.Status = "replied"
		config.DB.Save(&expertReq)

		// Async Email Notification
		go func(email, subject, reply string) {
			_ = services.Mailer.SendSupportReply(email, subject, reply)
		}(expertReq.Email, expertReq.Subject, body.Reply)

		c.JSON(http.StatusOK, gin.H{"message": "Expert request replied"})
		return
	}

	// Try Hire Developer Request
	var hireReq models.HireDeveloperRequest
	if err := config.DB.First(&hireReq, id).Error; err == nil {
		hireReq.Reply = body.Reply
		hireReq.Status = "replied"
		config.DB.Save(&hireReq)

		// Async Email Notification
		go func(email, subject, reply string) {
			_ = services.Mailer.SendSupportReply(email, subject, reply)
		}(hireReq.Email, hireReq.Subject, body.Reply)

		c.JSON(http.StatusOK, gin.H{"message": "Hire request replied"})
		return
	}

	respondError(c, http.StatusNotFound, "Inquiry not found")
}
