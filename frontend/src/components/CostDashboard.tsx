import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Cpu, HardDrive, TrendingUp as TrendingUpIcon } from 'lucide-react'

interface CostData {
  current: {
    total: number
    ondemand: number
    spot: number
  }
  potential: {
    total: number
    ondemand: number
    spot: number
  }
  savings: {
    amount: number
    percentage: number
  }
  recommendations: string[]
}

interface NodeData {
  totalNodes: number
  spotNodes: number
  onDemandNodes: number
  totalCpu: number
  totalMemory: number
  nodes: NodeInfo[]
}

interface NodeInfo {
  name: string
  instanceType: string
  region: string
  zone: string
  isSpot: boolean
  state: string
  cpuCores: number
  memoryGb: number
}

export function CostDashboard() {
  const [costData, setCostData] = useState<CostData | null>(null)
  const [nodeData, setNodeData] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  // const [timeframe, setTimeframe] = useState('30d')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [costResponse, nodeResponse] = await Promise.all([
        fetch('/api/v1/cluster/cost'),
        fetch('/api/v1/cluster/nodes')
      ])

      const costJson = await costResponse.json()
      const nodeJson = await nodeResponse.json()

      setCostData(costJson)
      setNodeData(nodeJson)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>
  }

  if (!costData || !nodeData) {
    return <div className="text-center text-muted-foreground">Failed to load dashboard data</div>
  }

  // Mock historical data for the charts
  const historicalData = [
    { date: 'Day 1', current: costData.current.total, optimized: costData.potential.total },
    { date: 'Day 7', current: costData.current.total + 50, optimized: costData.potential.total + 20 },
    { date: 'Day 14', current: costData.current.total + 100, optimized: costData.potential.total + 40 },
    { date: 'Day 21', current: costData.current.total + 150, optimized: costData.potential.total + 60 },
    { date: 'Day 30', current: costData.current.total + 200, optimized: costData.potential.total + 80 },
  ]

  const spotDistributionData = [
    { name: 'On-Demand', value: nodeData.onDemandNodes, color: '#ef4444' },
    { name: 'Spot', value: nodeData.spotNodes, color: '#22c55e' },
  ]

  const instanceTypeData = nodeData.nodes.reduce((acc, node) => {
    const existing = acc.find(item => item.instanceType === node.instanceType)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ instanceType: node.instanceType, count: 1, isSpot: node.isSpot })
    }
    return acc
  }, [] as Array<{ instanceType: string, count: number, isSpot: boolean }>)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costData.current.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              On-demand: ${costData.current.ondemand.toFixed(2)} • Spot: ${costData.current.spot.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${costData.savings.amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {costData.savings.percentage.toFixed(1)}% monthly reduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeData.totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              Spot: {nodeData.spotNodes} • On-demand: {nodeData.onDemandNodes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb--2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeData.totalCpu} cores</div>
            <p className="text-xs text-muted-foreground">
              {nodeData.totalMemory} GB memory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost Savings Over Time</CardTitle>
            <CardDescription>
              Projected savings with optimized configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Cost']}
                  labelStyle={{ color: '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="optimized" 
                  stackId="1" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Current Cost</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Optimized Cost</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instance Distribution</CardTitle>
            <CardDescription>
              Current Spot vs On-Demand instance ratio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spotDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {spotDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>On-Demand ({nodeData.onDemandNodes})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Spot ({nodeData.spotNodes})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instance Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Types Overview</CardTitle>
          <CardDescription>
            Current instance types and their distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instanceTypeData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.isSpot ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="font-medium">{item.instanceType}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.isSpot ? 'Spot Instance' : 'On-Demand Instance'}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold">{item.count} nodes</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Recommendations</CardTitle>
          <CardDescription>
            Actionable insights to reduce your cluster costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {costData.recommendations.map((recommendation, idx) => (
            <Alert key={idx}>
              <TrendingUpIcon className="h-4 w-4" />
              <AlertDescription>{recommendation}</AlertDescription>
            </Alert>
          ))}
          <Button className="w-full mt-4">
            Apply Recommendations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
