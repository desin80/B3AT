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
