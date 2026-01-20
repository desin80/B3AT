package main

import (
	"flag"
	"fmt"
	"log"
	"time"

	"server/internal/config"
	"server/internal/database"
	"server/internal/models"
	"server/internal/repository"
	"server/internal/utils"
)

func main() {
	server := flag.String("server", "global", "server name (e.g. global)")
	season := flag.Int("season", 9, "season number")
	tag := flag.String("tag", "seed", "tag value")
	flag.Parse()

	config.LoadConfig()
	database.InitDB()

	repo := repository.NewStatsRepository(database.DB)

	atkTeam := []int{10000, 10001, 10002, 10003, 20000, 20001}
	defTeam := []int{10010, 10011, 10012, 10013, 20010, 20011}

	makeUniformLoadout := func(team []int, star, weaponStar, level, ex, ns, ps, ss int, eq [3]int, gear int, pot map[int]int) []models.LoadoutEntry {
		out := make([]models.LoadoutEntry, 0, len(team))
		for _, id := range team {
			out = append(out, models.LoadoutEntry{
				ID:                    id,
				Star:                  star,
				WeaponStar:            weaponStar,
				Level:                 level,
				ExSkillLevel:          ex,
				PublicSkillLevel:      ns,
				PassiveSkillLevel:     ps,
				ExtraPassiveSkillLevel: ss,
				EquipmentTiers:        []int{eq[0], eq[1], eq[2]},
				GearTier:              gear,
				PotentialStats:        pot,
			})
		}
		return out
	}

	now := time.Now().Unix()

	type detailSeed struct {
		name      string
		wins      int
		losses    int
		timestamp int64
		atk       []models.LoadoutEntry
		def       []models.LoadoutEntry
	}

	seeds := []detailSeed{
		{
			name:      "low",
			wins:      10,
			losses:    5,
			timestamp: now - 3600,
			atk:       makeUniformLoadout(atkTeam, 3, 1, 60, 3, 4, 4, 4, [3]int{6, 6, 6}, 0, nil),
			def:       makeUniformLoadout(defTeam, 3, 1, 60, 3, 4, 4, 4, [3]int{6, 6, 6}, 0, nil),
		},
		{
			name:      "mid",
			wins:      50,
			losses:    30,
			timestamp: now - 900,
			atk:       makeUniformLoadout(atkTeam, 5, 3, 80, 4, 7, 7, 7, [3]int{9, 9, 9}, 1, map[int]int{1: 10, 2: 10, 3: 10}),
			def:       makeUniformLoadout(defTeam, 5, 3, 80, 4, 7, 7, 7, [3]int{9, 9, 9}, 1, map[int]int{1: 10, 2: 10, 3: 10}),
		},
		{
			name:      "high",
			wins:      200,
			losses:    50,
			timestamp: now,
			atk:       makeUniformLoadout(atkTeam, 5, 4, 90, 5, 10, 10, 10, [3]int{10, 10, 10}, 2, map[int]int{1: 25, 2: 25, 3: 25}),
			def:       makeUniformLoadout(defTeam, 5, 4, 90, 5, 10, 10, 10, [3]int{10, 10, 10}, 2, map[int]int{1: 25, 2: 25, 3: 25}),
		},
	}

	var statUpdates []models.StatsUpdateDTO
	var detailUpdates []models.StatsDetailUpdateDTO

	for _, s := range seeds {
		statUpdates = append(statUpdates, models.StatsUpdateDTO{
			Server:      *server,
			Season:      *season,
			Tag:         *tag,
			AtkTeam:     atkTeam,
			DefTeam:     defTeam,
			WinsDelta:   s.wins,
			LossesDelta: s.losses,
			Timestamp:   s.timestamp,
		})

		detailUpdates = append(detailUpdates, models.StatsDetailUpdateDTO{
			Server:      *server,
			Season:      *season,
			Tag:         *tag,
			AtkTeam:     atkTeam,
			DefTeam:     defTeam,
			AtkLoadout:  s.atk,
			DefLoadout:  s.def,
			WinsDelta:   s.wins,
			LossesDelta: s.losses,
			Timestamp:   s.timestamp,
		})
	}

	if _, err := repo.BatchUpsertStats(statUpdates); err != nil {
		log.Fatalf("seed: upsert stats failed: %v", err)
	}
	if _, err := repo.BatchUpsertDetails(detailUpdates); err != nil {
		log.Fatalf("seed: upsert details failed: %v", err)
	}

	// Helpful output so you can find it quickly in the UI / API.
	_, atkSig := utils.NormalizeTeam(atkTeam)
	_, defSig := utils.NormalizeTeam(defTeam)
	fmt.Printf("Seeded details: server=%s season=%d tag=%q atk_sig=%q def_sig=%q (%d detail rows)\n", *server, *season, *tag, atkSig, defSig, len(seeds))
}
