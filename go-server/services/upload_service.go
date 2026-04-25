package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

type UploadScope string

const (
	UploadScopePublicImage  UploadScope = "public_image"
	UploadScopePrivateAsset UploadScope = "private_asset"
)

type UploadResult struct {
	FilePath    string `json:"filePath"`
	StorageKey  string `json:"storageKey"`
	Scope       string `json:"scope"`
	ContentType string `json:"contentType"`
	Size        int64  `json:"size"`
}

type uploadPolicy struct {
	maxSizeBytes int64
	extensions   map[string]struct{}
	mimeTypes    map[string]struct{}
}

var safeFilenamePattern = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

func UploadValidatedFile(ctx context.Context, file multipart.File, header *multipart.FileHeader, scope UploadScope) (*UploadResult, error) {
	if Storage == nil {
		return nil, errors.New("storage service not initialized")
	}
	if header == nil {
		return nil, errors.New("file header is required")
	}

	policy, err := uploadPolicyForScope(scope)
	if err != nil {
		return nil, err
	}
	fileSize, err := detectFileSize(file, header)
	if err != nil {
		return nil, err
	}
	if fileSize > 0 && fileSize > policy.maxSizeBytes {
		return nil, fmt.Errorf("file exceeds size limit of %d bytes", policy.maxSizeBytes)
	}

	contentType, err := detectContentType(file)
	if err != nil {
		return nil, err
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if _, ok := policy.extensions[ext]; !ok {
		return nil, fmt.Errorf("file extension %s is not allowed for scope %s", ext, scope)
	}
	if !mimeAllowed(contentType, policy.mimeTypes) {
		return nil, fmt.Errorf("content type %s is not allowed for scope %s", contentType, scope)
	}

	storageKey := buildStorageKey(scope, header.Filename)
	err = Storage.UploadFile(ctx, storageKey, file, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload asset to storage: %w", err)
	}

	result := &UploadResult{
		FilePath:    storageKey,
		StorageKey:  storageKey,
		Scope:       string(scope),
		ContentType: contentType,
		Size:        fileSize,
	}

	if scope == UploadScopePublicImage {
		if publicURL := strings.TrimRight(strings.TrimSpace(getEnv("R2_PUBLIC_URL")), "/"); publicURL != "" {
			result.FilePath = publicURL + "/" + storageKey
		}
	}

	return result, nil
}

func StorageKeyFromURL(filePath string) (string, bool) {
	trimmed := strings.TrimSpace(filePath)
	if trimmed == "" {
		return "", false
	}

	publicURL := strings.TrimRight(strings.TrimSpace(getEnv("R2_PUBLIC_URL")), "/")
	if publicURL != "" && strings.HasPrefix(trimmed, publicURL+"/") {
		return strings.TrimPrefix(trimmed, publicURL+"/"), true
	}

	if strings.HasPrefix(trimmed, "private/") || strings.HasPrefix(trimmed, "public/") {
		return trimmed, true
	}

	return "", false
}

func IsManagedPrivateAssetKey(key string) bool {
	return strings.HasPrefix(strings.TrimSpace(key), "private/")
}

func buildStorageKey(scope UploadScope, originalFilename string) string {
	now := time.Now().UTC()
	ext := strings.ToLower(filepath.Ext(originalFilename))
	baseName := strings.TrimSuffix(filepath.Base(originalFilename), ext)
	baseName = strings.Trim(baseName, ".-_ ")
	baseName = safeFilenamePattern.ReplaceAllString(baseName, "-")
	baseName = strings.Trim(baseName, "-")
	if baseName == "" {
		baseName = "asset"
	}

	prefix := "public/images"
	if scope == UploadScopePrivateAsset {
		prefix = "private/assets"
	}

	return fmt.Sprintf("%s/%04d/%02d/%s-%s%s", prefix, now.Year(), now.Month(), uuid.NewString(), baseName, ext)
}

func detectContentType(file multipart.File) (string, error) {
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, http.ErrBodyReadAfterClose) {
		if seeker, ok := file.(interface {
			Seek(int64, int) (int64, error)
		}); ok {
			_, _ = seeker.Seek(0, 0)
		}
		if n == 0 {
			return "", err
		}
	}

	if seeker, ok := file.(interface {
		Seek(int64, int) (int64, error)
	}); ok {
		if _, seekErr := seeker.Seek(0, 0); seekErr != nil {
			return "", seekErr
		}
	}

	return http.DetectContentType(buffer[:n]), nil
}

func detectFileSize(file multipart.File, header *multipart.FileHeader) (int64, error) {
	if header != nil && header.Size > 0 {
		return header.Size, nil
	}

	seeker, ok := file.(interface{ Seek(int64, int) (int64, error) })
	if !ok {
		return 0, nil
	}

	size, err := seeker.Seek(0, io.SeekEnd)
	if err != nil {
		return 0, err
	}
	if _, err := seeker.Seek(0, io.SeekStart); err != nil {
		return 0, err
	}

	return size, nil
}

func mimeAllowed(contentType string, allowed map[string]struct{}) bool {
	contentType = strings.ToLower(strings.TrimSpace(contentType))
	if _, ok := allowed[contentType]; ok {
		return true
	}
	if strings.HasPrefix(contentType, "image/jpeg") {
		_, ok := allowed["image/jpeg"]
		return ok
	}
	return false
}

func uploadPolicyForScope(scope UploadScope) (*uploadPolicy, error) {
	switch scope {
	case "", UploadScopePublicImage:
		return &uploadPolicy{
			maxSizeBytes: 10 << 20,
			extensions: map[string]struct{}{
				".jpg":  {},
				".jpeg": {},
				".png":  {},
				".webp": {},
			},
			mimeTypes: map[string]struct{}{
				"image/jpeg": {},
				"image/png":  {},
				"image/webp": {},
			},
		}, nil
	case UploadScopePrivateAsset:
		return &uploadPolicy{
			maxSizeBytes: 1024 << 20, // 1GB
			extensions: map[string]struct{}{
				".zip":  {},
				".rar":  {},
				".pdf":  {},
				".mp4":  {},
				".mov":  {},
				".avi":  {},
				".mkv":  {},
				".dmg":  {},
				".exe":  {},
				".iso":  {},
			},
			mimeTypes: map[string]struct{}{
				"application/zip":              {},
				"application/x-zip-compressed": {},
				"application/x-rar-compressed": {},
				"application/pdf":              {},
				"video/mp4":                    {},
				"video/quicktime":              {},
				"video/x-msvideo":              {},
				"video/x-matroska":             {},
				"application/x-apple-diskimage": {},
				"application/x-msdownload":      {},
				"application/x-iso9660-image":  {},
			},
		}, nil
	default:
		return nil, fmt.Errorf("unsupported upload scope: %s", scope)
	}
}

func getEnv(key string) string {
	return strings.TrimSpace(os.Getenv(key))
}
