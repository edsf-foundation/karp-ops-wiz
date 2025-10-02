import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react'

interface RebalancingRecommendations {
  instanceTypeOptimization: string[]
  spotInstanceStrategy: string[]
  consolidation: string[]
  estimatedSavings: {
    monthly: string
    percentage: number
  }
}

interface SimulationResult {
  savings: {
    amount: string
    percentage: number
  }
  actions: string[]
  estimatedTime: string
}

export function RebalancerView() {
  const [recommendations, setRecommendations] = useState<RebalancingRecommendations | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/recommendations/rebalancing')
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Failed to fetch rebalancing recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = async () => {
    setSimulating(true)
    try {
      const response = await fetch('/api/v1/simulate/rebalancing', {
        method: 'POST'
      })
      const data = await response.json()
      setSimulationResult(data)
    } catch (error) {
      console.error('Failed to run simulation:', error)
    } finally {
      setSimulating(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading recommendations...</div>
  }

  if (!recommendations) {
    return <div className="text-center text-muted-foreground">Failed to load recommendations</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cluster Rebalancing</CardTitle>
              <CardDescription>
                Optimize your cluster for better cost efficiency and resource utilization
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecommendations}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{recommendations.estimatedSavings.monthly}</div>
              <div className="text-sm text-muted-foreground">Estimated Monthly Savings</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{recommendations.estimatedSavings.percentage}%</div>
              <div className="text-sm text-muted-foreground">Cost Reduction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instance Type Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.instanceTypeOptimization.map((recommendation, idx) => (
              <Alert key={idx}>
                <ArrowRight className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  {recommendation}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spot Instance Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.spotInstanceStrategy.map((recommendation, idx) => (
              <Alert key={idx}>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  {recommendation}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consolidation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.consolidation.map((recommendation, idx) => (
              <Alert key={idx}>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  {recommendation}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Simulation */}
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing Simulation</CardTitle>
          <CardDescription>
            Preview the impact of rebalancing your cluster without making changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runSimulation} disabled={simulating} className="w-full">
            {simulating ? 'Running Simulation...' : 'Run Rebalancing Simulation'}
          </Button>

          {simulationResult && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Simulation Complete!</strong> Below are the results of the rebalancing analysis.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">{simulationResult.savings.amount}</div>
                  <div className="text-sm text-muted-foreground">Estimated Savings</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold">{simulationResult.savings.percentage}%</div>
                  <div className="text-sm text-muted-foreground">Cost Reduction</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold">{simulationResult.estimatedTime}</div>
                  <div className="text-sm text-muted-foreground">Estimated Time</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommended Actions:</h4>
                <ul className="space-y-2">
                  {simulationResult.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This is a simulation only. No actual changes have been made to your cluster. 
                      Review the recommendations carefully before applying them manually or through Karpenter configurations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline">Export Recommendations</Button>
                <Button onClick={() => { window.location.href = '/#wizard' }}>
                  Generate Karpenter Config
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
