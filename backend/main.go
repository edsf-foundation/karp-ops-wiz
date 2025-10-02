package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/edsf-foundation/karp-ops-wiz/backend/api"
	"github.com/edsf-foundation/karp-ops-wiz/backend/k8s"
	"github.com/edsf-foundation/karp-ops-wiz/backend/wizard"
)

func main() {
	// Initialize Kubernetes client
	k8sClient, err := k8s.NewK8sClient()
	if err != nil {
		log.Fatalf("Failed to initialize Kubernetes client: %v", err)
	}

	// Initialize wizard service
	wizardService := wizard.NewService(k8sClient)

	// Setup Gin router
	r := gin.Default()

	// Enable CORS for frontend
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// API routes
	v1 := r.Group("/api/v1")
	{
		// Karpenter config wizard
		v1.GET("/presets", api.ListPresets)
		v1.POST("/generate-config", wizardService.HandleGenerateConfig)
		
		// Cost optimization dashboard
		v1.GET("/cluster/cost", wizardService.HandleGetClusterCost)
		v1.GET("/cluster/nodes", wizardService.HandleGetNodes)
		v1.GET("/cluster/pods", wizardService.HandleGetPods)
		v1.GET("/pricing/:region/:instance-type", api.GetPricing)
		
		// Rebalancing recommendations
		v1.GET("/recommendations/rebalancing", wizardService.HandleGetRebalancingRecommendations)
		v1.POST("/simulate/rebalancing", wizardService.HandleSimulateRebalancing)
	}

	// Serve static files (if needed for frontend)
	r.Static("/static", "./frontend/dist")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	log.Fatal(r.Run(":" + port))
}
