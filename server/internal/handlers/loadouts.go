package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"server/internal/models"
	"server/internal/repository"
)

type LoadoutHandler struct {
	Repo *repository.StatsRepository
}

func NewLoadoutHandler(repo *repository.StatsRepository) *LoadoutHandler {
	return &LoadoutHandler{Repo: repo}
}

type LoadoutRequest struct {
	Server     string                `json:"server" binding:"required"`
	Season     int                   `json:"season" binding:"required"`
	Tag        string                `json:"tag"`
	AtkTeam    []int                 `json:"atk_team" binding:"required"`
	DefTeam    []int                 `json:"def_team" binding:"required"`
	AtkLoadout []models.LoadoutEntry `json:"atk_loadout"`
	DefLoadout []models.LoadoutEntry `json:"def_loadout"`
	Wins       int                   `json:"wins"`
	Losses     int                   `json:"losses"`
	Timestamp  *int64                `json:"timestamp"`
}

func (h *LoadoutHandler) AddLoadout(c *gin.Context) {
	var req LoadoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("loadouts bind error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	if req.Season < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Season must be positive"})
		return
	}
	if len(req.AtkTeam) == 0 || len(req.DefTeam) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Teams cannot be empty"})
		return
	}
	if req.Wins < 0 || req.Losses < 0 || (req.Wins+req.Losses) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Wins/Losses invalid"})
		return
	}

	now := time.Now().Unix()
	if req.Timestamp != nil {
		now = *req.Timestamp
	}

	// constraint: weapon_star>0 => star>0
	validateLoadout := func(arr []models.LoadoutEntry) bool {
		for _, e := range arr {
			if e.WeaponStar > 0 && e.Star <= 0 {
				return false
			}
		}
		return true
	}
	if !validateLoadout(req.AtkLoadout) || !validateLoadout(req.DefLoadout) {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "weapon_star>0 requires star>0"})
		return
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

	update := models.StatsUpdateDTO{
		Server:      req.Server,
		Season:      req.Season,
		Tag:         req.Tag,
		AtkTeam:     req.AtkTeam,
		DefTeam:     req.DefTeam,
		WinsDelta:   req.Wins,
		LossesDelta: req.Losses,
		Timestamp:   now,
	}

	_, err := h.Repo.BatchUpsertStats([]models.StatsUpdateDTO{update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	_, err = h.Repo.BatchUpsertDetails([]models.StatsDetailUpdateDTO{detailUpdate})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Loadout added"})
}
