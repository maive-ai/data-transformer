import { useState, useEffect } from "react";
import { IntegrationSubType, IntegrationDirection, FileType } from "@/types/enums";
import { ErpSidebar } from "./workflow-sidebar-erp";

interface IntegrationSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function IntegrationSidebar({ node, onChange }: IntegrationSidebarProps) {
  const [integrationType, setIntegrationType] = useState(node.data.integrationType || IntegrationSubType.ERP);
  const [direction, setDirection] = useState(node.data.direction || IntegrationDirection.BOTH);

  // Update state when node changes
  useEffect(() => {
    setIntegrationType(node.data.integrationType || IntegrationSubType.ERP);
    setDirection(node.data.direction || IntegrationDirection.BOTH);
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, {
      integrationType,
      direction,
      ioConfig: {
        inputTypes: [{ type: FileType.CSV }], // Default for integrations
        outputType: { type: FileType.CSV }
      }
    });
  };

  // Route to specialized sidebar based on integration type
  if (integrationType === IntegrationSubType.ERP) {
    return <ErpSidebar node={node} onChange={onChange} />;
  }

  // For other integration types, show general configuration for now
  return (
    <div className="space-y-6">
      {/* Integration Type Selection */}
      <div>
        <div className="font-medium mb-2">Integration Type</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={integrationType}
          onChange={(e) => setIntegrationType(e.target.value as IntegrationSubType)}
        >
          <option value={IntegrationSubType.ERP}>ERP System</option>
          <option value={IntegrationSubType.EMAIL}>Email</option>
          <option value={IntegrationSubType.FILE_STORAGE}>File Storage</option>
          <option value={IntegrationSubType.DATABASE}>Database</option>
          <option value={IntegrationSubType.API}>API</option>
          <option value={IntegrationSubType.WEBHOOK}>Webhook</option>
        </select>
      </div>

      {/* Direction Configuration */}
      <div>
        <div className="font-medium mb-2">Data Direction</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={direction}
          onChange={(e) => setDirection(e.target.value as IntegrationDirection)}
        >
          <option value={IntegrationDirection.READ}>Read (Input)</option>
          <option value={IntegrationDirection.WRITE}>Write (Output)</option>
          <option value={IntegrationDirection.BOTH}>Both (Input/Output)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Configure whether this integration reads from, writes to, or both reads and writes to the external system
        </p>
      </div>

      {/* Integration-specific configuration would go here */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-1">
          {integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} Integration
        </div>
        <div className="text-xs text-blue-700">
          Configuration options for {integrationType} integration will be available here.
        </div>
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