package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

func GeneratePartnerCode(name string) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 4)
	for i := range b {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[num.Int64()]
	}
	
	prefix := "DS"
	if len(name) >= 3 {
		prefix = name[:3]
	}
	
	return fmt.Sprintf("%s-%s", prefix, string(b))
}
