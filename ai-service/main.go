package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type PromptRequest struct {
	Prompt string `json:"prompt"`
}

type PromptResponse struct {
	Answer string `json:"answer"`
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type OllamaResponse struct {
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

func handlePrompt(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var pReq PromptRequest
	if err := json.NewDecoder(r.Body).Decode(&pReq); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	ollamaURL := envOrDefault("OLLAMA_URL", "http://localhost:11434/api/generate")
	reqBody, _ := json.Marshal(OllamaRequest{
		Model:  "qwen3.5:2b",
		Prompt: pReq.Prompt,
	})

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Post(ollamaURL, "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		http.Error(w, fmt.Sprintf("Upstream failure: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("Upstream returned status: %d", resp.StatusCode), http.StatusInternalServerError)
		return
	}

	var answerBuilder strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		var oResp OllamaResponse
		if err := json.Unmarshal(line, &oResp); err == nil {
			answerBuilder.WriteString(oResp.Response)
			if oResp.Done {
				break
			}
		}
	}

	if err := scanner.Err(); err != nil {
		http.Error(w, "Error reading upstream response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(PromptResponse{Answer: answerBuilder.String()})
}

func handleHealthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	http.HandleFunc("/healthz", handleHealthz)
	http.HandleFunc("/ai/prompt", handlePrompt)
	port := envOrDefault("PORT", "8081")
	log.Printf("AI Service running on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
