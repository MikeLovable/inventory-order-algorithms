
import React, { useEffect, useRef } from 'react';
import DataSourceSelector from './DataSourceSelector';
import AlgorithmSelector from './AlgorithmSelector';
import ProductionScenarioTable from './ProductionScenarioTable';
import ManualOrderScheduleTable from './ManualOrderScheduleTable';
import { useAppContext } from '@/context/AppContext';
import { ProductionScenarioArray, OrderScheduleArray } from '@/shared/types';

/**
 * Manual operations tab component
 */
export default function ManualTab() {
  const { 
    productionScenarios, 
    setProductionScenarios,
    manualOrderSchedules,
    setManualOrderSchedules
  } = useAppContext();
  
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Handle scenario selection changes
  const handleScenarioSelectionChange = (updatedScenarios: ProductionScenarioArray) => {
    setProductionScenarios(updatedScenarios);
  };
  
  // Handle order schedule changes in manual mode
  const handleOrderSchedulesChange = (updatedSchedules: OrderScheduleArray) => {
    setManualOrderSchedules(updatedSchedules);
  };
  
  // Handle algorithm generation of order schedules
  const handleOrderSchedulesGenerated = (schedules: OrderScheduleArray) => {
    setManualOrderSchedules(schedules);
    
    // Scroll to the results after a short delay
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  return (
    <div className="space-y-6 p-4">
      <DataSourceSelector />
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Production Scenarios</h2>
        <ProductionScenarioTable 
          scenarios={productionScenarios} 
          onScenarioSelectionChange={handleScenarioSelectionChange}
        />
      </div>
      
      <AlgorithmSelector 
        onOrderSchedulesGenerated={handleOrderSchedulesGenerated}
        selectedOnly={true}
      />
      
      <div ref={resultRef} className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Manual Order Schedule</h2>
        {manualOrderSchedules.length > 0 ? (
          <ManualOrderScheduleTable 
            orderSchedules={manualOrderSchedules}
            onOrderSchedulesChange={handleOrderSchedulesChange}
          />
        ) : (
          <p className="text-gray-500 text-center py-4">
            Select scenarios and run an algorithm to generate order schedules
          </p>
        )}
      </div>
    </div>
  );
}
