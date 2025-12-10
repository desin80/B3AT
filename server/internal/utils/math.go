package utils

import "math"

func WilsonLowerBound(wins int, n int) float64 {
	if n == 0 {
		return 0.0
	}
	z := 1.96
	phat := float64(wins) / float64(n)

	numerator := phat + (z*z)/(2*float64(n)) - z*math.Sqrt((phat*(1-phat)+(z*z)/(4*float64(n)))/float64(n))
	denominator := 1 + (z*z)/float64(n)

	return numerator / denominator
}

func PosteriorMean(wins int, n int) float64 {
	alpha := 1.0
	beta := 1.0
	return (float64(wins) + alpha) / (float64(n) + alpha + beta)
}
