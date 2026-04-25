package services

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	appConfig "github.com/pushp314/bizcode/go-server/config"
)

type StorageService interface {
	GenerateSignedDownloadURL(ctx context.Context, key string, expires time.Duration) (string, error)
	UploadFile(ctx context.Context, key string, body io.Reader, contentType string) error
	HealthCheck(ctx context.Context) error
	GetBaseURL() string
}

type r2Storage struct {
	client       *s3.Client
	presignClient *s3.PresignClient
	bucket       string
	endpoint     string
}

func NewR2Storage(cfg appConfig.Config) (StorageService, error) {
	if cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" {
		return nil, fmt.Errorf("R2 credentials missing")
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: cfg.R2Endpoint,
		}, nil
	})

	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.R2AccessKeyID, cfg.R2SecretAccessKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg)
	return &r2Storage{
		client:       client,
		presignClient: s3.NewPresignClient(client),
		bucket:       cfg.R2Bucket,
		endpoint:     cfg.R2Endpoint,
	}, nil
}

func (s *r2Storage) GenerateSignedDownloadURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	presignedURL, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expires))
	if err != nil {
		return "", err
	}
	return presignedURL.URL, nil
}

func (s *r2Storage) UploadFile(ctx context.Context, key string, body io.Reader, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	return err
}

func (s *r2Storage) HealthCheck(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})
	return err
}

func (s *r2Storage) GetBaseURL() string {
	return s.endpoint
}

type localStorage struct{}

func (s *localStorage) GenerateSignedDownloadURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	// Fallback to direct URL or local proxy for development
	return fmt.Sprintf("/api/storage/local/%s", key), nil
}

func (s *localStorage) UploadFile(ctx context.Context, key string, body io.Reader, contentType string) error {
	// Local storage upload logic could go here, or just return nil for dev
	return nil
}

func (s *localStorage) HealthCheck(ctx context.Context) error {
	return nil
}

func (s *localStorage) GetBaseURL() string {
	return ""
}

var Storage StorageService

func InitStorage() error {
	if appConfig.AppConfig.StorageProvider == "r2" {
		var err error
		Storage, err = NewR2Storage(appConfig.AppConfig)
		return err
	}
	Storage = &localStorage{}
	return nil
}

// InitR2 is kept for backward compatibility with main.go if needed, but InitStorage is preferred.
func InitR2() error {
	return InitStorage()
}
