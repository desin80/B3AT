package repository

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Masterminds/squirrel"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"server/internal/models"
	"server/internal/utils"
)

type StatsRepository struct {
	DB *gorm.DB
}

func NewStatsRepository(db *gorm.DB) *StatsRepository {
	return &StatsRepository{DB: db}
}

func (r *StatsRepository) BatchUpsertStats(updates []models.StatsUpdateDTO) (int64, error) {
	count := int64(0)

	err := r.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range updates {
			atkList, atkSig := utils.NormalizeTeam(item.AtkTeam)
			defList, defSig := utils.NormalizeTeam(item.DefTeam)

			totalDelta := item.WinsDelta + item.LossesDelta
			if totalDelta == 0 {
				continue
			}

			var stats models.ArenaStats

			result := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("server = ? AND season = ? AND tag = ? AND atk_team_sig = ? AND def_team_sig = ?",
					item.Server, item.Season, item.Tag, atkSig, defSig).
				First(&stats)

			exists := result.Error == nil
			if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
				return result.Error
			}

			var newTotal, newWins int
			var newLastSeen int64

			if exists {
				newTotal = stats.TotalBattles + totalDelta
				newWins = stats.TotalWins + item.WinsDelta

				if totalDelta > 0 && item.Timestamp > stats.LastSeen {
					newLastSeen = item.Timestamp
				} else {
					newLastSeen = stats.LastSeen
				}
			} else {
				newTotal = totalDelta
				newWins = item.WinsDelta
				newLastSeen = item.Timestamp
			}

			if newTotal <= 0 {
				if exists {
					if err := tx.Delete(&stats).Error; err != nil {
						return err
					}
				}
			} else {
				if newWins < 0 {
					newWins = 0
				}
				if newWins > newTotal {
					newWins = newTotal
				}

				wScore := utils.WilsonLowerBound(newWins, newTotal)
				pMean := utils.PosteriorMean(newWins, newTotal)

				stats.Server = item.Server
				stats.Season = item.Season
				stats.Tag = item.Tag
				stats.AtkTeamSig = atkSig
				stats.DefTeamSig = defSig
				stats.AtkTeamJson = models.IntArray(atkList)
				stats.DefTeamJson = models.IntArray(defList)
				stats.TotalBattles = newTotal
				stats.TotalWins = newWins
				stats.LastSeen = newLastSeen
				stats.WilsonScore = wScore
				stats.AvgWinRate = pMean

				if err := tx.Save(&stats).Error; err != nil {
					return err
				}
			}
			count++
		}
		return nil
	})

	return count, err
}

func (r *StatsRepository) BatchUpsertDetails(updates []models.StatsDetailUpdateDTO) (int64, error) {
	count := int64(0)

	err := r.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range updates {
			atkList, atkSig := utils.NormalizeTeam(item.AtkTeam)
			defList, defSig := utils.NormalizeTeam(item.DefTeam)

			normAtkLoadout := utils.NormalizeLoadout(atkList, item.AtkLoadout)
			normDefLoadout := utils.NormalizeLoadout(defList, item.DefLoadout)
			loadoutHash := utils.BuildLoadoutHash(normAtkLoadout, normDefLoadout)

			totalDelta := item.WinsDelta + item.LossesDelta
			if totalDelta == 0 {
				continue
			}

			var detail models.ArenaStatsDetail

			result := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("server = ? AND season = ? AND tag = ? AND atk_team_sig = ? AND def_team_sig = ? AND loadout_hash = ?",
					item.Server, item.Season, item.Tag, atkSig, defSig, loadoutHash).
				First(&detail)

			exists := result.Error == nil
			if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
				return result.Error
			}

			var newTotal, newWins int
			var newLastSeen int64

			if exists {
				newTotal = detail.TotalBattles + totalDelta
				newWins = detail.TotalWins + item.WinsDelta

				if totalDelta > 0 && item.Timestamp > detail.LastSeen {
					newLastSeen = item.Timestamp
				} else {
					newLastSeen = detail.LastSeen
				}
			} else {
				newTotal = totalDelta
				newWins = item.WinsDelta
				newLastSeen = item.Timestamp
			}

			if newTotal <= 0 {
				if exists {
					if err := tx.Delete(&detail).Error; err != nil {
						return err
					}
				}
			} else {
				if newWins < 0 {
					newWins = 0
				}
				if newWins > newTotal {
					newWins = newTotal
				}

				wScore := utils.WilsonLowerBound(newWins, newTotal)
				pMean := utils.PosteriorMean(newWins, newTotal)

				detail.Server = item.Server
				detail.Season = item.Season
				detail.Tag = item.Tag
				detail.AtkTeamSig = atkSig
				detail.DefTeamSig = defSig
				detail.LoadoutHash = loadoutHash
				detail.AtkTeamJson = models.IntArray(atkList)
				detail.DefTeamJson = models.IntArray(defList)
				detail.AtkLoadoutJson = models.LoadoutArray(normAtkLoadout)
				detail.DefLoadoutJson = models.LoadoutArray(normDefLoadout)
				detail.TotalBattles = newTotal
				detail.TotalWins = newWins
				detail.LastSeen = newLastSeen
				detail.WilsonScore = wScore
				detail.AvgWinRate = pMean

				if err := tx.Save(&detail).Error; err != nil {
					return err
				}
			}
			count++
		}
		return nil
	})

	return count, err
}

