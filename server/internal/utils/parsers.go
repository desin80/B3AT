package utils

import (
	"strconv"
	"strings"
)

func ParseIDList(s string) []int {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	var ids []int
	for _, p := range parts {
		if val, err := strconv.Atoi(strings.TrimSpace(p)); err == nil {
			ids = append(ids, val)
		}
	}
	return ids
}

func ParseSlotMap(s string) map[int]int {
	if s == "" {
		return nil
	}
	result := make(map[int]int)
	parts := strings.Split(s, ",")
	for _, p := range parts {
		kv := strings.Split(p, ":")
		if len(kv) == 2 {
			idx, err1 := strconv.Atoi(strings.TrimSpace(kv[0]))
			uid, err2 := strconv.Atoi(strings.TrimSpace(kv[1]))
			if err1 == nil && err2 == nil {
				result[idx] = uid
			}
		}
	}
	return result
}
