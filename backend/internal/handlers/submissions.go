package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"server/internal/models"
	"server/internal/repository"
	"server/internal/utils"
)

type SubmissionHandler struct {
	DB   *gorm.DB
	Repo *repository.StatsRepository
}

func NewSubmissionHandler(db *gorm.DB) *SubmissionHandler {
	return &SubmissionHandler{
		DB:   db,
		Repo: repository.NewStatsRepository(db),
	}
}

func (h *SubmissionHandler) UploadJSON(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "File required"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Cannot open file"})
		return
	}
	defer f.Close()

	type UploadRecord struct {
		Server           string `json:"Server"`
		Season           int    `json:"Season"`
		Tag              string `json:"Tag"`
		AttackingTeamIds []int  `json:"AttackingTeamIds"`
		DefendingTeamIds []int  `json:"DefendingTeamIds"`
		Win              bool   `json:"Win"`
		Time             string `json:"Time"`
	}

	var records []UploadRecord
	if err := json.NewDecoder(f).Decode(&records); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid JSON format"})
		return
	}

	defaultServer := c.DefaultPostForm("default_server", "global")
	defaultSeasonVal := c.DefaultPostForm("default_season", "9")
	defaultSeason, _ := strconv.Atoi(defaultSeasonVal)

	type AggKey struct {
		Server, Tag    string
		Season         int
		AtkSig, DefSig string
	}
	type AggVal struct {
		Wins, Losses int
		Timestamp    int64
		AtkTeam      []int
		DefTeam      []int
	}

	aggregation := make(map[AggKey]*AggVal)

	for _, row := range records {
		if len(row.AttackingTeamIds) == 0 || len(row.DefendingTeamIds) == 0 {
			continue
		}

		server := strings.ToLower(row.Server)
		if server == "" {
			server = defaultServer
		}
		season := row.Season
		if season == 0 {
			season = defaultSeason
		}

		ts := time.Now().Unix()
		if row.Time != "" {
			if t, err := time.Parse(time.RFC3339, row.Time); err == nil {
				ts = t.Unix()
			} else if t, err := time.Parse("2006-01-02T15:04:05", row.Time); err == nil {
				ts = t.Unix()
			}
		}

		atkList, atkSig := utils.NormalizeTeam(row.AttackingTeamIds)
		defList, defSig := utils.NormalizeTeam(row.DefendingTeamIds)

		key := AggKey{server, row.Tag, season, atkSig, defSig}

		if _, exists := aggregation[key]; !exists {
			aggregation[key] = &AggVal{AtkTeam: atkList, DefTeam: defList}
		}

		val := aggregation[key]
		if row.Win {
			val.Wins++
		} else {
			val.Losses++
		}
		if ts > val.Timestamp {
			val.Timestamp = ts
		}
	}

	var updates []models.StatsUpdateDTO
	for k, v := range aggregation {
		updates = append(updates, models.StatsUpdateDTO{
			Server:      k.Server,
			Season:      k.Season,
			Tag:         k.Tag,
			AtkTeam:     v.AtkTeam,
			DefTeam:     v.DefTeam,
			WinsDelta:   v.Wins,
			LossesDelta: v.Losses,
			Timestamp:   v.Timestamp,
		})
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No valid data found to import."})
		return
	}

	count, err := h.Repo.BatchUpsertStats(updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully processed %d records, updated/created %d summaries.", len(records), count),
	})
}

func (h *SubmissionHandler) CreateSubmission(c *gin.Context) {
	server := c.PostForm("server")
	season, _ := strconv.Atoi(c.PostForm("season"))
	tag := c.PostForm("tag")
	atkStr := c.PostForm("atk_team")
	defStr := c.PostForm("def_team")
	atkLoadoutStr := c.PostForm("atk_loadout")
	defLoadoutStr := c.PostForm("def_loadout")
	wins, _ := strconv.Atoi(c.PostForm("wins"))
	losses, _ := strconv.Atoi(c.PostForm("losses"))
	note := c.PostForm("note")

	var imagePath *string
	file, err := c.FormFile("image")
	if err == nil {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
		if !allowed[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"detail": "Unsupported file type"})
			return
		}
		filename := uuid.New().String() + ext
		savePath := filepath.Join("uploads", filename)
		os.MkdirAll("uploads", 0755)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "Failed to save image"})
			return
		}

		webPath := "/uploads/" + filename
		imagePath = &webPath
	}

	var atkTeam, defTeam []int
	json.Unmarshal([]byte(atkStr), &atkTeam)
	json.Unmarshal([]byte(defStr), &defTeam)
	var atkLoadout, defLoadout []models.LoadoutEntry
	if atkLoadoutStr != "" {
		if err := json.Unmarshal([]byte(atkLoadoutStr), &atkLoadout); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid atk_loadout JSON"})
			return
		}
	}
	if defLoadoutStr != "" {
		if err := json.Unmarshal([]byte(defLoadoutStr), &defLoadout); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid def_loadout JSON"})
			return
		}
	}

	sub := models.Submission{
		Server:      server,
		Season:      season,
		Tag:         tag,
		AtkTeamJson: models.IntArray(atkTeam),
		DefTeamJson: models.IntArray(defTeam),
		AtkLoadout:  models.LoadoutArray(atkLoadout),
		DefLoadout:  models.LoadoutArray(defLoadout),
		Wins:        wins,
		Losses:      losses,
		Note:        note,
		ImagePath:   imagePath,
		Status:      "pending",
		CreatedAt:   time.Now().Unix(),
	}

	if err := h.DB.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Submission received. Waiting for admin approval."})
}

