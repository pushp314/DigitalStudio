package services

import (
	"github.com/pushp314/bizcode/go-server/models"
)

// XP Constants
const (
	XPMsgSent     = 10
	XPPurchase    = 500
	XPReviewAdded = 100
	XPDeployment  = 1000 // Huge reward for actual deployment
)

const (
	RankJunior    = "Junior"
	RankScripter  = "Scripter"
	RankEngineer  = "Engineer"
	RankArchitect = "Architect"
	RankElite     = "Elite"
)

// CalculateRank determines the user's community tier based on total XP
func CalculateRank(xp int) string {
	switch {
	case xp >= 50000:
		return RankElite
	case xp >= 15000:
		return RankArchitect
	case xp >= 5000:
		return RankEngineer
	case xp >= 1000:
		return RankScripter
	default:
		return RankJunior
	}
}

// AwardXP adds experience points to a user and updates their rank if necessary
func AwardXP(user *models.User, amount int) bool {
	user.XP += amount
	newRank := CalculateRank(user.XP)
	rankChanged := newRank != user.Rank
	user.Rank = newRank
	return rankChanged
}
