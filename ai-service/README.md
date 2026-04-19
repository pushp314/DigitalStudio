# DigitalStudio AI Microservice

This service acts as a streaming, stateful middleware between the DigitalStudio marketplace and the Ollama AI engine. It provides documentation summaries and context-aware Q&A.

## 🚀 Prerequisites

1. **Install Ollama**: Download from [ollama.com](https://ollama.com).
2. **Pull the Model**:
   ```bash
   ollama pull qwen3.5:2b
   ```
   *(Note: You can change the model in the `.env` file.)*

## 🛠️ Setup

1. **Configure Environment**:
   Ensure `.env` exists in this directory:
   ```env
   PORT=8081
   OLLAMA_URL=http://localhost:11434/api/generate
   OLLAMA_MODEL=qwen3.5:2b
   ```

2. **Install Dependencies** (None required, uses standard Go library):
   ```bash
   go mod tidy
   ```

## 🏃 Running the Service

Execute the following command in this directory:

```bash
go run main.go
```

The service will start on `http://localhost:8081`.

## 🧪 Verification

Test the health endpoint:
```bash
curl http://localhost:8081/healthz
```

Test a streaming prompt:
```bash
curl -X POST http://localhost:8081/ai/prompt \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello", "conversationId": "test_123"}'
```

## 🧠 Features Supported
- **Streaming**: Responses are returned token-by-token.
- **Memory**: Pass a `conversationId` to maintain context across questions.
- **Compatibility**: Standard OpenAI-like prompt format proxying to Ollama.
