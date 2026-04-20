package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type GithubStats struct {
	Commits     int      `json:"commits"`
	Repos       int      `json:"repos"`
	Stars       int      `json:"stars"`
	Followers   int      `json:"followers"`
	Following   int      `json:"following"`
	Gists       int      `json:"gists"`
	AccountAge  int      `json:"accountAge"` // in days
	Languages   []string `json:"languages"`
}

// FetchGithubStats retrieves public developer metrics from the GitHub API
func FetchGithubStats(githubURL string) (*GithubStats, error) {
	if githubURL == "" {
		return nil, fmt.Errorf("no github url provided")
	}

	// Extract username from URL (e.g. https://github.com/saurabh -> saurabh)
	// For now, a simple parser
	var username string
	fmt.Sscanf(githubURL, "https://github.com/%s", &username)
	if username == "" {
		// Try without protocol
		fmt.Sscanf(githubURL, "github.com/%s", &username)
	}
	if username == "" {
		username = githubURL // Fallback if they just put the username
	}

	client := &http.Client{Timeout: 10 * time.Second}
	
	// Get User Info
	resp, err := client.Get(fmt.Sprintf("https://api.github.com/users/%s", username))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api error: %d", resp.StatusCode)
	}

	var userResult struct {
		PublicRepos int    `json:"public_repos"`
		PublicGists int    `json:"public_gists"`
		Followers   int    `json:"followers"`
		Following   int    `json:"following"`
		CreatedAt   string `json:"created_at"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userResult); err != nil {
		return nil, err
	}

	// Calculate Account Age
	createdAt, _ := time.Parse(time.RFC3339, userResult.CreatedAt)
	daysOld := int(time.Since(createdAt).Hours() / 24)

	// Get Repos for Stars & Languages
	respRepos, err := client.Get(fmt.Sprintf("https://api.github.com/users/%s/repos?per_page=100&sort=updated", username))
	if err == nil {
		defer respRepos.Body.Close()
		var repos []struct {
			StargazersCount int    `json:"stargazers_count"`
			Language        string `json:"language"`
		}
		json.NewDecoder(respRepos.Body).Decode(&repos)
		
		totalStars := 0
		langMap := make(map[string]bool)
		for _, r := range repos {
			totalStars += r.StargazersCount
			if r.Language != "" {
				langMap[r.Language] = true
			}
		}

		languages := make([]string, 0, len(langMap))
		for l := range langMap {
			languages = append(languages, l)
		}

		return &GithubStats{
			Repos:      userResult.PublicRepos,
			Gists:      userResult.PublicGists,
			Followers:  userResult.Followers,
			Following:  userResult.Following,
			Stars:      totalStars,
			AccountAge: daysOld,
			Languages:  languages,
			Commits:    -1, 
		}, nil
	}

	return &GithubStats{
		Repos:     userResult.PublicRepos,
		Gists:     userResult.PublicGists,
		Followers: userResult.Followers,
		Following: userResult.Following,
		AccountAge: daysOld,
		Commits:   -1,
	}, nil
}
