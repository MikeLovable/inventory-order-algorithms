
import { Algorithm } from './Algorithm';
import { OrderSchedule, getPERIODS } from './types';

/**
 * Simple algorithm that orders 20 units regardless of requirements or inventory
 */
export class AlgorithmFlat20 extends Algorithm {
  constructor() {
    super("Flat20", "Orders 20 units, regardless of Rqt or Inv");
  }

  /**
   * Implementation of the algorithm that populates each Ord with 20
   */
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    const periods = getPERIODS();
    const result = { ...orderSchedule };
    
    // Set all orders to 20 regardless of any other factors
    result.Ord = Array(periods + 1).fill(20);
    
    return result;
  }
}
