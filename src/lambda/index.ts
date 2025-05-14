
import { 
  getPERIODS,
  setSAMPLES, 
  setSELECTEDDATASOURCE, 
  setSELECTEDALGORITHM,
  ProductionScenarioArray,
  OrderScheduleArray
} from '../shared/types';
import { GetProductionScenarios } from '../shared/DataSources';
import { algorithms } from '../shared/Algorithms';

/**
 * API Gateway Lambda handler
 */
export const handler = async (event: any): Promise<any> => {
  console.log('Event received:', JSON.stringify(event));

  try {
    // Determine the action to perform
    let action = event.action;
    
    // If no action is specified, try to infer from path
    if (!action && event.path) {
      const pathParts = event.path.split('/');
      action = pathParts[pathParts.length - 1];
    }
    
    console.log(`Processing action: ${action}`);
    
    let response;
    
    switch (action) {
      case 'GetProductionScenarios':
        response = handleGetProductionScenarios(event);
        break;
        
      case 'GetOrders':
        response = handleGetOrders(event);
        break;
        
      case 'SimulateOrders':
        response = handleSimulateOrders(event);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return formatResponse(200, response);
  } catch (error) {
    console.error('Error processing request:', error);
    return formatResponse(500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Handles the GetProductionScenarios API call
 */
function handleGetProductionScenarios(event: any): ProductionScenarioArray {
  console.log('Handling GetProductionScenarios');
  
  // Get dataSource parameter, either from query params or event body
  let dataSource = 'Random';
  
  if (event.dataSource) {
    dataSource = event.dataSource;
  } else if (event.queryStringParameters && event.queryStringParameters.DataSource) {
    dataSource = event.queryStringParameters.DataSource;
  }
  
  console.log(`Using data source: ${dataSource}`);
  
  // Get production scenarios
  const scenarios = GetProductionScenarios(dataSource);
  
  console.log(`Retrieved ${scenarios.length} scenarios`);
  
  return scenarios;
}

/**
 * Handles the GetOrders API call
 */
function handleGetOrders(event: any): OrderScheduleArray {
  console.log('Handling GetOrders');
  
  // Extract parameters from the request body
  const body = event.body || {};
  let productionScenarios: ProductionScenarioArray = [];
  let algorithmName = 'SmartReplenish';
  
  if (typeof body === 'string') {
    const parsedBody = JSON.parse(body);
    productionScenarios = parsedBody.productionScenarios || [];
    algorithmName = parsedBody.algorithmName || 'SmartReplenish';
  } else {
    productionScenarios = body.productionScenarios || [];
    algorithmName = body.algorithmName || 'SmartReplenish';
  }
  
  console.log(`Using algorithm: ${algorithmName}`);
  console.log(`Processing ${productionScenarios.length} scenarios`);
  
  // Get the algorithm instance
  const algorithm = algorithms[algorithmName];
  if (!algorithm) {
    throw new Error(`Algorithm not found: ${algorithmName}`);
  }
  
  // Calculate order schedules
  const orderSchedules = algorithm.calculateOrderScheduleArray(productionScenarios);
  
  console.log(`Generated ${orderSchedules.length} order schedules`);
  
  return orderSchedules;
}

/**
 * Handles the SimulateOrders API call
 */
function handleSimulateOrders(event: any): OrderScheduleArray {
  console.log('Handling SimulateOrders');
  
  // Extract parameters from the request body
  const body = event.body || {};
  let dataSource = 'Random';
  let algorithmName = 'SmartReplenish';
  
  if (typeof body === 'string') {
    const parsedBody = JSON.parse(body);
    dataSource = parsedBody.dataSource || 'Random';
    algorithmName = parsedBody.algorithmName || 'SmartReplenish';
  } else {
    dataSource = body.dataSource || 'Random';
    algorithmName = body.algorithmName || 'SmartReplenish';
  }
  
  console.log(`Using data source: ${dataSource}`);
  console.log(`Using algorithm: ${algorithmName}`);
  
  // Get production scenarios
  const scenarios = GetProductionScenarios(dataSource);
  
  // Get the algorithm instance
  const algorithm = algorithms[algorithmName];
  if (!algorithm) {
    throw new Error(`Algorithm not found: ${algorithmName}`);
  }
  
  // Calculate order schedules
  const orderSchedules = algorithm.calculateOrderScheduleArray(scenarios);
  
  console.log(`Generated ${orderSchedules.length} order schedules`);
  
  return orderSchedules;
}

/**
 * Formats the response with CORS headers
 */
function formatResponse(statusCode: number, body: any): any {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
