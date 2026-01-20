package utils

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"sort"
	"strconv"
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

func normalizeEquipmentTiers(tiers []int) [3]int {
	var out [3]int
	for i := 0; i < 3 && i < len(tiers); i++ {
		out[i] = tiers[i]
	}
	return out
}

func normalizePotentialStats(stats map[int]int) [3]int {
	var out [3]int
	if stats == nil {
		return out
	}
	out[0] = stats[1]
	out[1] = stats[2]
	out[2] = stats[3]
	return out
}

func loadoutEntrySignature(l models.LoadoutEntry) string {
	eq := normalizeEquipmentTiers(l.EquipmentTiers)
	pot := normalizePotentialStats(l.PotentialStats)

	parts := []string{
		strconv.Itoa(l.ID),
		strconv.Itoa(l.Star),
		strconv.Itoa(l.WeaponStar),
		strconv.Itoa(l.Level),
		strconv.Itoa(l.ExSkillLevel),
		strconv.Itoa(l.PublicSkillLevel),
		strconv.Itoa(l.PassiveSkillLevel),
		strconv.Itoa(l.ExtraPassiveSkillLevel),
		fmt.Sprintf("eq=%d,%d,%d", eq[0], eq[1], eq[2]),
		fmt.Sprintf("gear=%d", l.GearTier),
		fmt.Sprintf("pot=%d,%d,%d", pot[0], pot[1], pot[2]),
	}

	// If someone sends extra potential keys beyond 1..3, incorporate them deterministically.
	if len(l.PotentialStats) > 0 {
		var extraKeys []int
		for k := range l.PotentialStats {
			if k == 1 || k == 2 || k == 3 {
				continue
			}
			extraKeys = append(extraKeys, k)
		}
		if len(extraKeys) > 0 {
			sort.Ints(extraKeys)
			var extras []string
			for _, k := range extraKeys {
				extras = append(extras, fmt.Sprintf("%d=%d", k, l.PotentialStats[k]))
			}
			parts = append(parts, "pot_extra="+strings.Join(extras, ","))
		}
	}

	return strings.Join(parts, "-")
}

func BuildLoadoutHash(atk []models.LoadoutEntry, def []models.LoadoutEntry) string {
	var atkParts []string
	for _, l := range atk {
		atkParts = append(atkParts, loadoutEntrySignature(l))
	}

	var defParts []string
	for _, l := range def {
		defParts = append(defParts, loadoutEntrySignature(l))
	}

	raw := fmt.Sprintf("%s||%s", strings.Join(atkParts, "|"), strings.Join(defParts, "|"))

	hasher := sha1.New()
	hasher.Write([]byte(raw))
	sum := hasher.Sum(nil)              // 20 bytes
	return hex.EncodeToString(sum[:16]) // 128-bit hex
}
