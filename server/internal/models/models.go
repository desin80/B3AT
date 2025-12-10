package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type IntArray []int

func (a IntArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}

func (a *IntArray) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &a)
}

type ArenaStats struct {
	Server string `gorm:"primaryKey;default:'global'"`
	Season int    `gorm:"primaryKey;index:idx_season_server_total;index:idx_season_server_time;index:idx_season_server_wilson"`
	Tag    string `gorm:"primaryKey;default:''"`

	AtkTeamSig string `gorm:"primaryKey"`
	DefTeamSig string `gorm:"primaryKey"`

	AtkTeamJson IntArray `gorm:"type:jsonb;index:idx_atk_json_gin,type:gin"`
	DefTeamJson IntArray `gorm:"type:jsonb;index:idx_def_json_gin,type:gin"`

	TotalBattles int `gorm:"index:idx_season_server_total,sort:desc"`
	TotalWins    int
	LastSeen     int64   `gorm:"index:idx_season_server_time,sort:desc"`
	WilsonScore  float64 `gorm:"index:idx_season_server_wilson,sort:desc"`
	AvgWinRate   float64
}

type Comment struct {
	ID        uint   `gorm:"primaryKey"`
	Server    string `gorm:"default:'global';index:idx_comments_sigs"`
	AtkSig    string `gorm:"not null;index:idx_comments_sigs"`
	DefSig    string `gorm:"not null;index:idx_comments_sigs"`
	Username  string
	Content   string `gorm:"not null"`
	ParentID  *uint  `gorm:"default:null;index:idx_comments_parent"`
	CreatedAt int64  `gorm:"not null"`
}

type Submission struct {
	ID          uint   `gorm:"primaryKey"`
	Server      string `gorm:"not null"`
	Season      int    `gorm:"not null"`
	Tag         string
	AtkTeamJson IntArray `gorm:"type:jsonb"`
	DefTeamJson IntArray `gorm:"type:jsonb"`
	Wins        int      `gorm:"not null"`
	Losses      int      `gorm:"not null"`
	Note        string
	ImagePath   *string
	Status      string `gorm:"default:'pending';index:idx_submissions_status"`
	CreatedAt   int64  `gorm:"not null"`
}

type ManualAddRequest struct {
	Server  string `json:"server"`
	Season  int    `json:"season"`
	Tag     string `json:"tag"`
	AtkTeam []int  `json:"atk_team"`
	DefTeam []int  `json:"def_team"`
	Wins    int    `json:"wins"`
	Losses  int    `json:"losses"`
}

type DeleteSummaryModel struct {
	Server string `json:"server"`
	Season int    `json:"season"`
	Tag    string `json:"tag"`
	AtkSig string `json:"atk_sig"`
	DefSig string `json:"def_sig"`
}

type BatchDeleteRequest struct {
	Items []DeleteSummaryModel `json:"items"`
}

type CommentRequest struct {
	Server   string `json:"server"`
	AtkSig   string `json:"atk_sig"`
	DefSig   string `json:"def_sig"`
	Username string `json:"username"`
	Content  string `json:"content"`
	ParentID *uint  `json:"parent_id"`
}
