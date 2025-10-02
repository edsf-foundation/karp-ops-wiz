package api

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func ListPresets(c *gin.Context) {
	presets := map[string]interface{}{
		"cost-optimized": map[string]interface{}{
			"name":        "Cost Optimized",
			"description": "Maximize savings with Spot instances and Graviton processors",
			"features": []string{
				"Prefer Spot instances (up to 90% savings)",
				"Graviton instances (ARM64) for better price/performance",
				"Smaller instance sizes for cost efficiency",
				"Consolidation enabled",
			},
			"instanceFamilies": []string{"t3", "m5", "c5", "c6g"},
			"spotRatio":       90,
		},
		"performance": map[string]interface{}{
			"name":        "Performance",
			"description": "Optimize for compute-intensive workloads",
			"features": []string{
				"On-demand instances for stability",
				"Larger instance sizes",
				"Latest generation processors (C6i, M6i)",
				"Consolidation disabled for consistent performance",
			},
			"instanceFamilies": []string{"c5", "c6i", "m5", "m6i"},
			"spotRatio":       0,
		},
		"balanced": map[string]interface{}{
			"name":        "Balanced",
			"description": "Balance cost and performance with mixed instances",
			"features": []string{
				"Mix of Spot and On-demand instances",
				"Moderate instance sizing",
				"General-purpose instance families",
				"Flexible consolidation policies",
			},
			"instanceFamilies": []string{"t3", "m5", "c5"},
			"spotRatio":       50,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"presets": presets,
		"regions": []string{
			"us-east-1", "us-east-2", "us-west-1", "us-west-2",
			"eu-west-1", "eu-west-2", "eu-central-1",
			"ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
		},
		"features": map[string]interface{}{
			"consolidation": map[string]interface{}{
				"description": "Enable node consolidation for better resource utilization",
				"default":     false,
			},
			"spotInterruptionHandling": map[string]interface{}{
				"description": "Handle spot instance interruptions gracefully",
				"default":     true,
			},
			"nodeTerminationHandler": map[string]interface{}{
				"description": "Automatic graceful termination handling",
				"default":     true,
			},
		},
	})
}

func GetPricing(c *gin.Context) {
	region := c.Param("region")
	instanceType := c.Param("instance-type")
	
	// Extract family from instance type (e.g., "c5.large" -> "c5")
	family := strings.Split(instanceType, ".")[0]
	
	// Mock pricing data - in production this would come from AWS pricing API
	pricingData := map[string]map[string]map[string]float64{
		"us-east-1": {
			"c5": {
				"large":   0.096,
				"xlarge":  0.192,
				"2xlarge": 0.384,
			},
			"m5": {
				"large":   0.096,
				"xlarge":  0.192,
				"2xlarge": 0.384,
			},
			"t3": {
				"medium":  0.0416,
				"large":   0.0832,
				"xlarge":  0.1664,
			},
			"c6g": {
				"large":   0.0768,  // Graviton pricing
				"xlarge":  0.1536,
				"2xlarge": 0.3072,
			},
		},
	}

	var onDemandPrice, spotPrice float64
	
	if regionPricing, ok := pricingData[region]; ok {
		if familyPricing, ok := regionPricing[family]; ok {
			if price, ok := familyPricing[strings.Split(instanceType, ".")[1]]; ok {
				onDemandPrice = price
				spotPrice = price * 0.3 // ~70% discount for spot
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"region":       region,
		"instanceType": instanceType,
		"onDemand": gin.H{
			"price":     onDemandPrice,
			"currency":  "USD",
			"unit":      "per hour",
		},
		"spot": gin.H{
			"price":          spotPrice,
			"currency":       "USD",
			"unit":           "per hour",
			"discount":       "70%",
			"interruptionRisk": "Low-Medium",
		},
		"monthly": gin.H{
			"onDemand": onDemandPrice * 24 * 30,
			"spot":     spotPrice * 24 * 30,
			"savings":  (onDemandPrice - spotPrice) * 24 * 30,
		},
	})
}
