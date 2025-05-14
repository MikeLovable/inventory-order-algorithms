
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { algorithms } from '@/shared/Algorithms';
import { useAppContext } from '@/context/AppContext';
import { OrderScheduleArray } from '@/shared/types';

interface AlgorithmSelectorProps {
  onOrderSchedulesGenerated?: (schedules: OrderScheduleArray) => void;
  selectedOnly?: boolean;
}

/**
 * Algorithm selector component with local and API calculation buttons
 */
export default function AlgorithmSelector({ onOrderSchedulesGenerated, selectedOnly = false }: AlgorithmSelectorProps) {
  const { toast } = useToast();
  const { 
    apiBaseUrl,
    selectedAlgorithm,
    setSelectedAlgorithm,
    productionScenarios,
    setOrderSchedules
  } = useAppContext();
  
  const [isLoading, setIsLoading] = useState({
    local: false,
    api: false
  });

  const handleSelectChange = (value: string) => {
    setSelectedAlgorithm(value);
  };

  const handleGetLocalOrders = () => {
    try {
      setIsLoading({ local: true, api: false });
      const startTime = performance.now();
      
      // Filter scenarios if selectedOnly is true
      const scenariosToProcess = selectedOnly 
        ? productionScenarios.filter(scenario => scenario.Sel)
        : productionScenarios;
      
      // If selectedOnly and none are selected, show warning
      if (selectedOnly && scenariosToProcess.length === 0) {
        toast({
          variant: "destructive",
          title: "No scenarios selected",
          description: "Please select at least one production scenario"
        });
        setIsLoading({ local: false, api: false });
        return;
      }
      
      const algo = algorithms[selectedAlgorithm];
      if (!algo) {
        throw new Error(`Algorithm ${selectedAlgorithm} not found`);
      }
      
      const schedules = algo.calculateOrderScheduleArray(scenariosToProcess);
      setOrderSchedules(schedules);
      
      // If callback provided, call it with the new schedules
      if (onOrderSchedulesGenerated) {
        onOrderSchedulesGenerated(schedules);
      }
      
      const endTime = performance.now();
      
      toast({
        title: "Success: Orders Calculated Locally",
        description: `Generated ${schedules.length} order schedules in ${(endTime - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error: Local Calculation Failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading({ local: false, api: false });
    }
  };

  const handleGetApiOrders = async () => {
    try {
      setIsLoading({ local: false, api: true });
      const startTime = performance.now();
      
      // Filter scenarios if selectedOnly is true
      const scenariosToProcess = selectedOnly 
        ? productionScenarios.filter(scenario => scenario.Sel)
        : productionScenarios;
      
      // If selectedOnly and none are selected, show warning
      if (selectedOnly && scenariosToProcess.length === 0) {
        toast({
          variant: "destructive",
          title: "No scenarios selected",
          description: "Please select at least one production scenario"
        });
        setIsLoading({ local: false, api: false });
        return;
      }
      
      const response = await fetch(`${apiBaseUrl}/GetOrders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productionScenarios: scenariosToProcess,
          algorithmName: selectedAlgorithm
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const schedules: OrderScheduleArray = await response.json();
      setOrderSchedules(schedules);
      
      // If callback provided, call it with the new schedules
      if (onOrderSchedulesGenerated) {
        onOrderSchedulesGenerated(schedules);
      }
      
      const endTime = performance.now();
      
      toast({
        title: "Success: Orders Calculated via API",
        description: `Generated ${schedules.length} order schedules in ${(endTime - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error: API Calculation Failed",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading({ local: false, api: false });
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-purple-50 rounded-md">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium mb-1">Select Algorithm:</label>
        <Select value={selectedAlgorithm} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select algorithm" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(algorithms).map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleGetLocalOrders} 
          disabled={isLoading.local || isLoading.api || productionScenarios.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading.local ? "Calculating..." : "Get Local Order Recommendations"}
        </Button>
        
        <Button 
          onClick={handleGetApiOrders} 
          disabled={isLoading.local || isLoading.api || productionScenarios.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading.api ? "Calculating..." : "Get API Order Recommendations"}
        </Button>
      </div>
    </div>
  );
}
