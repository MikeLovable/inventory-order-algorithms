
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataConfigTab from './DataConfigTab';
import BatchTab from './BatchTab';
import ManualTab from './ManualTab';
import ManualOutputTab from './ManualOutputTab';

/**
 * Main tab container for the application
 */
export default function TabContainer() {
  const [activeTab, setActiveTab] = useState("manual");

  return (
    <div className="w-full">
      <Tabs 
        defaultValue="manual" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="dataConfig">Data/Config</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="manualOutput">ManualOutput</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dataConfig">
          <DataConfigTab />
        </TabsContent>
        
        <TabsContent value="batch">
          <BatchTab />
        </TabsContent>
        
        <TabsContent value="manual">
          <ManualTab />
        </TabsContent>
        
        <TabsContent value="manualOutput">
          <ManualOutputTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
