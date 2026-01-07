package main

import (
	"log"
	"os"

	"server/internal/config"
	"server/internal/database"
	"server/internal/router"
)

func main() {
	config.LoadConfig()
	database.InitDB()

	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}
	r := router.Setup(database.DB)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
