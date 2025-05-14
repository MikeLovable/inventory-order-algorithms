
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getPERIODS, 
  setPERIODS, 
  getSAMPLES, 
  setSAMPLES,
  getSELECTEDDATASOURCE, 
  setSELECTEDDATASOURCE,
  getSELECTEDALGORITHM,
  setSELECTEDALGORITHM,
  DataSource,
  ProductionScenarioArray,
  OrderScheduleArray,
  PERIODS_DEFAULT,
  SAMPLES_DEFAULT
} from '@/shared/types';
import { SmartReplenishAlgorithm, algorithms } from '@/shared/Algorithms';
import { RandomDataSource, dataSources } from '@/shared/DataSources';

interface AppContextType {
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  periods: number;
  setPeriods: (value: number) => void;
  samples: number;
  setSamples: (value: number) => void;
  selectedDataSource: DataSource;
  setSelectedDataSource: (source: DataSource) => void;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (name: string) => void;
  productionScenarios: ProductionScenarioArray;
  setProductionScenarios: (scenarios: ProductionScenarioArray) => void;
  orderSchedules: OrderScheduleArray;
  setOrderSchedules: (schedules: OrderScheduleArray) => void;
  manualOrderSchedules: OrderScheduleArray;
  setManualOrderSchedules: (schedules: OrderScheduleArray) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load API URL from cookie
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    const saved = localStorage.getItem('apiBaseUrl');
    return saved || 'https://api-url-not-set.com';
  });

  const [periods, setPeriodState] = useState(getPERIODS());
  const [samples, setSamplesState] = useState(getSAMPLES());
  
  const [selectedDataSource, setSelectedDataSourceState] = useState<DataSource>(() => {
    const currentDataSource = getSELECTEDDATASOURCE();
    return Object.keys(currentDataSource).length ? 
           currentDataSource : 
           RandomDataSource();
  });

  const [selectedAlgorithm, setSelectedAlgorithmState] = useState<string>(() => {
    const currentAlgo = getSELECTEDALGORITHM();
    return Object.keys(currentAlgo).length ? 
           currentAlgo.Name : 
           'SmartReplenish';
  });

  const [productionScenarios, setProductionScenarios] = useState<ProductionScenarioArray>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderScheduleArray>([]);
  const [manualOrderSchedules, setManualOrderSchedules] = useState<OrderScheduleArray>([]);

  // Update the API URL in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('apiBaseUrl', apiBaseUrl);
  }, [apiBaseUrl]);

  // Custom setters that update both state and global variables
  const setPeriods = (value: number) => {
    setPERIODS(value);
    setPeriodState(getPERIODS());
  };

  const setSamples = (value: number) => {
    setSAMPLES(value);
    setSamplesState(getSAMPLES());
  };

  const setSelectedDataSource = (source: DataSource) => {
    setSELECTEDDATASOURCE(source);
    setSelectedDataSourceState(source);
  };

  const setSelectedAlgorithm = (name: string) => {
    const algo = algorithms[name];
    if (algo) {
      setSELECTEDALGORITHM(algo);
      setSelectedAlgorithmState(name);
    }
  };

  // Set initial values
  useEffect(() => {
    // Set default algorithm
    if (selectedAlgorithm === 'SmartReplenish' && !getSELECTEDALGORITHM().Name) {
      setSELECTEDALGORITHM(SmartReplenishAlgorithm);
    }
    
    // Set default data source if not already set
    if (!selectedDataSource.Name) {
      const randomSource = RandomDataSource();
      setSelectedDataSource(randomSource);
      setProductionScenarios(randomSource.ProductionScenarioArray);
    } else {
      setProductionScenarios(selectedDataSource.ProductionScenarioArray);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      apiBaseUrl,
      setApiBaseUrl,
      periods,
      setPeriods,
      samples,
      setSamples,
      selectedDataSource,
      setSelectedDataSource,
      selectedAlgorithm,
      setSelectedAlgorithm,
      productionScenarios,
      setProductionScenarios,
      orderSchedules,
      setOrderSchedules,
      manualOrderSchedules,
      setManualOrderSchedules
    }}>
      {children}
    </AppContext.Provider>
  );
};
