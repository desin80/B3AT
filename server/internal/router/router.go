package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"server/internal/config"
	"server/internal/handlers"
	"server/internal/middleware"
	"server/internal/models"
)

func Setup(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	statsH := handlers.NewStatsHandler(db)
	battlesH := handlers.NewBattlesHandler(db)
	commentsH := handlers.NewCommentsHandler(db)
	subH := handlers.NewSubmissionHandler(db)
	loadoutH := handlers.NewLoadoutHandler(statsH.Repo)
	userH := handlers.NewUserHandler(db)

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = config.AppConfig.AllowedOrigins
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{
		"Authorization",
		"Content-Type",
		"Accept",
		"Origin",
		"X-Requested-With",
	}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(corsConfig))

	r.Static("/uploads", "./uploads")

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Server is running"})
	})

	r.POST("/api/token", handlers.Login)
	r.GET("/api/seasons", battlesH.GetSeasons)
	r.GET("/api/summaries", statsH.GetSummaries)
	r.GET("/api/summaries/detail", statsH.GetSummaryDetails)
	r.GET("/api/comments", commentsH.GetComments)
	r.POST("/api/comments", commentsH.AddComment)
	r.POST("/api/submissions", subH.CreateSubmission)

	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware("admin"))
	{
		auth.POST("/api/manual_add", statsH.ManualAdd)
		auth.POST("/api/summaries/delete", statsH.DeleteSummary)
		auth.POST("/api/summaries/detail/delete", statsH.DeleteSummaryDetails)
		auth.POST("/api/summaries/batch_delete", func(c *gin.Context) {
			type BatchReq struct {
				Items []models.DeleteSummaryModel `json:"items"`
			}
			var req BatchReq
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": "Invalid JSON"})
				return
			}
			count := 0
			for _, item := range req.Items {
				if _, err := statsH.Repo.DeleteSummary(item.Server, item.Season, item.Tag, item.AtkSig, item.DefSig); err == nil {
					count++
				}
			}
			c.JSON(200, gin.H{"message": "Batch delete processed"})
		})

		auth.DELETE("/api/comments/:comment_id", commentsH.DeleteComment)
		auth.POST("/api/upload", subH.UploadJSON)
		auth.GET("/api/submissions", subH.GetPending)
		auth.GET("/api/submissions/history", subH.GetHistory)
		auth.POST("/api/submissions/:sub_id/:action", subH.ProcessSubmission)
		auth.POST("/api/users", userH.CreateUser)
	}

	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware("admin", "user"))
	{
		protected.POST("/api/loadouts", loadoutH.AddLoadout)
	}

	return r
}
