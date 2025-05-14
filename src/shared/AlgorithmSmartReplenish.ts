
import { Algorithm } from './Algorithm';
import { OrderSchedule, getPERIODS } from './types';

/**
 * Algorithm that orders based on consumption but also considers inventory targets
 */
export class AlgorithmSmartReplenish extends Algorithm {
  constructor() {
    super("SmartReplenish", "Reorders this weeks consumption but also considers InvTgt and SStok");
  }

  /**
   * Implementation of the algorithm that calculates orders based on 
   * requirements and inventory targets
   */
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    const periods = getPERIODS();
    const result = { ...orderSchedule };
    const { MOQ, PkQty, Rqt, InvTgt, SStok } = result;
    
    // For each week, calculate the order quantity
    result.Ord = Array(periods + 1).fill(0);
    
    for (let i = 0; i < periods + 1; i++) {
      // Calculate smallest integer >= MOQ AND multiple of PkQty AND >= Rqt
      let tmp = Math.max(Rqt[i], MOQ);
      
      // Adjust to be a multiple of PkQty
      if (tmp % PkQty !== 0) {
        tmp = Math.ceil(tmp / PkQty) * PkQty;
      }
      
      // Check if tmp is enough to maintain inventory target plus safety stock
      if (tmp >= (InvTgt + SStok)) {
        result.Ord[i] = tmp;
      } else {
        // If not, order enough to meet target plus safety stock
        let targetOrd = InvTgt + SStok;
        
        // Ensure it meets MOQ
        targetOrd = Math.max(targetOrd, MOQ);
        
        // Adjust to be a multiple of PkQty
        if (targetOrd % PkQty !== 0) {
          targetOrd = Math.ceil(targetOrd / PkQty) * PkQty;
        }
        
        result.Ord[i] = targetOrd;
      }
    }
    
    return result;
  }
}
