package utils

import (
	"sort"
	"strconv"
	"strings"
)

func NormalizeTeam(teamList []int) ([]int, string) {
	if len(teamList) == 0 {
		return []int{}, ""
	}

	var strikers []int
	var specials []int

	for _, pid := range teamList {
		sPid := strconv.Itoa(pid)
		if strings.HasPrefix(sPid, "2") {
			specials = append(specials, pid)
		} else {
			strikers = append(strikers, pid)
		}
	}

	sort.Ints(specials)
	finalList := append(strikers, specials...)

	strList := make([]string, len(finalList))
	for i, id := range finalList {
		strList[i] = strconv.Itoa(id)
	}
	sig := strings.Join(strList, ",")

	return finalList, sig
}
