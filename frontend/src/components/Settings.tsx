import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings as SettingsIcon, Database, Shield } from 'lucide-react'

export function Settings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure KarpOps-Wiz behavior and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="cost-dashboard" className="text-sm font-medium">
                  Cost Dashboard
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable real-time cost monitoring and analysis
                </p>
              </div>
              <Switch id="cost-dashboard" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="rebalancing" className="text-sm font-medium">
                  Rebalancing Recommendations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show automated rebalancing suggestions
                </p>
              </div>
              <Switch id="rebalancing" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="pricing-simulation" className="text-sm font-medium">
                  Pricing Simulation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable cost estimation and simulation features
                </p>
              </div>
              <Switch id="pricing-simulation" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications" className="text-sm font-medium">
                  Cost Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for significant cost changes
                </p>
              </div>
              <Switch id="notifications" />
            </div>
          </div>

          <Button className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sources
          </CardTitle>
          <CardDescription>
            Configure data source connections and refresh rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Pricing Data Refresh Rate</Label>
            <p className="text-sm text-muted-foreground">
              How often to fetch updated AWS pricing information
            </p>
            <select className="w-full p-2 border rounded-md">
              <option value="hourly">Every Hour</option>
              <option value="daily" selected>Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Cluster Metrics Refresh Rate</Label>
            <p className="text-sm text-muted-foreground">
              How often to update cluster resource utilization data
            </p>
            <select className="w-full p-2 border rounded-md">
              <option value="5min" selected>Every 5 Minutes</option>
              <option value="15min">Every 15 Minutes</option>
              <option value="30min">Every 30 Minutes</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>

          <Button variant="outline" className="w-full">
            Refresh Data Sources Now
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Access
          </CardTitle>
          <CardDescription>
            Configure RBAC and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Service Account Permissions</Label>
            <p className="text-sm text-muted-foreground">
              Current permissions scope for KarpOps-Wiz service account
            </p>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Read cluster nodes and pods</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-600">✓</span>
                  <span>Read Karpenter provisioners</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-600">⚠</span>
                  <span>Modify Karpenter configurations (Requires admin approval)</span>
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Request Additional Permissions
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
