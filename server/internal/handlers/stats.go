package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"server/internal/database"
	"server/internal/models"
	"server/internal/repository"
	"server/internal/utils"
)

type StatsHandler struct {
	Repo *repository.StatsRepository
}

func NewStatsHandler(db *gorm.DB) *StatsHandler {
	return &StatsHandler{
		Repo: repository.NewStatsRepository(db),
	}
}

func (h *StatsHandler) GetSummaries(c *gin.Context) {
	type ListReq struct {
		Page        uint64   `form:"page,default=1"`
		Limit       uint64   `form:"limit,default=20"`
		Server      string   `form:"server,default=global"`
		Season      *int     `form:"season"`
		Tag         *string  `form:"tag"`
		Sort        string   `form:"sort,default=default"`
		MinWinRate  *float64 `form:"min_win_rate"`
		MinBattles  *int     `form:"min_battles"`
		AtkContains string   `form:"atk_contains"`
		DefContains string   `form:"def_contains"`
		AtkSlots    string   `form:"atk_slots"`
		DefSlots    string   `form:"def_slots"`
	}

	var req ListReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters: " + err.Error()})
		return
	}

	query := models.SummaryQueryDTO{
		Page:        req.Page,
		Limit:       req.Limit,
		Server:      req.Server,
		Season:      req.Season,
		Tag:         req.Tag,
		Sort:        req.Sort,
		MinWinRate:  req.MinWinRate,
		MinBattles:  req.MinBattles,
		AtkContains: utils.ParseIDList(req.AtkContains),
		DefContains: utils.ParseIDList(req.DefContains),
		AtkSlots:    utils.ParseSlotMap(req.AtkSlots),
		DefSlots:    utils.ParseSlotMap(req.DefSlots),
	}

	rows, total, err := h.Repo.GetFilteredSummaries(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	respData := make([]models.SummaryResponseItem, len(rows))
	for i, row := range rows {
		wr := 0.0
		if row.TotalBattles > 0 {
			wr = float64(row.TotalWins) / float64(row.TotalBattles)
		}

		respData[i] = models.SummaryResponseItem{
			Server:        row.Server,
			Season:        row.Season,
			Tag:           row.Tag,
			AttackingTeam: []int(row.AtkTeamJson),
			DefendingTeam: []int(row.DefTeamJson),
			Total:         row.TotalBattles,
			Wins:          row.TotalWins,
			Losses:        row.TotalBattles - row.TotalWins,
			WinRate:       wr,
			WilsonScore:   row.WilsonScore,
			AvgWinRate:    row.AvgWinRate,
			LastSeen:      row.LastSeen,
			AtkSig:        row.AtkTeamSig,
			DefSig:        row.DefTeamSig,
		}
	}

	totalPages := int64(0)
	if req.Limit > 0 {
		totalPages = (total + int64(req.Limit) - 1) / int64(req.Limit)
	}

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       respData,
		Total:      total,
		Page:       req.Page,
		TotalPages: totalPages,
	})
}

