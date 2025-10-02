package k8s

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

type K8sClient struct {
	clientset *kubernetes.Clientset
	config    *rest.Config
}

func NewK8sClient() (*K8sClient, error) {
	var config *rest.Config
	var err error

	// Try in-cluster config first
	config, err = rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig
		var kubeconfig string
		if home := homedir.HomeDir(); home != "" {
			kubeconfig = filepath.Join(home, ".kube", "config")
		}
		if kubeconfigEnv := os.Getenv("KUBECONFIG"); kubeconfigEnv != "" {
			kubeconfig = kubeconfigEnv
		}

		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to build kubeconfig: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	return &K8sClient{
		clientset: clientset,
		config:    config,
	}, nil
}

func (c *K8sClient) GetNodes(ctx context.Context) (*NodeInfo, error) {
	nodes, err := c.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	var totalCPU, totalMemory int64
	var spotNodes, onDemandNodes int
	nodeDetails := []NodeDetails{}

	for _, node := range nodes.Items {
		nodeDetail := NodeDetails{
			Name:      node.Name,
			InstanceType: c.getInstanceTypeFromLabels(node.Labels),
			Region:    c.getRegionFromLabels(node.Labels),
			Zone:      c.getZoneFromLabels(node.Labels),
			IsSpot:    c.isSpotInstance(node.Labels),
			State:     string(node.Status.Conditions[0].Type),
		}

		// Extract CPU and memory from resources
		if cpu, ok := node.Status.Capacity["cpu"]; ok {
			if cpuMilli, err := cpu.AsInt64(); err == nil {
				totalCPU += cpuMilli
				nodeDetail.CPUCores = cpuMilli / 1000
			}
		}

		if memory, ok := node.Status.Capacity["memory"]; ok {
			if memoryBytes, err := memory.AsInt64(); err == nil {
				totalMemory += memoryBytes
				nodeDetail.MemoryGB = memoryBytes / (1024 * 1024 * 1024)
			}
		}

		if nodeDetail.IsSpot {
			spotNodes++
		} else {
			onDemandNodes++
		}

		nodeDetails = append(nodeDetails, nodeDetail)
	}

	return &NodeInfo{
		TotalNodes:    len(nodes.Items),
		SpotNodes:     spotNodes,
		OnDemandNodes: onDemandNodes,
		TotalCPU:      totalCPU / 1000, // Convert to cores
		TotalMemory:   totalMemory,
		Nodes:         nodeDetails,
	}, nil
}

func (c *K8sClient) GetPods(ctx context.Context) (*PodInfo, error) {
	pods, err := c.clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	var totalCPU, totalMemory int64
	podDetails := []PodDetails{}

	for _, pod := range pods.Items {
		podDetail := PodDetails{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			NodeName:  pod.Spec.NodeName,
			Status:    string(pod.Status.Phase),
		}

		// Calculate resource requests
		var podCPU, podMemory int64
		for _, container := range pod.Spec.Containers {
			if cpu, ok := container.Resources.Requests["cpu"]; ok {
				if cpuMilli, err := cpu.AsInt64(); err == nil {
					podCPU += cpuMilli
				}
			}
			if memory, ok := container.Resources.Requests["memory"]; ok {
				if memoryBytes, err := memory.AsInt64(); err == nil {
					podMemory += memoryBytes
				}
			}
		}

		podDetail.CPURequest = podCPU
		podDetail.MemoryRequest = podMemory
		totalCPU += podCPU
		totalMemory += podMemory

		podDetails = append(podDetails, podDetail)
	}

	return &PodInfo{
		TotalPods:  len(pods.Items),
		TotalCPU:   totalCPU,
		TotalMemory: totalMemory,
		Pods:       podDetails,
	}, nil
}

func (c *K8sClient) getInstanceTypeFromLabels(labels map[string]string) string {
	if instanceType, ok := labels["node.kubernetes.io/instance-type"]; ok {
		return instanceType
	}
	return "unknown"
}

func (c *K8sClient) getRegionFromLabels(labels map[string]string) string {
	if region, ok := labels["topology.kubernetes.io/region"]; ok {
		return region
	}
	return "unknown"
}

func (c *K8sClient) getZoneFromLabels(labels map[string]string) string {
	if zone, ok := labels["topology.kubernetes.io/zone"]; ok {
		return zone
	}
	return "unknown"
}

func (c *K8sClient) isSpotInstance(labels map[string]string) bool {
	spotLabels := []string{
		"karpenter.sh/capacity-type",
		"node.kubernetes.io/instance-type-price-type",
		"spot.amazonaws.com/cn",
	}
	
	for _, label := range spotLabels {
		if labels[label] == "spot" {
			return true
		}
	}
	return false
}

// Data structures for API responses
type NodeInfo struct {
	TotalNodes    int          `json:"totalNodes"`
	SpotNodes     int          `json:"spotNodes"`
	OnDemandNodes int          `json:"onDemandNodes"`
	TotalCPU      int64        `json:"totalCpu"`
	TotalMemory   int64        `json:"totalMemory"`
	Nodes         []NodeDetails `json:"nodes"`
}

type NodeDetails struct {
	Name         string `json:"name"`
	InstanceType string `json:"instanceType"`
	Region       string `json:"region"`
	Zone         string `json:"zone"`
	IsSpot       bool   `json:"isSpot"`
	State        string `json:"state"`
	CPUCores     int64  `json:"cpuCores"`
	MemoryGB     int64  `json:"memoryGb"`
}

type PodInfo struct {
	TotalPods   int         `json:"totalPods"`
	TotalCPU    int64       `json:"totalCpu"`
	TotalMemory int64       `json:"totalMemory"`
	Pods        []PodDetails `json:"pods"`
}

type PodDetails struct {
	Name          string `json:"name"`
	Namespace     string `json:"namespace"`
	NodeName      string `json:"nodeName"`
	Status        string `json:"status"`
	CPURequest    int64  `json:"cpuRequest"`
	MemoryRequest int64  `json:"memoryRequest"`
}
