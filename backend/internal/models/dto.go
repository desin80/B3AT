package models

type StatsUpdateDTO struct {
	Server      string
	Season      int
	Tag         string
	AtkTeam     []int
	DefTeam     []int
	WinsDelta   int
	LossesDelta int
	Timestamp   int64
}

type StatsDetailUpdateDTO struct {
	Server      string
	Season      int
	Tag         string
	AtkTeam     []int
	DefTeam     []int
	AtkLoadout  []LoadoutEntry
	DefLoadout  []LoadoutEntry
	WinsDelta   int
	LossesDelta int
	Timestamp   int64
}

type SummaryQueryDTO struct {
	Page        uint64
	Limit       uint64
	Server      string
	Season      *int
	Tag         *string
	Sort        string
	MinWinRate  *float64
	MinBattles  *int
	AtkContains []int
	DefContains []int
	AtkSlots    map[int]int
	DefSlots    map[int]int
}

type SummaryDetailQueryDTO struct {
	Page   uint64
	Limit  uint64
	Server string
	Season *int
	Tag    *string
	AtkSig string
	DefSig string
	Sort   string
}
