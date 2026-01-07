package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"server/internal/models"
)

type UserHandler struct {
	DB *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"` // admin | user
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON"})
		return
	}
	if req.Role != "admin" && req.Role != "user" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid role"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Password hash failed"})
		return
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         req.Role,
		CreatedAt:    time.Now().Unix(),
		UpdatedAt:    time.Now().Unix(),
	}
	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "role": user.Role})
}

type ResetPasswordRequest struct {
	Username    string `json:"username" binding:"required"`
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

type UserInfo struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

func (h *UserHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON"})
		return
	}

	var user models.User
	if err := h.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "User not found"})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Incorrect old password"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Password hash failed"})
		return
	}

	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"password_hash": string(hash),
		"updated_at":    time.Now().Unix(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	var users []models.User
	if err := h.DB.Order("username asc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Failed to load users"})
		return
	}

	resp := make([]UserInfo, 0, len(users))
	for _, u := range users {
		resp = append(resp, UserInfo{
			ID:        u.ID,
			Username:  u.Username,
			Role:      u.Role,
			CreatedAt: u.CreatedAt,
			UpdatedAt: u.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, resp)
}

type updateRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	var req updateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON"})
		return
	}
	if req.Role != "admin" && req.Role != "user" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid role"})
		return
	}

	var user models.User
	if err := h.DB.First(&user, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "User not found"})
		return
	}

	if err := h.DB.Model(&user).Updates(map[string]interface{}{
		"role":       req.Role,
		"updated_at": time.Now().Unix(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role updated", "role": req.Role})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	if err := h.DB.Delete(&models.User{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}
