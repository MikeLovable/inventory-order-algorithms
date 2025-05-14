
import { DataSource, generateRandomProductionScenarioArray, ProductionScenarioArray, getPERIODS } from './types';

// Generate a static random ProductionScenarioArray for StaticRandom
const staticRandomPSA = generateRandomProductionScenarioArray();

// Generate a static random ProductionScenarioArray for Customer
const customerPSA = generateRandomProductionScenarioArray();

// Generate a static random ProductionScenarioArray for Scenario3
const scenario3PSA = generateRandomProductionScenarioArray();

/**
 * StaticRandom DataSource - Random data generated at build time
 */
export const StaticRandomDataSource: DataSource = {
  Name: "StaticRandom",
  Desc: "Random Generated at build time",
  ProductionScenarioArray: staticRandomPSA
};

/**
 * Customer DataSource - Random data generated at build time to be replaced
 */
export const CustomerDataSource: DataSource = {
  Name: "Customer",
  Desc: "Random Generated at build time, to be manually replaced with realistic data",
  ProductionScenarioArray: customerPSA
};

/**
 * Scenario3 DataSource - Random data generated at build time to be replaced
 */
export const Scenario3DataSource: DataSource = {
  Name: "Scenario3",
  Desc: "Random Generated at build time, to be manually replaced with realistic data",
  ProductionScenarioArray: scenario3PSA
};

/**
 * RandomDataSource - Generates random data at runtime
 */
export function RandomDataSource(): DataSource {
  return {
    Name: "Random",
    Desc: "Random regenerated at run time",
    ProductionScenarioArray: generateRandomProductionScenarioArray()
  };
}

/**
 * Collection of all available data sources
 */
export const dataSources: { [key: string]: DataSource | (() => DataSource) } = {
  "StaticRandom": StaticRandomDataSource,
  "Customer": CustomerDataSource,
  "Scenario3": Scenario3DataSource,
  "Random": RandomDataSource
};

/**
 * Gets production scenarios from a specified data source
 * @param dataSourceName - Optional name of the data source to use
 * @returns A ProductionScenarioArray from the specified data source
 */
export function GetProductionScenarios(dataSourceName?: string): ProductionScenarioArray {
  // Default to Random if no data source is specified
  const sourceName = dataSourceName || "Random";
  
  const dataSource = dataSources[sourceName];
  
  if (!dataSource) {
    throw new Error(`Unknown DataSource: ${sourceName}`);
  }
  
  if (typeof dataSource === 'function') {
    return dataSource().ProductionScenarioArray;
  }
  
  return dataSource.ProductionScenarioArray;
}