func (h *SubmissionHandler) GetPending(c *gin.Context) {
	var subs []models.Submission
	h.DB.Where("status = ?", "pending").Order("created_at desc").Find(&subs)
	c.JSON(http.StatusOK, subs)
}

func (h *SubmissionHandler) GetHistory(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	var subs []models.Submission
	h.DB.Where("status != ?", "pending").Order("created_at desc").Limit(limit).Find(&subs)
	c.JSON(http.StatusOK, subs)
}

func (h *SubmissionHandler) ProcessSubmission(c *gin.Context) {
	subID := c.Param("sub_id")
	action := c.Param("action")

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var sub models.Submission
		if err := tx.First(&sub, subID).Error; err != nil {
			return err
		}

		txRepo := repository.NewStatsRepository(tx)

		switch action {
		case "approve":
			if sub.Status != "pending" {
				return fmt.Errorf("submission already processed")
			}
			update := models.StatsUpdateDTO{
				Server:      sub.Server,
				Season:      sub.Season,
				Tag:         sub.Tag,
				AtkTeam:     []int(sub.AtkTeamJson),
				DefTeam:     []int(sub.DefTeamJson),
				WinsDelta:   sub.Wins,
				LossesDelta: sub.Losses,
				Timestamp:   time.Now().Unix(),
			}
			if _, err := txRepo.BatchUpsertStats([]models.StatsUpdateDTO{update}); err != nil {
				return err
			}

			detailUpdate := models.StatsDetailUpdateDTO{
				Server:      sub.Server,
				Season:      sub.Season,
				Tag:         sub.Tag,
				AtkTeam:     []int(sub.AtkTeamJson),
				DefTeam:     []int(sub.DefTeamJson),
				AtkLoadout:  []models.LoadoutEntry(sub.AtkLoadout),
				DefLoadout:  []models.LoadoutEntry(sub.DefLoadout),
				WinsDelta:   sub.Wins,
				LossesDelta: sub.Losses,
				Timestamp:   time.Now().Unix(),
			}
			if _, err := txRepo.BatchUpsertDetails([]models.StatsDetailUpdateDTO{detailUpdate}); err != nil {
				return err
			}
			sub.Status = "approved"

		case "reject":
			sub.Status = "rejected"

		case "revert":
			if sub.Status == "pending" {
				return fmt.Errorf("cannot revert pending submission")
			}
			if sub.Status == "approved" {
				update := models.StatsUpdateDTO{
					Server:      sub.Server,
					Season:      sub.Season,
					Tag:         sub.Tag,
					AtkTeam:     []int(sub.AtkTeamJson),
					DefTeam:     []int(sub.DefTeamJson),
					WinsDelta:   -sub.Wins,
					LossesDelta: -sub.Losses,
					Timestamp:   time.Now().Unix(),
				}
				if _, err := txRepo.BatchUpsertStats([]models.StatsUpdateDTO{update}); err != nil {
					return err
				}

				detailUpdate := models.StatsDetailUpdateDTO{
					Server:      sub.Server,
					Season:      sub.Season,
					Tag:         sub.Tag,
					AtkTeam:     []int(sub.AtkTeamJson),
					DefTeam:     []int(sub.DefTeamJson),
					AtkLoadout:  []models.LoadoutEntry(sub.AtkLoadout),
					DefLoadout:  []models.LoadoutEntry(sub.DefLoadout),
					WinsDelta:   -sub.Wins,
					LossesDelta: -sub.Losses,
					Timestamp:   time.Now().Unix(),
				}
				if _, err := txRepo.BatchUpsertDetails([]models.StatsDetailUpdateDTO{detailUpdate}); err != nil {
					return err
				}
			}
			sub.Status = "pending"

		default:
			return fmt.Errorf("invalid action")
		}

		return tx.Save(&sub).Error
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Submission %s successful", action)})
}
