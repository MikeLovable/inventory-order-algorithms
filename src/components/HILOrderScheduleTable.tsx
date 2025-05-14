
import React, { useState } from 'react';
import { OrderSchedule, OrderScheduleArray, getPERIODS } from '@/shared/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Algorithm } from '@/shared/Algorithm';

interface HILOrderScheduleTableProps {
  orderSchedules: OrderScheduleArray;
  onOrderSchedulesChange: (updatedSchedules: OrderScheduleArray) => void;
}

/**
 * Table component to display editable order schedules
 */
export default function HILOrderScheduleTable({ 
  orderSchedules, 
  onOrderSchedulesChange 
}: HILOrderScheduleTableProps) {
  const periods = getPERIODS();
  const { toast } = useToast();
  const [hoveredCell, setHoveredCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  if (!orderSchedules || orderSchedules.length === 0) {
    return <div className="text-center py-8 text-gray-500">No order schedules available to edit</div>;
  }

  // Helper function to get cell background color based on conditions
  const getCellBackgroundColor = (schedule: OrderSchedule, type: string, week: number) => {
    if (type === 'Inv') {
      // Red for zero inventory
      if (schedule.Inv[week] === 0) {
        return 'bg-red-200';
      }
      
      // Check for high inventory for 2+ consecutive weeks
      if (
        week > 0 && 
        schedule.Inv[week] >= 3 * schedule.InvTgt &&
        schedule.Inv[week - 1] >= 3 * schedule.InvTgt
      ) {
        return 'bg-orange-200';
      }
    }
    
    return '';
  };

  // Helper function to highlight row and column on hover
  const getHighlightClass = (rowIndex: number, colIndex: number) => {
    if (!hoveredCell) return '';
    
    if (hoveredCell.rowIndex === rowIndex || hoveredCell.colIndex === colIndex) {
      return 'bg-blue-50';
    }
    
    return '';
  };

  // Find the nearest compliant order quantity (for up or down adjustment)
  const findNearestCompliantQuantity = (
    currentValue: number,
    moq: number,
    pkQty: number,
    direction: 'up' | 'down'
  ): number => {
    if (direction === 'up') {
      // Going up from 0, start at MOQ
      if (currentValue === 0) {
        return moq;
      }
      
      // If below MOQ, jump to MOQ
      if (currentValue < moq) {
        return moq;
      }
      
      // Find next multiple of PkQty
      const remainder = currentValue % pkQty;
      if (remainder === 0) {
        // Already compliant, add one PkQty
        return currentValue + pkQty;
      } else {
        // Round up to next multiple of PkQty
        return currentValue + (pkQty - remainder);
      }
    } else {
      // Going down
      if (currentValue <= moq) {
        // If at or below MOQ, the only lower compliant value is 0
        return 0;
      }
      
      // Calculate previous multiple of PkQty
      const remainder = currentValue % pkQty;
      if (remainder === 0) {
        // Already at a multiple, go down one PkQty
        const result = currentValue - pkQty;
        // If this would put us below MOQ, return either MOQ or 0
        return result >= moq ? result : 0;
      } else {
        // Round down to previous multiple of PkQty
        const result = currentValue - remainder;
        return result >= moq ? result : 0;
      }
    }
  };

  // Handle input step up button click
  const handleStepUp = (scheduleIndex: number, weekIndex: number) => {
    const schedule = orderSchedules[scheduleIndex];
    const currentValue = schedule.Ord[weekIndex];
    const { MOQ, PkQty } = schedule;
    
    const nextCompliantValue = findNearestCompliantQuantity(currentValue, MOQ, PkQty, 'up');
    
    if (nextCompliantValue !== currentValue) {
      const updatedSchedules = [...orderSchedules];
      
      // Update the order
      updatedSchedules[scheduleIndex] = {
        ...schedule,
        Ord: schedule.Ord.map((ord, i) => i === weekIndex ? nextCompliantValue : ord)
      };
      
      // Show toast notification
      toast({
        title: "Order Adjusted",
        description: `Increased to next compliant value: ${nextCompliantValue} (MOQ: ${MOQ}, PkQty: ${PkQty})`
      });
      
      // Recalculate impacts and update schedules
      updatedSchedules[scheduleIndex] = recalculateOrderImpacts(updatedSchedules[scheduleIndex]);
      onOrderSchedulesChange(updatedSchedules);
    }
  };
  
  // Handle input step down button click
  const handleStepDown = (scheduleIndex: number, weekIndex: number) => {
    const schedule = orderSchedules[scheduleIndex];
    const currentValue = schedule.Ord[weekIndex];
    const { MOQ, PkQty } = schedule;
    
    // Skip if already at 0
    if (currentValue === 0) return;
    
    const prevCompliantValue = findNearestCompliantQuantity(currentValue, MOQ, PkQty, 'down');
    
    if (prevCompliantValue !== currentValue) {
      const updatedSchedules = [...orderSchedules];
      
      // Update the order
      updatedSchedules[scheduleIndex] = {
        ...schedule,
        Ord: schedule.Ord.map((ord, i) => i === weekIndex ? prevCompliantValue : ord)
      };
      
      // Show toast notification
      let toastTitle = "Order Adjusted";
      let description = `Decreased to previous compliant value: ${prevCompliantValue}`;
      
      if (prevCompliantValue === 0) {
        toastTitle = "Order Set to Zero";
        description = "No lower compliant value exists (below MOQ)";
      }
      
      toast({
        title: toastTitle,
        description
      });
      
      // Recalculate impacts and update schedules
      updatedSchedules[scheduleIndex] = recalculateOrderImpacts(updatedSchedules[scheduleIndex]);
      onOrderSchedulesChange(updatedSchedules);
    }
  };

  // Updates an order quantity ensuring it meets MOQ and PkQty rules
  const handleOrderQuantityChange = (
    scheduleIndex: number, 
    weekIndex: number, 
    rawValue: string
  ) => {
    const updatedSchedules = [...orderSchedules];
    const schedule = updatedSchedules[scheduleIndex];
    
    // Parse value
    let newValue = parseInt(rawValue);
    
    // Handle invalid input
    if (isNaN(newValue)) {
      newValue = 0;
    }
    
    const { MOQ, PkQty } = schedule;
    const oldValue = schedule.Ord[weekIndex];
    
    // Direct input validation
    if (newValue > 0) {
      // Must be at least MOQ
      if (newValue < MOQ) {
        newValue = MOQ;
        toast({
          title: "Order Adjusted",
          description: `Order must be at least MOQ (${MOQ})`
        });
      }
      
      // Must be a multiple of PkQty
      if (newValue % PkQty !== 0) {
        // Round to the nearest compliant value
        const remainder = newValue % PkQty;
        
        if (remainder < PkQty / 2) {
          // Round down
          newValue = newValue - remainder;
        } else {
          // Round up
          newValue = newValue + (PkQty - remainder);
        }
        
        toast({
          title: "Order Adjusted",
          description: `Order must be a multiple of PkQty (${PkQty})`
        });
      }
    }
    
    // Only update if the value has changed
    if (oldValue !== newValue) {
      // Update the order
      updatedSchedules[scheduleIndex] = {
        ...schedule,
        Ord: schedule.Ord.map((ord, i) => i === weekIndex ? newValue : ord)
      };
      
      // Recalculate Rec and Inv based on the order change
      updatedSchedules[scheduleIndex] = recalculateOrderImpacts(updatedSchedules[scheduleIndex]);
      
      onOrderSchedulesChange(updatedSchedules);
    }
  };

  // Recalculates the Rec and Inv values for a schedule after Ord changes
  const recalculateOrderImpacts = (schedule: OrderSchedule): OrderSchedule => {
    const algo = new TempAlgorithm("Temp", "Temporary algorithm for recalculation");
    return algo.calculateOrderScheduleImpacts(schedule);
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-200 mr-2"></div>
          <span>Zero Inventory (Critical)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-200 mr-2"></div>
          <span>High Inventory ≥3x Target for 2+ weeks (Warning)</span>
        </div>
      </div>
      
      <table 
        className="w-full border-collapse text-sm bg-white" 
        onMouseLeave={() => setHoveredCell(null)}
      >
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-1 text-center">MPN</th>
            <th className="border border-gray-300 p-1 text-center">MPNAttrs</th>
            <th className="border border-gray-300 p-1 text-center">Notes</th>
            <th className="border border-gray-300 p-1 text-center">Dir</th>
            <th className="border border-gray-300 p-1 text-center">KPI</th>
            {Array.from({ length: periods + 1 }).map((_, i) => (
              <th 
                key={i} 
                className={`border border-gray-300 p-1 text-center ${
                  hoveredCell?.colIndex === i + 5 ? 'bg-blue-50' : ''
                }`}
              >
                Week {i}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {orderSchedules.map((schedule, scheduleIndex) => {
            // Alternate row coloring
            const rowBaseClass = scheduleIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            return (
              <React.Fragment key={`${schedule.MPN}-${scheduleIndex}`}>
                {/* Input Data Rows */}
                <tr 
                  className={`${rowBaseClass} border-t-2 border-gray-400`}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7, colIndex: -1 })}
                >
                  <td 
                    rowSpan={7} 
                    className="border border-gray-300 p-1 text-center align-middle"
                  >
                    {schedule.MPN}
                  </td>
                  <td 
                    rowSpan={7} 
                    className="border border-gray-300 p-1 text-center align-middle text-xs"
                  >
                    LdTm: {schedule.LdTm}<br />
                    MOQ: {schedule.MOQ}<br />
                    PkQty: {schedule.PkQty}<br />
                    InvTgt: {schedule.InvTgt}<br />
                    SStok: {schedule.SStok}
                  </td>
                  <td 
                    rowSpan={7} 
                    className="border border-gray-300 p-1 text-left align-middle"
                  >
                    {schedule.Notes}
                  </td>
                  <td 
                    rowSpan={3} 
                    className="border border-gray-300 p-1 text-left font-bold bg-blue-100"
                  >
                    In
                  </td>
                  <td className="border border-gray-300 p-1">Rqt</td>
                  {schedule.Rqt.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scheduleIndex * 7, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 1, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1">Rec</td>
                  {schedule.InRec.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scheduleIndex * 7 + 1, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 1, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 2, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1">Inv</td>
                  {schedule.InInv.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scheduleIndex * 7 + 2, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 2, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                {/* Output Data Rows */}
                <tr 
                  className={`${rowBaseClass} border-t border-gray-400`}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 3, colIndex: -1 })}
                >
                  <td 
                    rowSpan={4} 
                    className="border border-gray-300 p-1 text-left font-bold bg-green-100"
                  >
                    Out
                  </td>
                  <td className="border border-gray-300 p-1">Rqt</td>
                  {schedule.Rqt.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scheduleIndex * 7 + 3, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 3, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 4, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1 bg-blue-50">Ord</td>
                  {schedule.Ord.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right bg-blue-50 ${
                        getHighlightClass(scheduleIndex * 7 + 4, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 4, colIndex: i + 5 })}
                    >
                      <div className="flex relative">
                        <Input 
                          type="number"
                          min="0"
                          className="h-6 p-1 text-right pr-6"
                          value={value}
                          onChange={(e) => handleOrderQuantityChange(
                            scheduleIndex, 
                            i, 
                            e.target.value
                          )}
                        />
                        <div className="absolute right-0 inset-y-0 flex flex-col">
                          <button 
                            type="button"
                            className="h-3 text-xs flex items-center justify-center px-1 hover:bg-gray-200"
                            onClick={() => handleStepUp(scheduleIndex, i)}
                          >▲</button>
                          <button 
                            type="button"
                            className="h-3 text-xs flex items-center justify-center px-1 hover:bg-gray-200"
                            onClick={() => handleStepDown(scheduleIndex, i)}
                          >▼</button>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 5, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1">Rec</td>
                  {schedule.Rec.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scheduleIndex * 7 + 5, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 5, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 6, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1">Inv</td>
                  {schedule.Inv.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getCellBackgroundColor(schedule, 'Inv', i)
                      } ${
                        getHighlightClass(scheduleIndex * 7 + 6, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scheduleIndex * 7 + 6, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Temporary Algorithm class for recalculating order schedule impacts
class TempAlgorithm extends Algorithm {
  constructor(name: string, description: string) {
    super(name, description);
  }
  
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    return orderSchedule;
  }
}
