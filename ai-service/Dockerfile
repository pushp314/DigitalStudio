FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download || true

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o ai-service main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/ai-service .
EXPOSE 8081
CMD ["./ai-service"]
