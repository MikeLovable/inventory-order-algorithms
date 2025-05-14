
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { dataSources, GetProductionScenarios } from '@/shared/DataSources';
import { useAppContext } from '@/context/AppContext';

interface DataSourceSelectorProps {
  onDataSourceChange?: (dataSource: string) => void;
}

/**
 * DataSource selector component with local and API fetch buttons
 */
export default function DataSourceSelector({ onDataSourceChange }: DataSourceSelectorProps) {
  const { toast } = useToast();
  const { 
    apiBaseUrl,
    selectedDataSource, 
    setSelectedDataSource, 
    setProductionScenarios 
  } = useAppContext();
  
  const [selectedName, setSelectedName] = useState(selectedDataSource.Name || 'Random');
  const [isLoading, setIsLoading] = useState({
    local: false,
    api: false
  });

  const handleSelectChange = (value: string) => {
    setSelectedName(value);
    if (onDataSourceChange) {
      onDataSourceChange(value);
    }
  };

  const handleGetLocalScenarios = () => {
    try {
      setIsLoading({ local: true, api: false });
      const startTime = performance.now();
      
      const scenarios = GetProductionScenarios(selectedName);
      const source = typeof dataSources[selectedName] === 'function' 
        ? (dataSources[selectedName] as Function)() 
        : dataSources[selectedName];
        
      setSelectedDataSource(source as any);
      setProductionScenarios(scenarios);
      
      const endTime = performance.now();
      
      toast({
        title: "Success: Local Scenarios Retrieved",
        description: `Retrieved ${scenarios.length} scenarios in ${(endTime - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error: Local Retrieval Failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading({ local: false, api: false });
    }
  };

  const handleGetApiScenarios = async () => {
    try {
      setIsLoading({ local: false, api: true });
      const startTime = performance.now();
      
      const response = await fetch(`${apiBaseUrl}/GetProductionScenarios?DataSource=${selectedName}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProductionScenarios(data);
      
      // Update selected data source with fetched data
      const source = typeof dataSources[selectedName] === 'function' 
        ? (dataSources[selectedName] as Function)() 
        : dataSources[selectedName];
      
      if (source) {
        const updatedSource = {
          ...source as any,
          ProductionScenarioArray: data
        };
        setSelectedDataSource(updatedSource);
      }
      
      const endTime = performance.now();
      
      toast({
        title: "Success: API Scenarios Retrieved",
        description: `Retrieved ${data.length} scenarios in ${(endTime - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error: API Retrieval Failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading({ local: false, api: false });
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-blue-50 rounded-md">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium mb-1">Select Data Source:</label>
        <Select value={selectedName} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select data source" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(dataSources).map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleGetLocalScenarios} 
          disabled={isLoading.local || isLoading.api}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading.local ? "Loading..." : "Get Local Scenarios"}
        </Button>
        
        <Button 
          onClick={handleGetApiScenarios} 
          disabled={isLoading.local || isLoading.api}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading.api ? "Loading..." : "Get API Scenarios"}
        </Button>
      </div>
    </div>
  );
}