func (r *StatsRepository) GetFilteredSummaries(q models.SummaryQueryDTO) ([]models.ArenaStats, int64, error) {
	psql := squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)

	base := psql.Select("*").From("arena_stats")
	counter := psql.Select("COUNT(*)").From("arena_stats")

	preds := squirrel.And{}
	if q.Server != "all" {
		preds = append(preds, squirrel.Eq{"server": q.Server})
	}
	if q.Season != nil {
		preds = append(preds, squirrel.Eq{"season": *q.Season})
	}
	if q.Tag != nil {
		preds = append(preds, squirrel.Eq{"tag": *q.Tag})
	}

	if len(q.AtkContains) > 0 {
		jsonBytes, _ := json.Marshal(q.AtkContains)
		preds = append(preds, squirrel.Expr("atk_team_json @> ?::jsonb", string(jsonBytes)))
	}
	if len(q.DefContains) > 0 {
		jsonBytes, _ := json.Marshal(q.DefContains)
		preds = append(preds, squirrel.Expr("def_team_json @> ?::jsonb", string(jsonBytes)))
	}

	for idx, uid := range q.AtkSlots {
		preds = append(preds, squirrel.Expr(fmt.Sprintf("(atk_team_json->>%d)::int = ?", idx), uid))
	}
	for idx, uid := range q.DefSlots {
		preds = append(preds, squirrel.Expr(fmt.Sprintf("(def_team_json->>%d)::int = ?", idx), uid))
	}

	if q.MinBattles != nil {
		preds = append(preds, squirrel.GtOrEq{"total_battles": *q.MinBattles})
	}
	if q.MinWinRate != nil {
		preds = append(preds, squirrel.Expr("(total_wins::float / NULLIF(total_battles, 0)) >= ?", *q.MinWinRate))
	}

	base = base.Where(preds)
	counter = counter.Where(preds)

	countSql, countArgs, err := counter.ToSql()
	if err != nil {
		return nil, 0, err
	}

	var total int64
	if err := r.DB.Raw(countSql, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	orderBy := "total_battles DESC"
	direction := "DESC"
	if strings.Contains(strings.ToLower(q.Sort), "asc") {
		direction = "ASC"
	}

	switch {
	case q.Sort == "newest":
		orderBy = fmt.Sprintf("last_seen %s", direction)
	case strings.Contains(q.Sort, "win_rate"):
		orderBy = fmt.Sprintf("avg_win_rate %s", direction)
	case q.Sort == "composite":
		orderBy = fmt.Sprintf("wilson_score %s", direction)
	default:
		orderBy = fmt.Sprintf("total_battles %s", direction)
	}

	base = base.OrderBy(orderBy)

	offset := (q.Page - 1) * q.Limit
	base = base.Limit(q.Limit).Offset(offset)

	sqlStr, args, err := base.ToSql()
	if err != nil {
		return nil, 0, err
	}

	var results []models.ArenaStats
	if err := r.DB.Raw(sqlStr, args...).Scan(&results).Error; err != nil {
		return nil, 0, err
	}

	return results, total, nil
}

func (r *StatsRepository) DeleteSummary(server string, season int, tag, atkSig, defSig string) (int64, error) {
	result := r.DB.Where("server = ? AND season = ? AND tag = ? AND atk_team_sig = ? AND def_team_sig = ?",
		server, season, tag, atkSig, defSig).
		Delete(&models.ArenaStats{})
	return result.RowsAffected, result.Error
}

