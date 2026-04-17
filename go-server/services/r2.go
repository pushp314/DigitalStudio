package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
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
	bucket := os.Getenv("R2_BUCKET_NAME")
	filename := uuid.New().String() + "-" + header.Filename

	_, err := S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(filename),
		Body:   file,
	})
	if err != nil {
		return "", err
	}

	publicURL := os.Getenv("R2_PUBLIC_URL")
	if publicURL != "" {
		return fmt.Sprintf("%s/%s", publicURL, filename), nil
	}

	accountID := os.Getenv("R2_ACCOUNT_ID")
	return fmt.Sprintf("https://%s.r2.cloudflarestorage.com/%s/%s", accountID, bucket, filename), nil
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
		Bucket: aws.String(bucket),
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
