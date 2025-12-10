package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"server/internal/config"
	"server/internal/middleware"
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

	if req.Username != config.AppConfig.AdminUsername || req.Password != config.AppConfig.AdminPassword {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Incorrect username or password"})
		return
	}

	token, err := middleware.GenerateToken(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Token generation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": token,
		"token_type":   "bearer",
	})
}
