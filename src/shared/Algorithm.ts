
import { 
  ProductionScenario, 
  OrderSchedule, 
  ProductionScenarioArray, 
  OrderScheduleArray,
  getPERIODS
} from './types';

/**
 * Abstract base class for all inventory ordering algorithms
 */
export abstract class Algorithm {
  Name: string;
  Desc: string;
  
  constructor(name: string, desc: string) {
    this.Name = name;
    this.Desc = desc;
  }

  /**
   * Abstract method to be implemented by concrete algorithms
   * @param orderSchedule - The order schedule to calculate orders for
   * @returns The modified order schedule with calculated orders
   */
  protected abstract algorithm(orderSchedule: OrderSchedule): OrderSchedule;

  /**
   * Prepares an OrderSchedule from a ProductionScenario
   * @param productionScenario - The input production scenario
   * @returns A new OrderSchedule with copied values from the ProductionScenario
   */
  public prepareOrderSchedule(productionScenario: ProductionScenario): OrderSchedule {
    const periods = getPERIODS();
    
    // Create a new OrderSchedule with copied values
    const orderSchedule: OrderSchedule = {
      MPN: productionScenario.MPN,
      InInv: [...productionScenario.Inv],
      InvTgt: productionScenario.InvTgt,
      SStok: productionScenario.SStok,
      LdTm: productionScenario.LdTm,
      MOQ: productionScenario.MOQ,
      PkQty: productionScenario.PkQty,
      Rqt: [...productionScenario.Rqt],
      InRec: [...productionScenario.Rec],
      Ord: Array(periods + 1).fill(0),
      Rec: Array(periods + 1).fill(0),
      Inv: Array(periods + 1).fill(0),
      Notes: ""
    };

    return orderSchedule;
  }

  /**
   * Calculates the impact of orders on the receiving and inventory
   * @param orderSchedule - The order schedule with orders to calculate impacts for
   * @returns The modified OrderSchedule with calculated Rec and Inv
   */
  public calculateOrderScheduleImpacts(orderSchedule: OrderSchedule): OrderSchedule {
    const periods = getPERIODS();
    const result = { ...orderSchedule };
    const { LdTm, Ord, Rqt } = result;

    // Calculate future Rec values
    result.Rec = Array(periods + 1).fill(0);
    for (let i = 0; i < periods + 1; i++) {
      const targetIndex = i + LdTm;
      if (targetIndex < periods + 1) {
        result.Rec[targetIndex] += Ord[i];
      } else {
        // Add to last position if it falls outside bounds
        result.Rec[periods] += Ord[i];
      }
    }

    // Calculate future Inv values
    result.Inv = Array(periods + 1).fill(0);
    // Set initial inventory
    if (typeof result.InInv[0] === 'number') {
      result.Inv[0] = result.InInv[0];
    } else {
      result.Inv[0] = 0; // Default if InInv[0] is not a number
    }

    // Track conditions for notes
    let zeroInventoryWeeks: number[] = [];
    let highInventoryStartWeek = -1;
    let highInventoryCount = 0;

    for (let i = 1; i < periods + 1; i++) {
      const tmp = Rqt[i] - result.Rec[i];
      result.Inv[i] = result.Inv[i - 1] - tmp;
      
      // Check for zero inventory
      if (result.Inv[i] <= 0) {
        result.Inv[i] = 0; // Inventory can't go negative
        zeroInventoryWeeks.push(i);
      }
      
      // Check for high inventory
      if (result.Inv[i] >= 3 * result.InvTgt) {
        if (highInventoryStartWeek === -1) {
          highInventoryStartWeek = i;
          highInventoryCount = 1;
        } else {
          highInventoryCount++;
        }
      } else {
        highInventoryStartWeek = -1;
        highInventoryCount = 0;
      }
    }

    // Populate Notes
    let notes = [];
    
    if (zeroInventoryWeeks.length > 0) {
      notes.push(`Inventory reaches zero in week(s): ${zeroInventoryWeeks.join(', ')}`);
    }
    
    if (highInventoryCount >= 2) {
      notes.push(`High inventory (>=3x target) for ${highInventoryCount} consecutive weeks starting at week ${highInventoryStartWeek}`);
    }
    
    result.Notes = notes.join('; ');

    return result;
  }

  /**
   * Calculates an OrderSchedule from a ProductionScenario
   * @param productionScenario - The input production scenario
   * @returns A calculated OrderSchedule
   */
  public calculateOrderSchedule(productionScenario: ProductionScenario): OrderSchedule {
    let orderSchedule = this.prepareOrderSchedule(productionScenario);
    orderSchedule = this.algorithm(orderSchedule);
    orderSchedule = this.calculateOrderScheduleImpacts(orderSchedule);
    return orderSchedule;
  }

  /**
   * Calculates an OrderScheduleArray from a ProductionScenarioArray
   * @param productionScenarioArray - Array of production scenarios
   * @returns Array of calculated order schedules
   */
  public calculateOrderScheduleArray(productionScenarioArray: ProductionScenarioArray): OrderScheduleArray {
    const result: OrderScheduleArray = [];

    for (const scenario of productionScenarioArray) {
      // Only process selected scenarios if any are selected
      const anySelected = productionScenarioArray.some(s => s.Sel);
      if (anySelected && !scenario.Sel) continue;

      const orderSchedule = this.calculateOrderSchedule(scenario);
      result.push(orderSchedule);
    }

    return result;
  }
}
