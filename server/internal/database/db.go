package database

import (
	"log"
	"time"

	"server/internal/config"
	"server/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	dsn := config.AppConfig.DatabaseURL
	var err error

	for i := 0; i < 5; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			break
		}
		log.Printf("Waiting for Database... %v", err)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	sqlDB, _ := DB.DB()
	sqlDB.SetMaxIdleConns(4)
	sqlDB.SetMaxOpenConns(20)

	log.Println("Running AutoMigrate...")
	err = DB.AutoMigrate(
		&models.ArenaStats{},
		&models.ArenaStatsDetail{},
		&models.Comment{},
		&models.Submission{},
	)
	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	log.Println("Database initialized successfully.")
}
