
import React, { useState } from 'react';
import { OrderSchedule, OrderScheduleArray, getPERIODS } from '@/shared/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Algorithm } from '@/shared/Algorithm';

interface ManualOrderScheduleTableProps {
  orderSchedules: OrderScheduleArray;
  onOrderSchedulesChange: (updatedSchedules: OrderScheduleArray) => void;
}

/**
 * Table component to display editable order schedules
 */
export default function ManualOrderScheduleTable({ 
  orderSchedules, 
  onOrderSchedulesChange 
}: ManualOrderScheduleTableProps) {
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

  // Updates an order quantity ensuring it meets MOQ and PkQty rules
  const handleOrderQuantityChange = (
    scheduleIndex: number, 
    weekIndex: number, 
    value: string
  ) => {
    const updatedSchedules = [...orderSchedules];
    const schedule = updatedSchedules[scheduleIndex];
    
    // Parse value
    let newValue = parseInt(value);
    
    // Handle invalid input
    if (isNaN(newValue)) {
      newValue = 0;
    }
    
    const { MOQ, PkQty } = schedule;
    
    // Check for compliance with MOQ and PkQty rules
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
    } else {
      // Zero is allowed
      newValue = 0;
    }
    
    // Update the order
    updatedSchedules[scheduleIndex] = {
      ...schedule,
      Ord: schedule.Ord.map((ord, i) => i === weekIndex ? newValue : ord)
    };
    
    // Recalculate Rec and Inv based on the order change
    updatedSchedules[scheduleIndex] = recalculateOrderImpacts(updatedSchedules[scheduleIndex]);
    
    onOrderSchedulesChange(updatedSchedules);
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
