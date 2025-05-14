
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
    value: number,
    moq: number,
    pkQty: number,
    direction: 'up' | 'down'
  ): number => {
    if (value <= 0) return 0;
    
    // If the value is below MOQ
    if (value < moq) {
      if (direction === 'up') {
        return moq;
      } else {
        return 0; // No lower compliant value exists
      }
    }
    
    // Calculate the nearest multiple of PkQty
    const remainder = value % pkQty;
    if (remainder === 0) return value; // Already compliant
    
    if (direction === 'up') {
      return value + (pkQty - remainder);
    } else {
      // If going down would put us below MOQ, return either MOQ or 0
      const potentialValue = value - remainder;
      return potentialValue >= moq ? potentialValue : 0;
    }
  };

  // Updates an order quantity ensuring it meets MOQ and PkQty rules
  const handleOrderQuantityChange = (
    scheduleIndex: number, 
    weekIndex: number, 
    rawValue: string,
    direction?: 'up' | 'down'
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
    
    // If direction is specified, we're coming from spinner buttons
    if (direction) {
      const compliantValue = findNearestCompliantQuantity(newValue, MOQ, PkQty, direction);
      
      if (compliantValue !== newValue) {
        if (compliantValue === 0) {
          toast({
            title: "Order Adjusted to Zero",
            description: `No lower compliant value exists (MOQ: ${MOQ}, PkQty: ${PkQty})`
          });
        } else {
          toast({
            title: "Order Adjusted",
            description: `Adjusted to ${direction === 'up' ? 'next' : 'previous'} compliant value (MOQ: ${MOQ}, PkQty: ${PkQty})`
          });
        }
      }
      
      newValue = compliantValue;
    } 
    // Direct input validation
    else if (newValue > 0) {
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

  // Handlers for spinner up and down buttons
  const handleInputStepUp = (scheduleIndex: number, weekIndex: number, event: React.MouseEvent) => {
    const input = event.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
    const currentValue = parseInt(input.value);
    const newValue = currentValue + 1; // Increment by 1
    handleOrderQuantityChange(scheduleIndex, weekIndex, newValue.toString(), 'up');
  };

  const handleInputStepDown = (scheduleIndex: number, weekIndex: number, event: React.MouseEvent) => {
    const input = event.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
    const currentValue = parseInt(input.value);
    const newValue = Math.max(0, currentValue - 1); // Decrement by 1, but not below 0
    handleOrderQuantityChange(scheduleIndex, weekIndex, newValue.toString(), 'down');
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
                      <div className="flex">
                        <Input 
                          type="number"
                          min="0"
                          className="h-6 p-1 text-right"
                          value={value}
                          onChange={(e) => handleOrderQuantityChange(
                            scheduleIndex, 
                            i, 
                            e.target.value
                          )}
                        />
                        <div className="flex flex-col">
                          <button 
                            className="h-3 text-xs flex items-center justify-center"
                            onClick={(e) => handleInputStepUp(scheduleIndex, i, e)}
                          >▲</button>
                          <button 
                            className="h-3 text-xs flex items-center justify-center"
                            onClick={(e) => handleInputStepDown(scheduleIndex, i, e)}
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
  protected algorithm(orderSchedule: OrderSchedule): OrderSchedule {
    return orderSchedule;
  }
}
