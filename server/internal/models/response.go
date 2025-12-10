package models

type SummaryResponseItem struct {
	Server        string  `json:"server"`
	Season        int     `json:"season"`
	Tag           string  `json:"tag"`
	AttackingTeam []int   `json:"attackingTeam"`
	DefendingTeam []int   `json:"defendingTeam"`
	Total         int     `json:"total"`
	Wins          int     `json:"wins"`
	Losses        int     `json:"losses"`
	WinRate       float64 `json:"winRate"`
	WilsonScore   float64 `json:"wilsonScore"`
	AvgWinRate    float64 `json:"avgWinRate"`
	LastSeen      int64   `json:"lastSeen"`
	AtkSig        string  `json:"atk_sig"`
	DefSig        string  `json:"def_sig"`
}

type PaginatedResponse struct {
	Data       []SummaryResponseItem `json:"data"`
	Total      int64                 `json:"total"`
	Page       uint64                `json:"page"`
	TotalPages int64                 `json:"totalPages"`
}
