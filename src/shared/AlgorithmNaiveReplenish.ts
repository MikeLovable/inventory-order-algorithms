
import { Algorithm } from './Algorithm';
import { OrderSchedule, getPERIODS } from './types';

/**
 * Algorithm that naively reorders this week's consumption
 */
export class AlgorithmNaiveReplenish extends Algorithm {
  constructor() {
    super("NaiveReplenish", "Reorders this weeks consumption, regardless of Rqt or Inv");
  }

  /**
   * Implementation of the algorithm that calculates orders based on 
   * requirements without considering inventory targets
   */
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    const periods = getPERIODS();
    const result = { ...orderSchedule };
    const { MOQ, PkQty, Rqt } = result;
    
    // For each week, calculate the order quantity
    result.Ord = Array(periods + 1).fill(0);
    
    for (let i = 0; i < periods + 1; i++) {
      // Calculate smallest integer >= MOQ AND multiple of PkQty AND >= Rqt
      let orderQty = Math.max(Rqt[i], MOQ);
      
      // Adjust to be a multiple of PkQty
      if (orderQty % PkQty !== 0) {
        orderQty = Math.ceil(orderQty / PkQty) * PkQty;
      }
      
      result.Ord[i] = orderQty;
    }
    
    return result;
  }
}
