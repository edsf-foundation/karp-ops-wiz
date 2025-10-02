import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfigWizard } from '@/components/ConfigWizard'
import { CostDashboard } from '@/components/CostDashboard'
import { RebalancingView } from '@/components/RebalancingView'
import { Settings } from '@/components/Settings'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('wizard')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KarpOps-Wiz</h1>
            <p className="text-muted-foreground mt-2">
              Kubernetes Cost Optimization Tool with Karpenter Integration
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Connected to Cluster</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wizard">Config Wizard</TabsTrigger>
            <TabsTrigger value="dashboard">Cost Dashboard</TabsTrigger>
            <TabsTrigger value="rebalancing">Rebalancing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="wizard" className="space-y-6">
            <ConfigWizard />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <CostDashboard />
          </TabsContent>

          <TabsContent value="rebalancing" className="space-y-6">
            <RebalancingView />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
