package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pushp314/digitalstudio/go-server/config"
	"github.com/pushp314/digitalstudio/go-server/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

func getGoogleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"},
		Endpoint:     google.Endpoint,
	}
}

func getGithubOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GITHUB_REDIRECT_URL"),
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}
}

func GoogleLogin(c *gin.Context) {
	state := uuid.New().String()
	session := sessions.Default(c)
	session.Set("oauthState", state)
	session.Save()
	url := getGoogleOAuthConfig().AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
	session := sessions.Default(c)
	expectedState := session.Get("oauthState")
	if expectedState != c.Query("state") {
		respondError(c, http.StatusBadRequest, "Invalid state")
		return
	}
	session.Delete("oauthState")
	_ = session.Save()

	code := c.Query("code")
	token, err := getGoogleOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to exchange token")
		return
	}

	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get user info")
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	json.NewDecoder(resp.Body).Decode(&userInfo)

	handleOAuthUser(c, "google", userInfo.ID, userInfo.Name, userInfo.Email)
}

func GithubLogin(c *gin.Context) {
	state := uuid.New().String()
	session := sessions.Default(c)
	session.Set("oauthState", state)
	session.Save()
	url := getGithubOAuthConfig().AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GithubCallback(c *gin.Context) {
	session := sessions.Default(c)
	expectedState := session.Get("oauthState")
	stateReceived := c.Query("state")
	
	if expectedState != stateReceived {
		respondError(c, http.StatusBadRequest, "Invalid state")
		return
	}
	
	// Determine if this is a connect request
	isConnect := session.Get("oauthMode") == "connect"
	connectedUID := session.Get("oauthUID")
	
	session.Delete("oauthState")
	session.Delete("oauthMode")
	session.Delete("oauthUID")
	_ = session.Save()

	code := c.Query("code")
	token, err := getGithubOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to exchange token")
		return
	}

	client := getGithubOAuthConfig().Client(context.Background(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to get user info")
		return
	}
	defer resp.Body.Close()

	var ghUser struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Repos     int    `json:"public_repos"`
		Followers int    `json:"followers"`
		Gists     int    `json:"public_gists"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&ghUser); err != nil {
		respondError(c, http.StatusInternalServerError, "Failed to decode user info")
		return
	}

	ghIDStr := fmt.Sprintf("%d", ghUser.ID)

	if isConnect && connectedUID != nil {
		uid := connectedUID.(uint)
		var user models.User
		if err := config.DB.First(&user, uid).Error; err != nil {
			respondError(c, http.StatusNotFound, "User not found")
			return
		}

		// Identity Lock Check: If user already has a DIFFERENT GitHub ID linked, block it
		if user.GithubID != "" && user.GithubID != ghIDStr {
			frontendURL := os.Getenv("FRONTEND_URL")
			if frontendURL == "" {
				frontendURL = "http://localhost:5173"
			}
			c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/account?tab=settings&github=error_mismatch")
			return
		}

		// Duplicate account check: if this GitHub ID is already linked to another DigitalStudio account.
		var existingUser models.User
		if err := config.DB.Where("github_id = ? AND id != ?", ghIDStr, user.ID).First(&existingUser).Error; err == nil {
			frontendURL := os.Getenv("FRONTEND_URL")
			if frontendURL == "" {
				frontendURL = "http://localhost:5173"
			}
			c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/account?tab=settings&github=error_duplicate")
			return
		}
		
		user.Github = ghUser.Login
		user.GithubID = ghIDStr
		user.TotalFollowers = ghUser.Followers
		user.TotalGists = ghUser.Gists
		
		config.DB.Save(&user)
		
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:5173"
		}
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/account?tab=settings&github=connected")
		return
	}

	if ghUser.Email == "" {
		emailResp, err := client.Get("https://api.github.com/user/emails")
		if err == nil {
			var emails []struct {
				Email   string `json:"email"`
				Primary bool   `json:"primary"`
			}
			json.NewDecoder(emailResp.Body).Decode(&emails)
			emailResp.Body.Close()
			for _, e := range emails {
				if e.Primary {
					ghUser.Email = e.Email
					break
				}
			}
		}
	}

	handleOAuthUser(c, "github", fmt.Sprintf("%d", ghUser.ID), ghUser.Name, ghUser.Email)
}

func GithubConnect(c *gin.Context) {
	// Identify user from context (AuthMiddleware should have run)
	val, exists := c.Get("userID")
	if !exists {
		respondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}
	uid := val.(uint)

	state := uuid.New().String()
	session := sessions.Default(c)
	session.Set("oauthState", state)
	session.Set("oauthMode", "connect")
	session.Set("oauthUID", uid)
	session.Save()
	
	url := getGithubOAuthConfig().AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func handleOAuthUser(c *gin.Context, provider, providerID, name, email string) {
	var user models.User
	result := config.DB.Where("provider = ? AND provider_id = ?", provider, providerID).First(&user)

	if result.Error != nil {
		if email != "" {
			config.DB.Where("email = ?", email).First(&user)
		}

		if user.ID == 0 {
			user = models.User{
				Name:             name,
				Email:            email,
				Password:         uuid.New().String(),
				Role:             models.RoleUser,
				SubscriptionPlan: "free",
				Provider:         provider,
				ProviderID:       providerID,
			}
			config.DB.Create(&user)
		} else {
			user.Provider = provider
			user.ProviderID = providerID
			config.DB.Save(&user)
		}
	}
	if user.Suspended {
		respondError(c, http.StatusForbidden, "Account suspended")
		return
	}

	redirectOAuthSuccess(c, user)
}
