
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';

/**
 * Manual output tab component to display JSON representation of human-modified order schedules
 */
export default function ManualOutputTab() {
  const { manualOrderSchedules } = useAppContext();
  const [jsonOutput, setJsonOutput] = useState("");
  
  useEffect(() => {
    // Format the manual order schedules as JSON
    if (manualOrderSchedules.length > 0) {
      setJsonOutput(JSON.stringify(manualOrderSchedules, null, 2));
    } else {
      setJsonOutput("");
    }
  }, [manualOrderSchedules]);

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Human In the loop Order Schedule</h2>
        <Textarea
          className="font-mono h-[calc(100vh-300px)] min-h-[400px]"
          value={jsonOutput}
          readOnly
        />
      </div>
    </div>
  );
}
