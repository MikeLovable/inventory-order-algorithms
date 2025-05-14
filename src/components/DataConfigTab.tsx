
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import { algorithms } from '@/shared/Algorithms';
import { dataSources } from '@/shared/DataSources';

/**
 * Data Configuration Tab Component
 */
export default function DataConfigTab() {
  const { toast } = useToast();
  const { 
    apiBaseUrl, 
    setApiBaseUrl,
    periods,
    setPeriods,
    samples, 
    setSamples,
    selectedDataSource
  } = useAppContext();
  
  const [apiUrlInput, setApiUrlInput] = useState(apiBaseUrl);
  const [periodsInput, setPeriodsInput] = useState(periods.toString());
  const [samplesInput, setSamplesInput] = useState(samples.toString());
  const [scenarioJson, setScenarioJson] = useState(() => {
    return JSON.stringify(selectedDataSource.ProductionScenarioArray || [], null, 2);
  });

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrlInput);
    toast({
      title: "API URL Updated",
      description: `API URL set to: ${apiUrlInput}`
    });
  };

  const handleSavePeriods = () => {
    const newPeriods = parseInt(periodsInput);
    if (isNaN(newPeriods) || newPeriods < 1 || newPeriods > 20) {
      toast({
        variant: "destructive",
        title: "Invalid value",
        description: "Periods must be between 1 and 20"
      });
      return;
    }
    
    setPeriods(newPeriods);
    toast({
      title: "Periods Updated",
      description: `Periods set to: ${newPeriods}`
    });
  };

  const handleSaveSamples = () => {
    const newSamples = parseInt(samplesInput);
    if (isNaN(newSamples) || newSamples < 1 || newSamples > 30) {
      toast({
        variant: "destructive",
        title: "Invalid value",
        description: "Samples must be between 1 and 30"
      });
      return;
    }
    
    setSamples(newSamples);
    toast({
      title: "Samples Updated",
      description: `Samples set to: ${newSamples}`
    });
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="api-url">API Base URL</Label>
              <Input
                id="api-url"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="https://your-api-endpoint.com"
              />
            </div>
            <Button onClick={handleSaveApiUrl}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Algorithms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(algorithms).map((algo) => (
                  <tr key={algo.Name} className="hover:bg-gray-50">
                    <td className="border p-2">{algo.Name}</td>
                    <td className="border p-2">{algo.Desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dataSources).map(([key, source]) => {
                  const dataSource = typeof source === 'function' ? source() : source;
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="border p-2">{dataSource.Name}</td>
                      <td className="border p-2">{dataSource.Desc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="periods">
                PERIODS (Weeks, min=1, max=20)
              </Label>
              <Input
                id="periods"
                type="number"
                min={1}
                max={20}
                value={periodsInput}
                onChange={(e) => setPeriodsInput(e.target.value)}
              />
            </div>
            <Button onClick={handleSavePeriods}>Save</Button>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="samples">
                SAMPLES (Scenarios, min=1, max=30)
              </Label>
              <Input
                id="samples"
                type="number"
                min={1}
                max={30}
                value={samplesInput}
                onChange={(e) => setSamplesInput(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveSamples}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer-configured Production Scenarios for demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono h-80"
            value={scenarioJson}
            onChange={(e) => setScenarioJson(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
