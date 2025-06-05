import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DecisionSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function DecisionSidebar({ node, onChange }: DecisionSidebarProps) {
  const [decisionConditions, setDecisionConditions] = useState(node.data.decisionConditions || []);
  const [defaultOutputPath, setDefaultOutputPath] = useState(node.data.defaultOutputPath || "");

  // Update state when node changes
  useEffect(() => {
    setDecisionConditions(node.data.decisionConditions || []);
    setDefaultOutputPath(node.data.defaultOutputPath || "");
  }, [node]);

  const handleAddCondition = () => {
    setDecisionConditions([
      ...decisionConditions,
      { condition: '', outputPath: '' }
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...decisionConditions];
    newConditions.splice(index, 1);
    setDecisionConditions(newConditions);
  };

  const handleConditionChange = (index: number, field: 'condition' | 'outputPath', value: string) => {
    const newConditions = [...decisionConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setDecisionConditions(newConditions);
  };

  const handleSave = async () => {
    await onChange(node.id, {
      decisionConditions,
      defaultOutputPath,
      ioConfig: {
        inputTypes: [{ type: "csv" }], // Default input type for decision nodes
        outputType: { type: "decision" }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Decision Conditions Section */}
      <div>
        <div className="font-medium mb-2">Decision Conditions</div>
        <div className="space-y-4">
          {decisionConditions.map((condition: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-sm">Condition {index + 1}</div>
                <button
                  onClick={() => handleRemoveCondition(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Condition</div>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder="e.g., value > 100"
                    value={condition.condition}
                    onChange={(e) => handleConditionChange(index, 'condition', e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Output Path Label</div>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder="e.g., High Value"
                    value={condition.outputPath}
                    onChange={(e) => handleConditionChange(index, 'outputPath', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleAddCondition}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + Add Condition
          </button>
        </div>
      </div>

      {/* Default Output Path Section */}
      <div>
        <div className="font-medium mb-2">Default Output Path</div>
        <input
          type="text"
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="e.g., Default"
          value={defaultOutputPath}
          onChange={(e) => setDefaultOutputPath(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">This path will be used when no conditions are met</p>
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