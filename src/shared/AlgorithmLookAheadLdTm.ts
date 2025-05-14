
import { Algorithm } from './Algorithm';
import { OrderSchedule, getPERIODS } from './types';

/**
 * Algorithm that looks ahead by lead time weeks to calculate orders
 */
export class AlgorithmLookAheadLdTm extends Algorithm {
  constructor() {
    super("LookAheadLdTm", "Looks ahead LdTm weeks and orders, then skips LdTm weeks");
  }

  /**
   * Implementation of the algorithm that calculates orders by looking ahead
   * by the lead time and summing requirements
   */
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    const periods = getPERIODS();
    const result = { ...orderSchedule };
    const { MOQ, PkQty, LdTm, Rqt, InRec } = result;
    
    // Initialize orders array
    result.Ord = Array(periods + 1).fill(0);
    
    // Loop through time periods, skipping ahead by LdTm after each order
    for (let i = 0; i < periods + 1;) {
      // Look ahead LdTm periods and calculate total requirements
      let totalRqt = 0;
      let totalRec = 0;
      
      for (let j = 0; j < LdTm && i + j < periods + 1; j++) {
        totalRqt += Rqt[i + j];
        totalRec += InRec[i + j];
      }
      
      // Calculate net requirements
      let tmp = totalRqt - totalRec;
      tmp = Math.max(tmp, 0); // Don't order negative quantities
      
      // Ensure it meets MOQ
      tmp = Math.max(tmp, MOQ);
      
      // Adjust to be a multiple of PkQty
      if (tmp % PkQty !== 0) {
        tmp = Math.ceil(tmp / PkQty) * PkQty;
      }
      
      // Set order for current period
      result.Ord[i] = tmp;
      
      // Skip ahead by LdTm periods
      i += LdTm;
    }
    
    return result;
  }
}
