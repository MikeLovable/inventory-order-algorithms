
import React, { useEffect, useRef } from 'react';
import DataSourceSelector from './DataSourceSelector';
import AlgorithmSelector from './AlgorithmSelector';
import ProductionScenarioTable from './ProductionScenarioTable';
import HILOrderScheduleTable from './HILOrderScheduleTable';
import { useAppContext } from '@/context/AppContext';
import { ProductionScenarioArray, OrderScheduleArray } from '@/shared/types';

/**
 * Human In The Loop operations tab component
 */
export default function HumanInTheLoopTab() {
  const { 
    productionScenarios, 
    setProductionScenarios,
    hilOrderSchedules,
    setHILOrderSchedules
  } = useAppContext();
  
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Handle scenario selection changes
  const handleScenarioSelectionChange = (updatedScenarios: ProductionScenarioArray) => {
    setProductionScenarios(updatedScenarios);
  };
  
  // Handle order schedule changes in HIL mode
  const handleOrderSchedulesChange = (updatedSchedules: OrderScheduleArray) => {
    setHILOrderSchedules(updatedSchedules);
  };
  
  // Handle algorithm generation of order schedules
  const handleOrderSchedulesGenerated = (schedules: OrderScheduleArray) => {
    setHILOrderSchedules(schedules);
    
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
      
      <AlgorithmSelector 
        onOrderSchedulesGenerated={handleOrderSchedulesGenerated}
        selectedOnly={true}
      />
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Production Scenarios</h2>
        <ProductionScenarioTable 
          scenarios={productionScenarios} 
          onScenarioSelectionChange={handleScenarioSelectionChange}
        />
      </div>
      
      <div ref={resultRef} className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Human In The Loop Order Schedule</h2>
        {hilOrderSchedules.length > 0 ? (
          <HILOrderScheduleTable 
            orderSchedules={hilOrderSchedules}
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
