package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
	"server/internal/config"
)

type AdminClaims struct {
	Username string `json:"sub"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

var DBInstance *gorm.DB

func GenerateToken(username string, role string) (string, error) {
	claims := AdminClaims{
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 60 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.SecretKey))
}

func AuthMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.AppConfig.SecretKey), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Could not validate credentials"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*AdminClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Invalid claims"})
			c.Abort()
			return
		}

		allowed := false
		for _, r := range roles {
			if claims.Role == r {
				allowed = true
				break
			}
		}
		if !allowed {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Insufficient role"})
			c.Abort()
			return
		}

		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}
