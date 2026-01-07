package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"server/internal/models"
	"server/internal/utils"
)

type CommentsHandler struct {
	DB *gorm.DB
}

func NewCommentsHandler(db *gorm.DB) *CommentsHandler {
	return &CommentsHandler{DB: db}
}

func ensureSig(sigStr string) string {
	if sigStr == "" {
		return ""
	}
	parts := strings.Split(sigStr, ",")
	var ids []int
	for _, p := range parts {
		if val, err := strconv.Atoi(strings.TrimSpace(p)); err == nil {
			ids = append(ids, val)
		}
	}
	if len(ids) == 0 {
		return sigStr
	}
	_, finalSig := utils.NormalizeTeam(ids)
	return finalSig
}

func (h *CommentsHandler) GetComments(c *gin.Context) {
	atkSig := c.Query("atk_sig")
	defSig := c.Query("def_sig")
	server := c.DefaultQuery("server", "global")

	finalAtk := ensureSig(atkSig)
	finalDef := ensureSig(defSig)

	var comments []models.Comment
	err := h.DB.Where("server = ? AND atk_sig = ? AND def_sig = ?", server, finalAtk, finalDef).
		Order("created_at desc").
		Find(&comments).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comments)
}

func (h *CommentsHandler) AddComment(c *gin.Context) {
	var req models.CommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON"})
		return
	}

	comment := models.Comment{
		Server:    req.Server,
		AtkSig:    ensureSig(req.AtkSig),
		DefSig:    ensureSig(req.DefSig),
		Username:  req.Username,
		Content:   req.Content,
		ParentID:  req.ParentID,
		CreatedAt: time.Now().Unix(),
	}

	if err := h.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": comment.ID, "message": "Comment added"})
}

func (h *CommentsHandler) DeleteComment(c *gin.Context) {
	idStr := c.Param("comment_id")
	err := h.DB.Where("id = ? OR parent_id = ?", idStr, idStr).Delete(&models.Comment{}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
