package wizard

import (
    "fmt"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/edsf-foundation/karp-ops-wiz/backend/k8s"
)

type Service struct {
	k8sClient *k8s.K8sClient
}

func NewService(k8sClient *k8s.K8sClient) *Service {
	return &Service{
		k8sClient: k8sClient,
	}
}

type ConfigRequest struct {
	Preset      string            `json:"preset" binding:"required"`
	Region      string            `json:"region" binding:"required"`
	Zone        string            `json:"zone"`
	Features    map[string]bool   `json:"features"`
	Customizations map[string]interface{} `json:"customizations"`
}

type ProvisionerConfig struct {
	APIVersion string      `yaml:"apiVersion"`
	Kind       string      `yaml:"kind"`
	Metadata   Metadata    `yaml:"metadata"`
	Spec       ProvisionerSpec `yaml:"spec"`
}

type NodeTemplateConfig struct {
	APIVersion string      `yaml:"apiVersion"`
	Kind       string      `yaml:"kind"`
	Metadata   Metadata    `yaml:"metadata"`
	Spec       NodeTemplateSpec `yaml:"spec"`
}

type Metadata struct {
	Name      string            `yaml:"name"`
	Namespace string           `yaml:"namespace"`
	Labels    map[string]string `yaml:"labels,omitempty"`
}

type ProvisionerSpec struct {
	ProviderRef                     ProviderRef `yaml:"providerRef"`
	Requirements                    []Requirement `yaml:"requirements"`
	ResourceLimits                 ResourceLimits `yaml:"resourceLimits"`
    Taints                          []Taint       `yaml:"taints,omitempty"`
	Labels                          map[string]string `yaml:"labels,omitempty"`
	Weight                          int           `yaml:"weight"`
	Consolidation                   Consolidation `yaml:"consolidation,omitempty"`
	TTLSecondsAfterEmpty           *int          `yaml:"ttlSecondsAfterEmpty,omitempty"`
	TTLSecondsUntilExpired         *int          `yaml:"ttlSecondsUntilExpired,omitempty"`
}

type NodeTemplateSpec struct {
	Template            NodeTemplateContent `yaml:"template"`
	Requirements        []Requirement       `yaml:"requirements"`
	AMI                 string              `yaml:"ami,omitempty"`
	InstanceProfile     string              `yaml:"instanceProfile,omitempty"`
	LaunchTemplateName  string              `yaml:"launchTemplateName,omitempty"`
	SecurityGroupIDs    []string           `yaml:"securityGroupIds,omitempty"`
	SubnetSelector      map[string]string   `yaml:"subnetSelector,omitempty"`
	MetadataOptions     MetadataOptions     `yaml:"metadataOptions,omitempty"`
}

type NodeTemplateContent struct {
	Metadata Metadata              `yaml:"metadata"`
	Spec     NodeTemplateNodeSpec  `yaml:"spec"`
}

type NodeTemplateNodeSpec struct {
	Taints               []Taint             `yaml:"taints,omitempty"`
	Labels               map[string]string   `yaml:"labels,omitempty"`
	UserData             string              `yaml:"userData,omitempty"`
}

type ProviderRef struct {
	APIVersion string `yaml:"apiVersion"`
	Kind       string `yaml:"kind"`
	Name       string `yaml:"name"`
}

type Requirement struct {
	Key      string `yaml:"key"`
	Operator string `yaml:"operator"`
	Values   []string `yaml:"values"`
}

type ResourceLimits struct {
	CPU    string `yaml:"cpu"`
	Memory string `yaml:"memory"`
}

type Taint struct {
	Key    string `yaml:"key"`
	Value  string `yaml:"value"`
	Effect string `yaml:"effect"`
}

type Consolidation struct {
	Enabled bool `yaml:"enabled"`
}

type MetadataOptions struct {
	HTTPEndpoint            string `yaml:"httpEndpoint,omitempty"`
	HTTPProtocolIPv6        string `yaml:"httpProtocolIPv6,omitempty"`
	HTTPPutResponseHopLimit int    `yaml:"httpPutResponseHopLimit,omitempty"`
}

