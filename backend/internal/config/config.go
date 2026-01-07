package config

import (
	"github.com/spf13/viper"
	"log"
)

type Config struct {
	DatabaseURL    string   `mapstructure:"DATABASE_URL"`
	SecretKey      string   `mapstructure:"SECRET_KEY"`
	AdminUsername  string   `mapstructure:"ADMIN_USERNAME"`
	AdminPassword  string   `mapstructure:"ADMIN_PASSWORD"`
	AllowedOrigins []string `mapstructure:"ALLOWED_ORIGINS"`
	FrontendURL    string   `mapstructure:"FRONTEND_URL"`
}

var AppConfig Config

func LoadConfig() {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

	viper.SetDefault("SECRET_KEY", "unsafe-secret-key")
	viper.SetDefault("ADMIN_USERNAME", "admin")
	viper.SetDefault("ADMIN_PASSWORD", "admin")
	viper.SetDefault("FRONTEND_URL", "http://localhost:5173")

	if err := viper.ReadInConfig(); err != nil {
		log.Println("No .env file found, reading from environment variables")
	}

	AppConfig = Config{
		DatabaseURL:   viper.GetString("DATABASE_URL"),
		SecretKey:     viper.GetString("SECRET_KEY"),
		AdminUsername: viper.GetString("ADMIN_USERNAME"),
		AdminPassword: viper.GetString("ADMIN_PASSWORD"),
		FrontendURL:   viper.GetString("FRONTEND_URL"),
	}

	AppConfig.AllowedOrigins = []string{AppConfig.FrontendURL}
}
