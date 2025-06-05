import { useState, useEffect } from "react";

interface CsvAppendSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function CsvAppendSidebar({ node, onChange }: CsvAppendSidebarProps) {
  const [outputFileName, setOutputFileName] = useState(node.data.outputFileName || 'merged_data.csv');

  // Update state when node changes
  useEffect(() => {
    setOutputFileName(node.data.outputFileName || 'merged_data.csv');
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, {
      outputFileName,
      ioConfig: {
        inputTypes: [{ type: "csv" }],
        outputType: { type: "csv" }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="font-medium mb-2">Output Configuration</div>
        <div className="space-y-2">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Output Filename</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="merged_data.csv"
              value={outputFileName}
              onChange={(e) => setOutputFileName(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div>
        <div className="font-medium mb-2">Description</div>
        <p className="text-sm text-gray-600">
          This node takes multiple CSV files as input and combines them into a single CSV file. 
          All input CSV files must have the same column headers. Data rows from all files will be appended together.
        </p>
      </div>
      
      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Save Configuration
      </button>
    </div>
  );
} 