func (h *StatsHandler) GetSummaryDetails(c *gin.Context) {
	type DetailReq struct {
		Page   uint64  `form:"page,default=1"`
		Limit  uint64  `form:"limit,default=20"`
		Server string  `form:"server,default=global"`
		Season *int    `form:"season"`
		Tag    *string `form:"tag"`
		Sort   string  `form:"sort,default=default"`
		AtkSig string  `form:"atk_sig" binding:"required"`
		DefSig string  `form:"def_sig" binding:"required"`
	}

	var req DetailReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters: " + err.Error()})
		return
	}

	query := models.SummaryDetailQueryDTO{
		Page:   req.Page,
		Limit:  req.Limit,
		Server: req.Server,
		Season: req.Season,
		Tag:    req.Tag,
		Sort:   req.Sort,
		AtkSig: req.AtkSig,
		DefSig: req.DefSig,
	}

	rows, total, err := h.Repo.GetDetailedSummaries(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	respData := make([]models.SummaryDetailResponseItem, len(rows))
	for i, row := range rows {
		wr := 0.0
		if row.TotalBattles > 0 {
			wr = float64(row.TotalWins) / float64(row.TotalBattles)
		}

		respData[i] = models.SummaryDetailResponseItem{
			Server:        row.Server,
			Season:        row.Season,
			Tag:           row.Tag,
			AttackingTeam: []int(row.AtkTeamJson),
			DefendingTeam: []int(row.DefTeamJson),
			AtkLoadout:    []models.LoadoutEntry(row.AtkLoadoutJson),
			DefLoadout:    []models.LoadoutEntry(row.DefLoadoutJson),
			Total:         row.TotalBattles,
			Wins:          row.TotalWins,
			Losses:        row.TotalBattles - row.TotalWins,
			WinRate:       wr,
			WilsonScore:   row.WilsonScore,
			AvgWinRate:    row.AvgWinRate,
			LastSeen:      row.LastSeen,
			AtkSig:        row.AtkTeamSig,
			DefSig:        row.DefTeamSig,
			LoadoutHash:   row.LoadoutHash,
		}
	}

	totalPages := int64(0)
	if req.Limit > 0 {
		totalPages = (total + int64(req.Limit) - 1) / int64(req.Limit)
	}

	c.JSON(http.StatusOK, models.PaginatedDetailResponse{
		Data:       respData,
		Total:      total,
		Page:       req.Page,
		TotalPages: totalPages,
	})
}

func (h *StatsHandler) ManualAdd(c *gin.Context) {
	var req models.ManualAddRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON"})
		return
	}

	if req.Season < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Season must be positive"})
		return
	}
	if req.Wins < 0 || req.Losses < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Counts cannot be negative"})
		return
	}
	if req.Wins == 0 && req.Losses == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Action required"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		now := time.Now().Unix()

		sub := models.Submission{
			Server:      req.Server,
			Season:      req.Season,
			Tag:         req.Tag,
			AtkTeamJson: models.IntArray(req.AtkTeam),
			DefTeamJson: models.IntArray(req.DefTeam),
			Wins:        req.Wins,
			Losses:      req.Losses,
			Note:        "Admin Manual Entry",
			AtkLoadout:  models.LoadoutArray(req.AtkLoadout),
			DefLoadout:  models.LoadoutArray(req.DefLoadout),
			Status:      "approved",
			CreatedAt:   now,
		}
		if err := tx.Create(&sub).Error; err != nil {
			return err
		}

		txRepo := repository.NewStatsRepository(tx)

		updateItem := models.StatsUpdateDTO{
			Server:      req.Server,
			Season:      req.Season,
			Tag:         req.Tag,
			AtkTeam:     req.AtkTeam,
			DefTeam:     req.DefTeam,
			WinsDelta:   req.Wins,
			LossesDelta: req.Losses,
			Timestamp:   now,
		}

		detailUpdate := models.StatsDetailUpdateDTO{
			Server:      req.Server,
			Season:      req.Season,
			Tag:         req.Tag,
			AtkTeam:     req.AtkTeam,
			DefTeam:     req.DefTeam,
			AtkLoadout:  req.AtkLoadout,
			DefLoadout:  req.DefLoadout,
			WinsDelta:   req.Wins,
			LossesDelta: req.Losses,
			Timestamp:   now,
		}

		if _, err := txRepo.BatchUpsertStats([]models.StatsUpdateDTO{updateItem}); err != nil {
			return err
		}
		_, err := txRepo.BatchUpsertDetails([]models.StatsDetailUpdateDTO{detailUpdate})
		return err
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stats updated and recorded in history."})
}

func (h *StatsHandler) DeleteSummaryDetails(c *gin.Context) {
	type BatchReq struct {
		Items []models.DeleteDetailModel `json:"items"`
	}
	var req BatchReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Items cannot be empty"})
		return
	}

	count, err := h.Repo.DeleteDetailsAndRecalc(req.Items)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Detail delete processed", "deleted": count})
}

func (h *StatsHandler) DeleteSummary(c *gin.Context) {
	var req models.DeleteSummaryModel
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON"})
		return
	}

	count, err := h.Repo.DeleteSummary(req.Server, req.Season, req.Tag, req.AtkSig, req.DefSig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted summary", "count": count})
}
