
import React, { useState } from 'react';
import DataSourceSelector from './DataSourceSelector';
import AlgorithmSelector from './AlgorithmSelector';
import OrderScheduleTable from './OrderScheduleTable';
import { useAppContext } from '@/context/AppContext';

/**
 * Batch operations tab component
 */
export default function BatchTab() {
  const { orderSchedules } = useAppContext();
  
  return (
    <div className="space-y-6 p-4">
      <DataSourceSelector />
      <AlgorithmSelector />
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Order Schedule Results</h2>
        <OrderScheduleTable orderSchedules={orderSchedules} />
      </div>
    </div>
  );
}