func (r *StatsRepository) GetDetailedSummaries(q models.SummaryDetailQueryDTO) ([]models.ArenaStatsDetail, int64, error) {
	psql := squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)

	base := psql.Select("*").From("arena_stats_details")
	counter := psql.Select("COUNT(*)").From("arena_stats_details")

	preds := squirrel.And{
		squirrel.Eq{"atk_team_sig": q.AtkSig},
		squirrel.Eq{"def_team_sig": q.DefSig},
	}

	if q.Server != "all" {
		preds = append(preds, squirrel.Eq{"server": q.Server})
	}
	if q.Season != nil {
		preds = append(preds, squirrel.Eq{"season": *q.Season})
	}
	if q.Tag != nil {
		preds = append(preds, squirrel.Eq{"tag": *q.Tag})
	}

	base = base.Where(preds)
	counter = counter.Where(preds)

	countSql, countArgs, err := counter.ToSql()
	if err != nil {
		return nil, 0, err
	}

	var total int64
	if err := r.DB.Raw(countSql, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	orderBy := "total_battles DESC"
	direction := "DESC"
	if strings.Contains(strings.ToLower(q.Sort), "asc") {
		direction = "ASC"
	}

	switch {
	case q.Sort == "newest":
		orderBy = fmt.Sprintf("last_seen %s", direction)
	case strings.Contains(q.Sort, "win_rate"):
		orderBy = fmt.Sprintf("avg_win_rate %s", direction)
	case q.Sort == "composite":
		orderBy = fmt.Sprintf("wilson_score %s", direction)
	default:
		orderBy = fmt.Sprintf("total_battles %s", direction)
	}

	base = base.OrderBy(orderBy)

	offset := (q.Page - 1) * q.Limit
	base = base.Limit(q.Limit).Offset(offset)

	sqlStr, args, err := base.ToSql()
	if err != nil {
		return nil, 0, err
	}

	var results []models.ArenaStatsDetail
	if err := r.DB.Raw(sqlStr, args...).Scan(&results).Error; err != nil {
		return nil, 0, err
	}

	return results, total, nil
}

type detailKey struct {
	Server string
	Season int
	Tag    string
	AtkSig string
	DefSig string
}

func (r *StatsRepository) recalcSummaryFromDetails(tx *gorm.DB, key detailKey) error {
	var agg struct {
		Total    int64
		Wins     int64
		LastSeen int64
	}

	if err := tx.Table("arena_stats_details").
		Select("COALESCE(SUM(total_battles),0) AS total, COALESCE(SUM(total_wins),0) AS wins, COALESCE(MAX(last_seen),0) AS last_seen").
		Where("server = ? AND season = ? AND tag = ? AND atk_team_sig = ? AND def_team_sig = ?",
			key.Server, key.Season, key.Tag, key.AtkSig, key.DefSig).
		Scan(&agg).Error; err != nil {
		return err
	}

	if agg.Total == 0 {
		// No details left, remove summary if exists.
		_, err := r.DeleteSummary(key.Server, key.Season, key.Tag, key.AtkSig, key.DefSig)
		return err
	}

	// Use one remaining detail row to carry team json.
	var first models.ArenaStatsDetail
	if err := tx.Where("server = ? AND season = ? AND tag = ? AND atk_team_sig = ? AND def_team_sig = ?",
		key.Server, key.Season, key.Tag, key.AtkSig, key.DefSig).
		First(&first).Error; err != nil {
		return err
	}

	wScore := utils.WilsonLowerBound(int(agg.Wins), int(agg.Total))
	pMean := utils.PosteriorMean(int(agg.Wins), int(agg.Total))

	summary := models.ArenaStats{
		Server:        key.Server,
		Season:        key.Season,
		Tag:           key.Tag,
		AtkTeamSig:    key.AtkSig,
		DefTeamSig:    key.DefSig,
		AtkTeamJson:   models.IntArray(first.AtkTeamJson),
		DefTeamJson:   models.IntArray(first.DefTeamJson),
		TotalBattles:  int(agg.Total),
		TotalWins:     int(agg.Wins),
		LastSeen:      agg.LastSeen,
		WilsonScore:   wScore,
		AvgWinRate:    pMean,
	}

	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "server"}, {Name: "season"}, {Name: "tag"}, {Name: "atk_team_sig"}, {Name: "def_team_sig"}},
		DoUpdates: clause.AssignmentColumns([]string{"atk_team_json", "def_team_json", "total_battles", "total_wins", "last_seen", "wilson_score", "avg_win_rate"}),
	}).Create(&summary).Error
}

func (r *StatsRepository) DeleteDetailsAndRecalc(items []models.DeleteDetailModel) (int64, error) {
	var deleted int64
	err := r.DB.Transaction(func(tx *gorm.DB) error {
		keys := make(map[detailKey]struct{})
		for _, it := range items {
			res := tx.Where("server = ? AND season = ? AND tag = ? AND atk_team_sig = ? AND def_team_sig = ? AND loadout_hash = ?",
				it.Server, it.Season, it.Tag, it.AtkSig, it.DefSig, it.LoadoutHash).
				Delete(&models.ArenaStatsDetail{})
			if res.Error != nil {
				return res.Error
			}
			deleted += res.RowsAffected
			keys[detailKey{it.Server, it.Season, it.Tag, it.AtkSig, it.DefSig}] = struct{}{}
		}

		for k := range keys {
			if err := r.recalcSummaryFromDetails(tx, k); err != nil {
				return err
			}
		}
		return nil
	})
	return deleted, err
}
