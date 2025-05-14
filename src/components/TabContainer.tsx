
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataConfigTab from './DataConfigTab';
import BatchTab from './BatchTab';
import HumanInTheLoopTab from './HumanInTheLoopTab';
import HILOutputTab from './HILOutputTab';

/**
 * Main tab container for the application
 */
export default function TabContainer() {
  const [activeTab, setActiveTab] = useState("humanInTheLoop");

  return (
    <div className="w-full">
      <Tabs 
        defaultValue="humanInTheLoop" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="dataConfig">Data/Config</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="humanInTheLoop">Human In The Loop</TabsTrigger>
          <TabsTrigger value="hilOutput">HIL Output</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dataConfig">
          <DataConfigTab />
        </TabsContent>
        
        <TabsContent value="batch">
          <BatchTab />
        </TabsContent>
        
        <TabsContent value="humanInTheLoop">
          <HumanInTheLoopTab />
        </TabsContent>
        
        <TabsContent value="hilOutput">
          <HILOutputTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
