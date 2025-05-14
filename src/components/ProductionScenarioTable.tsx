
import React, { useState } from 'react';
import { ProductionScenarioArray, getPERIODS } from '@/shared/types';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductionScenarioTableProps {
  scenarios: ProductionScenarioArray;
  onScenarioSelectionChange: (updatedScenarios: ProductionScenarioArray) => void;
}

/**
 * Table component to display production scenarios with selection checkboxes
 */
export default function ProductionScenarioTable({ 
  scenarios, 
  onScenarioSelectionChange 
}: ProductionScenarioTableProps) {
  const periods = getPERIODS();
  const [selectAll, setSelectAll] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  if (!scenarios || scenarios.length === 0) {
    return <div className="text-center py-8 text-gray-500">No production scenarios available</div>;
  }

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    const updatedScenarios = scenarios.map(scenario => ({
      ...scenario,
      Sel: checked
    }));
    onScenarioSelectionChange(updatedScenarios);
  };

  const handleScenarioSelectionChange = (index: number, checked: boolean) => {
    const updatedScenarios = [...scenarios];
    updatedScenarios[index] = {
      ...updatedScenarios[index],
      Sel: checked
    };
    
    // Update selectAll state
    const allSelected = updatedScenarios.every(scenario => scenario.Sel);
    setSelectAll(allSelected);
    
    onScenarioSelectionChange(updatedScenarios);
  };

  // Helper function to highlight row and column on hover
  const getHighlightClass = (rowIndex: number, colIndex: number) => {
    if (!hoveredCell) return '';
    
    if (hoveredCell.rowIndex === rowIndex || hoveredCell.colIndex === colIndex) {
      return 'bg-blue-50';
    }
    
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table 
        className="w-full border-collapse text-sm bg-white" 
        onMouseLeave={() => setHoveredCell(null)}
      >
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-1 text-center">
              <Checkbox 
                checked={selectAll} 
                onCheckedChange={(checked) => handleSelectAllChange(checked === true)}
              />
            </th>
            <th className="border border-gray-300 p-1 text-center">MPN</th>
            <th className="border border-gray-300 p-1 text-center">MPNAttrs</th>
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
          {scenarios.map((scenario, scenarioIndex) => {
            // Alternate row coloring
            const rowBaseClass = scenarioIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            return (
              <React.Fragment key={`${scenario.MPN}-${scenarioIndex}`}>
                <tr 
                  className={`${rowBaseClass} border-t-2 border-gray-400`}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scenarioIndex * 3, colIndex: -1 })}
                >
                  <td 
                    rowSpan={3} 
                    className="border border-gray-300 p-1 text-center align-middle"
                  >
                    <Checkbox 
                      checked={scenario.Sel} 
                      onCheckedChange={(checked) => 
                        handleScenarioSelectionChange(scenarioIndex, checked === true)
                      }
                    />
                  </td>
                  <td 
                    rowSpan={3} 
                    className="border border-gray-300 p-1 text-center align-middle"
                  >
                    {scenario.MPN}
                  </td>
                  <td 
                    rowSpan={3} 
                    className="border border-gray-300 p-1 text-center align-middle text-xs"
                  >
                    LdTm: {scenario.LdTm}<br />
                    MOQ: {scenario.MOQ}<br />
                    PkQty: {scenario.PkQty}<br />
                    InvTgt: {scenario.InvTgt}<br />
                    SStok: {scenario.SStok}
                  </td>
                  <td 
                    rowSpan={3} 
                    className="border border-gray-300 p-1 text-left font-bold bg-blue-100"
                  >
                    In
                  </td>
                  <td className="border border-gray-300 p-1">Rqt</td>
                  {scenario.Rqt.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scenarioIndex * 3, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scenarioIndex * 3, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scenarioIndex * 3 + 1, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1">Rec</td>
                  {scenario.Rec.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scenarioIndex * 3 + 1, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scenarioIndex * 3 + 1, colIndex: i + 5 })}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
                
                <tr 
                  className={rowBaseClass}
                  onMouseEnter={() => setHoveredCell({ rowIndex: scenarioIndex * 3 + 2, colIndex: -1 })}
                >
                  <td className="border border-gray-300 p-1">Inv</td>
                  {scenario.Inv.map((value, i) => (
                    <td 
                      key={i}
                      className={`border border-gray-300 p-1 text-right ${
                        getHighlightClass(scenarioIndex * 3 + 2, i + 5)
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex: scenarioIndex * 3 + 2, colIndex: i + 5 })}
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
