
import React from 'react';
import Header from '@/components/Header';
import TabContainer from '@/components/TabContainer';
import { AppProvider } from '@/context/AppContext';

const Index = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <TabContainer />
        </div>
      </div>
    </AppProvider>
  );
};

export default Index;
