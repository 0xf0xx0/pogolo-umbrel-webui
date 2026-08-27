package main

import (
	"strconv"
	"strings"
)

// pretty-print difficulty
func formatDifficulty(value float64) string {
	sb := strings.Builder{}
	sb.Grow(8)
	unit := ""
	if value >= 1e15 {
		unit = "P"
		value /= 1e15
	} else if value >= 1e12 {
		unit = "T"
		value /= 1e12
	} else if value >= 1e9 {
		unit = "G"
		value /= 1e9
	} else if value >= 1e6 {
		unit = "M"
		value /= 1e6
	} else if value >= 1000 {
		unit = "k"
		value /= 1000
	}

	sb.WriteString(strconv.FormatFloat(value, 'g', 3, 64))
	sb.WriteString(unit)
	return sb.String()
}

// takes MH/s
func formatHashrate(value float64) string {
	sb := strings.Builder{}
	sb.Grow(16)

	unit := "M"
	if value > 1e9 {
		value /= 1e9
		unit = "P"
	} else if value > 1e6 {
		value /= 1e6
		unit = "T"
	} else if value > 1000 {
		value /= 1000
		unit = "G"
	}

	sb.WriteString(strconv.FormatFloat(value, 'g', 5, 64))
	sb.WriteRune(' ')
	sb.WriteString(unit)
	sb.WriteString("H/s")
	return sb.String()
}
