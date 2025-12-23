package utils

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"strings"

	"server/internal/models"
)

// NormalizeLoadout aligns loadout data with a normalized team list.
// If a student is missing from the provided loadout, zeroed fields are used.
func NormalizeLoadout(team []int, loadout []models.LoadoutEntry) []models.LoadoutEntry {
	if len(team) == 0 {
		return []models.LoadoutEntry{}
	}

	lookup := make(map[int]models.LoadoutEntry)
	for _, entry := range loadout {
		lookup[entry.ID] = entry
	}

	result := make([]models.LoadoutEntry, len(team))
	for i, id := range team {
		if entry, ok := lookup[id]; ok {
			result[i] = entry
		} else {
			result[i] = models.LoadoutEntry{ID: id, Star: 0, WeaponStar: 0}
		}
	}
	return result
}

// BuildLoadoutHash turns loadout arrays into a deterministic hash string.
// This stays stable even if fields expand, thanks to a SHA1 suffix.
func BuildLoadoutHash(atk []models.LoadoutEntry, def []models.LoadoutEntry) string {
	var atkParts []string
	for _, l := range atk {
		atkParts = append(atkParts, fmt.Sprintf("%d-%d-%d", l.ID, l.Star, l.WeaponStar))
	}

	var defParts []string
	for _, l := range def {
		defParts = append(defParts, fmt.Sprintf("%d-%d-%d", l.ID, l.Star, l.WeaponStar))
	}

	raw := fmt.Sprintf("%s||%s", strings.Join(atkParts, "|"), strings.Join(defParts, "|"))

	hasher := sha1.New()
	hasher.Write([]byte(raw))
	return fmt.Sprintf("%s::%s", raw, hex.EncodeToString(hasher.Sum(nil))[:8])
}
