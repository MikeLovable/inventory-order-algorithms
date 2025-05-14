
import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ProductionScenarioArray,
  OrderScheduleArray,
  DataSource,
  setPERIODS,
  setSAMPLES,
  setSELECTEDDATASOURCE,
  setSELECTEDALGORITHM,
  getPERIODS,
  getSAMPLES,
  generateRandomProductionScenarioArray
} from '@/shared/types';
import { algorithms } from '@/shared/Algorithms';
import { dataSources } from '@/shared/DataSources';

// Define the context type
interface AppContextType {
  productionScenarios: ProductionScenarioArray;
  setProductionScenarios: React.Dispatch<React.SetStateAction<ProductionScenarioArray>>;
  
  orderSchedules: OrderScheduleArray;
  setOrderSchedules: React.Dispatch<React.SetStateAction<OrderScheduleArray>>;
  
  hilOrderSchedules: OrderScheduleArray;
  setHILOrderSchedules: React.Dispatch<React.SetStateAction<OrderScheduleArray>>;
  
  periods: number;
  setPeriods: (periods: number) => void;
  
  samples: number;
  setSamples: (samples: number) => void;
  
  selectedDataSource: string;
  setSelectedDataSource: (source: string) => void;
  
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algorithm: string) => void;
}

// Create context with a default empty state
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State for production scenarios
  const [productionScenarios, setProductionScenarios] = useState<ProductionScenarioArray>(
    generateRandomProductionScenarioArray()
  );
  
  // State for order schedules (batch)
  const [orderSchedules, setOrderSchedules] = useState<OrderScheduleArray>([]);
  
  // State for human-in-the-loop order schedules
  const [hilOrderSchedules, setHILOrderSchedules] = useState<OrderScheduleArray>([]);
  
  // State for periods
  const [periods, setPeriodsState] = useState<number>(getPERIODS());
  
  // State for samples
  const [samples, setSamplesState] = useState<number>(getSAMPLES());
  
  // State for selected data source
  const [selectedDataSource, setSelectedDataSourceState] = useState<string>("Random");
  
  // State for selected algorithm
  const [selectedAlgorithm, setSelectedAlgorithmState] = useState<string>("SmartReplenish");
  
  // Wrap the setState functions to also update global values
  const setPeriods = (value: number) => {
    setPERIODS(value);
    setPeriodsState(value);
  };
  
  const setSamples = (value: number) => {
    setSAMPLES(value);
    setSamplesState(value);
  };
  
  const setSelectedDataSource = (value: string) => {
    if (dataSources[value]) {
      const source = typeof dataSources[value] === 'function' ? dataSources[value]() : dataSources[value];
      setSELECTEDDATASOURCE(source);
      setSelectedDataSourceState(value);
      
      // Update production scenarios from data source
      setProductionScenarios(source.ProductionScenarioArray);
    }
  };
  
  const setSelectedAlgorithm = (value: string) => {
    if (algorithms[value]) {
      setSELECTEDALGORITHM(algorithms[value]);
      setSelectedAlgorithmState(value);
    }
  };
  
  // Initialize with default data source and algorithm
  React.useEffect(() => {
    setSelectedDataSource(selectedDataSource);
    setSelectedAlgorithm(selectedAlgorithm);
  }, []);
  
  // Create the context value object
  const contextValue: AppContextType = {
    productionScenarios,
    setProductionScenarios,
    orderSchedules,
    setOrderSchedules,
    hilOrderSchedules,
    setHILOrderSchedules,
    periods,
    setPeriods,
    samples,
    setSamples,
    selectedDataSource,
    setSelectedDataSource,
    selectedAlgorithm,
    setSelectedAlgorithm,
  };
  
  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