func (s *Service) HandleGenerateConfig(c *gin.Context) {
	var req ConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate provisioner config
	provisioner, err := s.generateProvisioner(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Generate node template config
	nodeTemplate, err := s.generateNodeTemplate(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{
		"provisioner":  provisioner,
		"nodeTemplate": nodeTemplate,
		"summary": gin.H{
			"preset":       req.Preset,
			"region":       req.Region,
			"features":     req.Features,
			"instructions": []string{
				"1. Apply the provisioner configuration: kubectl apply -f provisioner.yaml",
				"2. Apply the node template: kubectl apply -f node-template.yaml",
				"3. Monitor node provisioning: kubectl get nodes -w",
			},
		},
	}

	c.JSON(http.StatusOK, response)
}

func (s *Service) generateProvisioner(req ConfigRequest) (*ProvisionerConfig, error) {
	config := &ProvisionerConfig{
		APIVersion: "karpenter.sh/v1beta1",
		Kind:       "NodePool",
		Metadata: Metadata{
			Name:      fmt.Sprintf("%s-provisioner", req.Preset),
			Namespace: "karpenter",
			Labels: map[string]string{
				"karpenter.io/cluster": "default",
			},
		},
		Spec: ProvisionerSpec{
			ProviderRef: ProviderRef{
				APIVersion: "karpenter.k8s.aws/v1beta1",
				Kind:       "EC2NodeClass",
				Name:       fmt.Sprintf("%s-nodepool", req.Preset),
			},
			Requirements: s.getRequirements(req),
			ResourceLimits: ResourceLimits{
				CPU:    s.getCPULimit(req),
				Memory: s.getMemoryLimit(req),
			},
			Weight: 50,
		},
	}

	// Apply features
	if req.Features["consolidation"] {
		config.Spec.Consolidation = Consolidation{Enabled: true}
	}

	if ttlAfterEmpty, ok := req.Customizations["ttlSecondsAfterEmpty"]; ok {
		if ttl, ok := ttlAfterEmpty.(float64); ok {
			ttlInt := int(ttl)
			config.Spec.TTLSecondsAfterEmpty = &ttlInt
		}
	}

	return config, nil
}

func (s *Service) generateNodeTemplate(req ConfigRequest) (*NodeTemplateConfig, error) {
	config := &NodeTemplateConfig{
		APIVersion: "karpenter.k8s.aws/v1beta1",
		Kind:       "EC2NodeClass",
		Metadata: Metadata{
			Name:      fmt.Sprintf("%s-nodepool", req.Preset),
			Namespace: "default",
			Labels: map[string]string{
				"karpenter.io/cluster": "default",
			},
		},
		Spec: NodeTemplateSpec{
			Requirements: s.getNodeTemplateRequirements(req),
			InstanceProfile: s.getInstanceProfile(req),
			LaunchTemplateName: s.getLaunchTemplateName(req),
		},
	}

	return config, nil
}

func (s *Service) getRequirements(req ConfigRequest) []Requirement {
	requirements := []Requirement{
		{
			Key:      "kubernetes.io/arch",
			Operator: "In",
			Values:   []string{"amd64", "arm64"},
		},
		{
			Key:      "topology.kubernetes.io/zone",
			Operator: "In",
			Values:   []string{req.Zone},
		},
		{
			Key:      "topology.kubernetes.io/region",
			Operator: "In",
			Values:   []string{req.Region},
		},
	}

	// Add capacity type based on preset
	switch req.Preset {
	case "cost-optimized":
		requirements = append(requirements, Requirement{
			Key:      "karpenter.sh/capacity-type",
			Operator: "In",
			Values:   []string{"spot", "on-demand"},
		})
	case "performance":
		requirements = append(requirements, Requirement{
			Key:      "karpenter.sh/capacity-type",
			Operator: "In",
			Values:   []string{"on-demand"},
		})
	case "balanced":
		requirements = append(requirements, Requirement{
			Key:      "karpenter.sh/capacity-type",
			Operator: "In",
			Values:   []string{"spot", "on-demand"},
		})
	}

	// Add instance type families
	instanceTypes := s.getInstanceTypes(req.Preset)
	if len(instanceTypes) > 0 {
		requirements = append(requirements, Requirement{
			Key:      "node.kubernetes.io/instance-type",
			Operator: "In",
			Values:   instanceTypes,
		})
	}

	return requirements
}

func (s *Service) getNodeTemplateRequirements(req ConfigRequest) []Requirement {
	return []Requirement{
		{
			Key:      "kubernetes.io/arch",
			Operator: "In",
			Values:   []string{"amd64", "arm64"},
		},
		{
			Key:      "karpenter.sh/capacity-type",
			Operator: "In",
			Values:   []string{"spot", "on-demand"},
		},
	}
}

func (s *Service) getInstanceTypes(preset string) []string {
	presets := map[string][]string{
		"cost-optimized": {
			"t3.medium", "t3.large", "t3.xlarge",
			"m5.large", "m5.xlarge", "m5.2xlarge",
			"c5.large", "c5.xlarge", "c5.2xlarge",
			"c6g.large", "c6g.xlarge", // Graviton instances for cost savings
		},
		"performance": {
			"c5.xlarge", "c5.2xlarge", "c5.4xlarge",
			"c6i.xlarge", "c6i.2xlarge", "c6i.4xlarge",
			"m5.2xlarge", "m5.4xlarge", "m5.8xlarge",
		},
		"balanced": {
			"m5.large", "m5.xlarge", "m5.2xlarge",
			"c5.large", "c5.xlarge", "c5.2xlarge",
			"t3.medium", "t3.large", "t3.xlarge",
		},
	}

	if types, ok := presets[preset]; ok {
		return types
	}
	return presets["balanced"]
}

func (s *Service) getCPULimit(req ConfigRequest) string {
	limits := map[string]string{
		"cost-optimized": "1000",
		"performance":    "2000",
		"balanced":       "1500",
	}
	return limits[req.Preset]
}

func (s *Service) getMemoryLimit(req ConfigRequest) string {
	limits := map[string]string{
		"cost-optimized": "1900Gi",
		"performance":    "3800Gi",
		"balanced":       "2850Gi",
	}
	return limits[req.Preset]
}

func (s *Service) getInstanceProfile(req ConfigRequest) string {
	return "KarpenterNodeInstanceProfile"
}

func (s *Service) getLaunchTemplateName(req ConfigRequest) string {
	return fmt.Sprintf("KarpenterLaunchTemplate-%s", req.Preset)
}

func (s *Service) HandleGetClusterCost(c *gin.Context) {
	ctx := c.Request.Context()
	
	nodeInfo, err := s.k8sClient.GetNodes(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

    // Fetch pods for potential future use (not used in current cost calc)
    _, _ = s.k8sClient.GetPods(ctx)

	// Calculate current and potential costs
	costs := s.calculateCosts(nodeInfo)

	response := gin.H{
		"current": costs.current,
		"potential": costs.potential,
		"savings": costs.savings,
		"recommendations": costs.recommendations,
	}

	c.JSON(http.StatusOK, response)
}

func (s *Service) HandleGetNodes(c *gin.Context) {
	ctx := c.Request.Context()
	nodeInfo, err := s.k8sClient.GetNodes(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nodeInfo)
}

func (s *Service) HandleGetPods(c *gin.Context) {
	ctx := c.Request.Context()
	podInfo, err := s.k8sClient.GetPods(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, podInfo)
}

type CostAnalysis struct {
	current        map[string]interface{}
	potential      map[string]interface{}
	savings        map[string]interface{}
	recommendations []string
}

func (s *Service) calculateCosts(nodeInfo *k8s.NodeInfo) CostAnalysis {
	currentCost := float64(nodeInfo.OnDemandNodes) * 100.0 // Simplified pricing
	
	spotSavings := float64(nodeInfo.SpotNodes) * 70.0 // ~70% savings on spot
	potentialCost := currentCost - spotSavings
	
	savings := currentCost - potentialCost
	
	return CostAnalysis{
		current: map[string]interface{}{
			"total": currentCost,
			"ondemand": currentCost,
			"spot": 0.0,
		},
		potential: map[string]interface{}{
			"total": potentialCost,
			"ondemand": currentCost * 0.3,
			"spot": currentCost * 0.7,
		},
		savings: map[string]interface{}{
			"amount": savings,
			"percentage": (savings / currentCost) * 100,
		},
		recommendations: []string{
			fmt.Sprintf("Consider migrating %d workloads to Spot instances", nodeInfo.OnDemandNodes),
			"Enable Karpenter consolidation for better resource utilization",
			"Review instance sizing based on actual resource requirements",
		},
	}
}

func (s *Service) HandleGetRebalancingRecommendations(c *gin.Context) {
	ctx := c.Request.Context()
	nodeInfo, err := s.k8sClient.GetNodes(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

    podInfo, err := s.k8sClient.GetPods(ctx)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

	recommendations := s.generateRebalancingRecommendations(nodeInfo, podInfo)
	c.JSON(http.StatusOK, recommendations)
}

func (s *Service) HandleSimulateRebalancing(c *gin.Context) {
	// Simulate rebalancing without actually moving pods
	response := gin.H{
		"savings": gin.H{
			"amount": "$245.60",
			"percentage": 23.4,
		},
		"actions": []string{
			"Migrate 8 pods from t3.large to c6g.large instances",
			"Consolidate 3 underutilized m5.xlarge nodes",
			"Enable Spot mixing for non-critical workloads",
		},
		"estimatedTime": "2-3 hours",
	}
	
	c.JSON(http.StatusOK, response)
}

func (s *Service) generateRebalancingRecommendations(nodeInfo *k8s.NodeInfo, podInfo *k8s.PodInfo) interface{} {
	return gin.H{
		"instanceTypeOptimization": []string{
			"Consider migrating from m5.large to c6g.large for better price/performance",
			"Switch compute-intensive workloads to Graviton instances",
		},
		"spotInstanceStrategy": []string{
			"Move batch jobs and non-critical services to Spot instances",
			"Implement Spot instance diversification across multiple families",
		},
		"consolidation": []string{
			fmt.Sprintf("Consider consolidating %d pods across fewer nodes", podInfo.TotalPods),
			"Enable Karpenter consolidation to automatically resize nodes",
		},
		"estimatedSavings": gin.H{
			"monthly": "$892.30",
			"percentage": 34.2,
		},
	}
}
