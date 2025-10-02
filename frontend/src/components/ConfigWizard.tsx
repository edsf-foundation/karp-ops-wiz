import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Download, Settings } from 'lucide-react'

interface ConfigRequest {
  preset: string
  region: string
  zone: string
  features: Record<string, boolean>
  customizations: Record<string, any>
}

interface PresetData {
  presets: Record<string, any>
  regions: string[]
  features: Record<string, any>
}

export function ConfigWizard() {
  const [config, setConfig] = useState<ConfigRequest>({
    preset: '',
    region: '',
    zone: '',
    features: {},
    customizations: {}
  })
  const [presetData, setPresetData] = useState<PresetData | null>(null)
  const [generatedConfigs, setGeneratedConfigs] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('preset')

  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/v1/presets')
      const data = await response.json()
      setPresetData(data)
      
      // Set default settings
      setConfig(prev => ({
        ...prev,
        features: {
          consolidation: data.features.consolidation.default,
          spotInterruptionHandling: data.features.spotInterruptionHandling.default,
          nodeTerminationHandler: data.features.nodeTerminationHandler.default,
        }
      }))
    } catch (error) {
      console.error('Failed to fetch presets:', error)
    }
  }

  const handleGenerateConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      setGeneratedConfigs(data)
      setStep('results')
    } catch (error) {
      console.error('Failed to generate config:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadYaml = (config: any, filename: string) => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (config: any) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  if (!presetData) {
    return <div>Loading...</div>
  }

  if (step === 'results' && generatedConfigs) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generated Configuration</CardTitle>
            <CardDescription>
              Your Karpenter configuration has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Alert>
                <AlertDescription>
                  <strong>Next Steps:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    {generatedConfigs.summary.instructions.map((instruction: string, idx: number) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Provisioner Configuration</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedConfigs.provisioner)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Provisioner
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadYaml(generatedConfigs.provisioner, 'provisioner.yaml')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Node Template Configuration</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedConfigs.nodeTemplate)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy NodeTemplate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadYaml(generatedConfigs.nodeTemplate, 'node-template.yaml')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep('preset')} variant="outline">
                Generate New Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Karpenter Configuration Wizard
          </CardTitle>
          <CardDescription>
            Generate optimized Karpenter Provisioner and NodeTemplate configurations for AWS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>Preset Configuration</Label>
              <Select value={config.preset} onValueChange={(value) => setConfig(prev => ({ ...prev, preset: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset configuration" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(presetData.presets).map(([key, preset]: [string, any]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-muted-foreground">{preset.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>AWS Region</Label>
                <Select value={config.region} onValueChange={(value) => setConfig(prev => ({ ...prev, region: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetData.regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability Zone</Label>
                <Select 
                  value={config.zone} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, zone: value }))}
                  disabled={!config.region}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.region && [
                      `${config.region}a`,
                      `${config.region}b`,
                      `${config.region}c`,
                      `${config.region}d`
                    ].map(zone => (
                      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Advanced Features</Label>
              <div className="space-y-3">
                {Object.entries(presetData.features).map(([key, feature]: [string, any]) => (
                  <div className="flex items-center justify-between" key={key}>
                    <div className="space-y-1">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Switch
                      id={key}
                      checked={config.features[key] || false}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        features: { ...prev.features, [key]: checked }
                      }))}
                    />
            </div>
                ))}
              </div>
            </div>

            {config.preset && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview: {presetData.presets[config.preset]?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>{presetData.presets[config.preset]?.description}</p>
                    <div>
                      <h4 className="font-medium mb-2">Features:</h4>
                      <ul className="list-disc ml-4 space-y-1">
                        {presetData.presets[config.preset]?.features.map((feature: string, idx: number) => (
                          <li key={idx} className="text-sm">{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Spot Instance Ratio:</strong> {presetData.presets[config.preset]?.spotRatio}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleGenerateConfig}
              disabled={!config.preset || !config.region || !config.zone || loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
