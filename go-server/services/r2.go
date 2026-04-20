package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"time"
)

var S3Client *s3.Client

func InitR2() error {
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKeyID := os.Getenv("R2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("R2_SECRET_ACCESS_KEY")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return err
	}

	S3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
	})
	return nil
}

func UploadFile(file multipart.File, header *multipart.FileHeader) (string, error) {
	result, err := UploadValidatedFile(context.TODO(), file, header, UploadScopePublicImage)
	if err != nil {
		return "", err
	}
	return result.FilePath, nil
}

func CheckR2(ctx context.Context) error {
	if S3Client == nil {
		return errors.New("r2 client not initialized")
	}

	bucket := os.Getenv("R2_BUCKET_NAME")
	if bucket == "" {
		return errors.New("r2 bucket is not configured")
	}

	_, err := S3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket:              aws.String(bucket),
		ExpectedBucketOwner: nil,
	})
	if err != nil {
		var noBucket *types.NotFound
		if errors.As(err, &noBucket) {
			return errors.New("r2 bucket not found")
		}
		return err
	}

	return nil
}

func GeneratePresignedURL(key string) (string, error) {
	if S3Client == nil {
		return "", errors.New("r2 client not initialized")
	}
	key = strings.TrimSpace(key)
	if key == "" {
		return "", errors.New("storage key is required")
	}
	if !strings.HasPrefix(key, "private/") {
		return "", errors.New("presigned urls are only supported for private assets")
	}

	bucket := os.Getenv("R2_BUCKET_NAME")
	presignClient := s3.NewPresignClient(S3Client)

	// Set expiration to 15 minutes
	request, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(15*time.Minute))

	if err != nil {
		return "", err
	}

	return request.URL, nil
}
