
import { Algorithm } from './Algorithm';
import { OrderSchedule, getPERIODS } from './types';

/**
 * AI-designed algorithm that optimizes inventory across all weeks
 */
export class AlgorithmAIDesigned extends Algorithm {
  constructor() {
    super("AIDesigned", "Replenishment algorithm designed by AI after teaching it inventory concepts in English");
  }

  /**
   * Implementation of the AI-designed algorithm that optimizes orders based on
   * inventory levels, requirements, and receiving across all known weeks
   */
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    const periods = getPERIODS();
    const result = { ...orderSchedule };
    const { MOQ, PkQty, LdTm, Rqt, InRec, InvTgt, SStok } = result;
    
    // Create a simulation of inventory and projected inventory
    const simulatedInv = Array(periods + 1).fill(0);
    if (typeof result.InInv[0] === 'number') {
      simulatedInv[0] = result.InInv[0];
    }
    
    // Initialize orders to zero
    result.Ord = Array(periods + 1).fill(0);
    
    // First pass: simulate inventory without any new orders
    for (let i = 1; i < periods + 1; i++) {
      simulatedInv[i] = simulatedInv[i - 1] + InRec[i] - Rqt[i];
    }
    
    // Second pass: calculate orders based on projected inventory
    for (let i = 0; i < periods + 1; i++) {
      // Skip ordering if we can't receive in time (beyond the periods)
      if (i + LdTm > periods) continue;
      
      // Look ahead to when this order would be received
      let futureInv = simulatedInv[i + LdTm];
      
      // Decide if we need to order
      let needsOrder = false;
      
      // Priority 1: Avoid letting inventory fall below requirements
      if (futureInv < Rqt[i + LdTm]) {
        needsOrder = true;
      }
      // Priority 2: Try to maintain inventory close to target + safety stock
      else if (futureInv < InvTgt + SStok) {
        needsOrder = true;
      }
      
      if (needsOrder) {
        // Calculate how much to order
        let targetInv = InvTgt + SStok;
        let shortfall = targetInv - futureInv;
        
        // Look further ahead to see if next few weeks will have higher requirements
        let maxRqt = Rqt[i + LdTm];
        for (let j = 1; j < Math.min(3, periods - (i + LdTm) + 1); j++) {
          maxRqt = Math.max(maxRqt, Rqt[i + LdTm + j]);
        }
        
        // Adjust shortfall based on maximum upcoming requirements
        shortfall = Math.max(shortfall, maxRqt - futureInv);
        
        // Ensure it meets MOQ
        let orderQty = Math.max(shortfall, MOQ);
        
        // Adjust to be a multiple of PkQty
        if (orderQty % PkQty !== 0) {
          orderQty = Math.ceil(orderQty / PkQty) * PkQty;
        }
        
        result.Ord[i] = orderQty;
        
        // Update simulated inventory based on this new order
        for (let j = i + LdTm; j < periods + 1; j++) {
          simulatedInv[j] += orderQty;
        }
        
        // Priority 3: Avoid excessive inventory (3x target) for 2+ weeks
        // Check if this order would cause excessive inventory and adjust if needed
        let excessiveCount = 0;
        for (let j = i + LdTm; j < periods + 1; j++) {
          if (simulatedInv[j] >= 3 * InvTgt) {
            excessiveCount++;
          } else {
            excessiveCount = 0;
          }
          
          // If we've caused excessive inventory for 2+ weeks, reduce the order if possible
          if (excessiveCount >= 2) {
            // Calculate how much we can reduce while still meeting requirements
            let excess = simulatedInv[j] - (2 * InvTgt); // Allow up to 2x target
            let minNeeded = Math.max(Rqt[j], InvTgt + SStok);
            let reduction = Math.min(excess, orderQty - MOQ);
            
            // Adjust reduction to be a multiple of PkQty
            if (reduction % PkQty !== 0) {
              reduction = Math.floor(reduction / PkQty) * PkQty;
            }
            
            // Only reduce if we can maintain MOQ and it's a valid PkQty multiple
            if (reduction > 0 && orderQty - reduction >= MOQ) {
              orderQty -= reduction;
              result.Ord[i] = orderQty;
              
              // Update simulated inventory with reduced order
              for (let k = i + LdTm; k < periods + 1; k++) {
                simulatedInv[k] -= reduction;
              }
              break;
            }
          }
        }
      }
    }
    
    return result;
  }
}
