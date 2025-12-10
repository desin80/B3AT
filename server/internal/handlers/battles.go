package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/internal/models"
)

type BattlesHandler struct {
	DB *gorm.DB
}

func NewBattlesHandler(db *gorm.DB) *BattlesHandler {
	return &BattlesHandler{DB: db}
}

func (h *BattlesHandler) GetSeasons(c *gin.Context) {
	server := c.Query("server")
	var seasons []int

	query := h.DB.Model(&models.ArenaStats{}).Distinct("season").Order("season desc")

	if server != "" && server != "all" {
		query = query.Where("server = ?", server)
	}

	if err := query.Pluck("season", &seasons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	if len(seasons) == 0 {
		seasons = []int{1}
	}

	c.JSON(http.StatusOK, seasons)
}
