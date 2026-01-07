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

type LoadoutEntry struct {
	ID         int `json:"id"`
	Star       int `json:"star"`
	WeaponStar int `json:"weapon_star"`
}

type LoadoutArray []LoadoutEntry

func (a LoadoutArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}

func (a *LoadoutArray) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &a)
}

type ArenaStats struct {
	Server string `gorm:"primaryKey;default:'global'" json:"server"`
	Season int    `gorm:"primaryKey;index:idx_season_server_total;index:idx_season_server_time;index:idx_season_server_wilson" json:"season"`
	Tag    string `gorm:"primaryKey;default:''" json:"tag"`

	AtkTeamSig string `gorm:"primaryKey" json:"atk_sig"`
	DefTeamSig string `gorm:"primaryKey" json:"def_sig"`

	AtkTeamJson IntArray `gorm:"type:jsonb;index:idx_atk_json_gin,type:gin" json:"atk_team"`
	DefTeamJson IntArray `gorm:"type:jsonb;index:idx_def_json_gin,type:gin" json:"def_team"`

	TotalBattles int     `gorm:"index:idx_season_server_total,sort:desc" json:"total_battles"`
	TotalWins    int     `json:"total_wins"`
	LastSeen     int64   `gorm:"index:idx_season_server_time,sort:desc" json:"last_seen"`
	WilsonScore  float64 `gorm:"index:idx_season_server_wilson,sort:desc" json:"wilson_score"`
	AvgWinRate   float64 `json:"avg_win_rate"`
}

type Comment struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Server    string `gorm:"default:'global';index:idx_comments_sigs" json:"server"`
	AtkSig    string `gorm:"not null;index:idx_comments_sigs" json:"atk_sig"`
	DefSig    string `gorm:"not null;index:idx_comments_sigs" json:"def_sig"`
	Username  string `json:"username"`
	Content   string `gorm:"not null" json:"content"`
	ParentID  *uint  `gorm:"default:null;index:idx_comments_parent" json:"parent_id"`
	CreatedAt int64  `gorm:"not null" json:"created_at"`
}

type Submission struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Server string `gorm:"not null" json:"server"`
	Season int    `gorm:"not null" json:"season"`
	Tag    string `json:"tag"`

	AtkTeamJson IntArray `gorm:"type:jsonb" json:"atk_team"`
	DefTeamJson IntArray `gorm:"type:jsonb" json:"def_team"`
	AtkLoadout  LoadoutArray `gorm:"type:jsonb" json:"atk_loadout"`
	DefLoadout  LoadoutArray `gorm:"type:jsonb" json:"def_loadout"`

	Wins      int     `gorm:"not null" json:"wins"`
	Losses    int     `gorm:"not null" json:"losses"`
	Note      string  `json:"note"`
	ImagePath *string `json:"image_path"`
	Status    string  `gorm:"default:'pending';index:idx_submissions_status" json:"status"`
	CreatedAt int64   `gorm:"not null" json:"created_at"`
}

type ArenaStatsDetail struct {
	Server string `gorm:"primaryKey;default:'global'" json:"server"`
	Season int    `gorm:"primaryKey;index:idx_detail_season_server_total;index:idx_detail_season_server_time;index:idx_detail_season_server_wilson" json:"season"`
	Tag    string `gorm:"primaryKey;default:''" json:"tag"`

	AtkTeamSig  string `gorm:"primaryKey" json:"atk_sig"`
	DefTeamSig  string `gorm:"primaryKey" json:"def_sig"`
	LoadoutHash string `gorm:"primaryKey" json:"loadout_hash"`

	AtkTeamJson    IntArray     `gorm:"type:jsonb;index:idx_detail_atk_json_gin,type:gin" json:"atk_team"`
	DefTeamJson    IntArray     `gorm:"type:jsonb;index:idx_detail_def_json_gin,type:gin" json:"def_team"`
	AtkLoadoutJson LoadoutArray `gorm:"type:jsonb;index:idx_detail_atk_loadout_gin,type:gin" json:"atk_loadout"`
	DefLoadoutJson LoadoutArray `gorm:"type:jsonb;index:idx_detail_def_loadout_gin,type:gin" json:"def_loadout"`

	TotalBattles int     `gorm:"index:idx_detail_season_server_total,sort:desc" json:"total_battles"`
	TotalWins    int     `json:"total_wins"`
	LastSeen     int64   `gorm:"index:idx_detail_season_server_time,sort:desc" json:"last_seen"`
	WilsonScore  float64 `gorm:"index:idx_detail_season_server_wilson,sort:desc" json:"wilson_score"`
	AvgWinRate   float64 `json:"avg_win_rate"`
}

type ManualAddRequest struct {
	Server     string        `json:"server"`
	Season     int           `json:"season"`
	Tag        string        `json:"tag"`
	AtkTeam    []int         `json:"atk_team"`
	DefTeam    []int         `json:"def_team"`
	AtkLoadout []LoadoutEntry`json:"atk_loadout"`
	DefLoadout []LoadoutEntry`json:"def_loadout"`
	Wins       int           `json:"wins"`
	Losses     int           `json:"losses"`
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

type DeleteDetailModel struct {
	Server      string `json:"server"`
	Season      int    `json:"season"`
	Tag         string `json:"tag"`
	AtkSig      string `json:"atk_sig"`
	DefSig      string `json:"def_sig"`
	LoadoutHash string `json:"loadout_hash"`
}

type User struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Username     string `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string `gorm:"not null" json:"-"`
	Role         string `gorm:"not null" json:"role"` // admin | user
	CreatedAt    int64  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    int64  `gorm:"autoUpdateTime" json:"updated_at"`
}

type CommentRequest struct {
	Server   string `json:"server"`
	AtkSig   string `json:"atk_sig"`
	DefSig   string `json:"def_sig"`
	Username string `json:"username"`
	Content  string `json:"content"`
	ParentID *uint  `json:"parent_id"`
}
