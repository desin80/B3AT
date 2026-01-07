package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"server/internal/config"
	"server/internal/database"
	"server/internal/middleware"
	"server/internal/models"
)

type LoginRequest struct {
	Username string `form:"username" binding:"required"`
	Password string `form:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid request"})
		return
	}

	// DB-backed user lookup
	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err == nil {
		if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
			c.JSON(http.StatusBadRequest, gin.H{"detail": "Incorrect username or password"})
			return
		}
		token, err := middleware.GenerateToken(user.Username, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Token generation failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"access_token": token,
			"role":         user.Role,
			"token_type":   "bearer",
		})
		return
	}

	// fallback legacy admin credentials from env
	if req.Username == config.AppConfig.AdminUsername && req.Password == config.AppConfig.AdminPassword {
		token, err := middleware.GenerateToken(req.Username, "admin")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Token generation failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"access_token": token,
			"role":         "admin",
			"token_type":   "bearer",
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"detail": "Incorrect username or password"})
}
