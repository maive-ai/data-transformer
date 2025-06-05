import { useState, useEffect } from "react";
import { ErpAction, ErpActionLabel, FileType } from "@/types/enums";

interface ErpSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

const ERP_ACTIONS = [
  { value: ErpAction.BOM_LOOKUP, label: ErpActionLabel.BOM_LOOKUP },
  { value: ErpAction.INVENTORY_CHECK, label: ErpActionLabel.INVENTORY_CHECK },
  { value: ErpAction.PRICE_LOOKUP, label: ErpActionLabel.PRICE_LOOKUP },
  { value: ErpAction.SUPPLIER_LOOKUP, label: ErpActionLabel.SUPPLIER_LOOKUP },
  { value: ErpAction.LEAD_TIME_CHECK, label: ErpActionLabel.LEAD_TIME_CHECK },
  { value: ErpAction.ALTERNATE_PARTS, label: ErpActionLabel.ALTERNATE_PARTS },
  { value: ErpAction.COMPLIANCE_CHECK, label: ErpActionLabel.COMPLIANCE_CHECK },
];

export function ErpSidebar({ node, onChange }: ErpSidebarProps) {
  const [erpAction, setErpAction] = useState(node.data.erpAction || ErpAction.BOM_LOOKUP);
  const [mockDistribution, setMockDistribution] = useState({
    directMatch: node.data.mockDistribution?.directMatch || 80,
    substitution: node.data.mockDistribution?.substitution || 10,
    notFound: node.data.mockDistribution?.notFound || 10,
  });
  const [connectionConfig, setConnectionConfig] = useState({
    host: node.data.connectionConfig?.host || "",
    database: node.data.connectionConfig?.database || "",
    port: node.data.connectionConfig?.port || 5432,
  });
  const [useMockData, setUseMockData] = useState(node.data.useMockData !== false); // Default to true

  // Update state when node changes
  useEffect(() => {
    setErpAction(node.data.erpAction || ErpAction.BOM_LOOKUP);
    setMockDistribution({
      directMatch: node.data.mockDistribution?.directMatch || 80,
      substitution: node.data.mockDistribution?.substitution || 10,
      notFound: node.data.mockDistribution?.notFound || 10,
    });
    setConnectionConfig({
      host: node.data.connectionConfig?.host || "",
      database: node.data.connectionConfig?.database || "",
      port: node.data.connectionConfig?.port || 5432,
    });
    setUseMockData(node.data.useMockData !== false);
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, {
      erpAction,
      mockDistribution,
      connectionConfig,
      useMockData,
      ioConfig: {
        inputTypes: [{ type: FileType.CSV }], // ERP nodes typically work with CSV/structured data
        outputType: { type: FileType.CSV }
      }
    });
  };

  const handleDistributionChange = (field: keyof typeof mockDistribution, value: number) => {
    const newDistribution = { ...mockDistribution, [field]: value };
    
    // Ensure values add up to 100
    const total = newDistribution.directMatch + newDistribution.substitution + newDistribution.notFound;
    if (total !== 100) {
      // Adjust other values proportionally
      const remaining = 100 - value;
      const otherFields = Object.keys(newDistribution).filter(k => k !== field) as Array<keyof typeof mockDistribution>;
      const otherTotal = otherFields.reduce((sum, k) => sum + newDistribution[k], 0);
      
      if (otherTotal > 0) {
        otherFields.forEach(k => {
          newDistribution[k] = Math.round((newDistribution[k] / otherTotal) * remaining);
        });
      }
    }
    
    setMockDistribution(newDistribution);
  };

  const getActionDescription = (action: ErpAction): string => {
    switch (action) {
      case ErpAction.BOM_LOOKUP:
        return "Looks up part numbers from BOM data and returns availability status, substitutions, and basic part information.";
      case ErpAction.INVENTORY_CHECK:
        return "Checks current inventory levels for specified parts and returns stock quantities and locations.";
      case ErpAction.PRICE_LOOKUP:
        return "Retrieves current pricing information for parts including quantity breaks and supplier pricing.";
      case ErpAction.SUPPLIER_LOOKUP:
        return "Finds supplier information, contact details, and lead times for specified parts.";
      case ErpAction.LEAD_TIME_CHECK:
        return "Checks estimated lead times for parts from various suppliers.";
      case ErpAction.ALTERNATE_PARTS:
        return "Searches for alternate or equivalent parts that can be substituted.";
      case ErpAction.COMPLIANCE_CHECK:
        return "Verifies parts against compliance requirements (RoHS, REACH, etc.).";
      default:
        return "ERP action description not available.";
    }
  };

  return (
    <div className="space-y-6">
      {/* ERP Action Selection */}
      <div>
        <div className="font-medium mb-2">ERP Action</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={erpAction}
          onChange={(e) => setErpAction(e.target.value as ErpAction)}
        >
          {ERP_ACTIONS.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mock Data Toggle */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="useMockData"
            checked={useMockData}
            onChange={(e) => setUseMockData(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="useMockData" className="font-medium text-sm">
            Use Mock Data
          </label>
        </div>
        <p className="text-xs text-gray-500">
          When enabled, the node will generate mock responses instead of connecting to a real ERP system
        </p>
      </div>

      {/* Mock Distribution Settings (only show when using mock data) */}
      {useMockData && (
        <div>
          <div className="font-medium mb-2">Mock Response Distribution</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm">Direct Match</label>
                <span className="text-sm text-gray-500">{mockDistribution.directMatch}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={mockDistribution.directMatch}
                onChange={(e) => handleDistributionChange('directMatch', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm">Substitution Found</label>
                <span className="text-sm text-gray-500">{mockDistribution.substitution}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={mockDistribution.substitution}
                onChange={(e) => handleDistributionChange('substitution', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm">Not Found</label>
                <span className="text-sm text-gray-500">{mockDistribution.notFound}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={mockDistribution.notFound}
                onChange={(e) => handleDistributionChange('notFound', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total: {mockDistribution.directMatch + mockDistribution.substitution + mockDistribution.notFound}%
          </div>
        </div>
      )}

      {/* ERP Connection Configuration (only show when not using mock data) */}
      {!useMockData && (
        <div>
          <div className="font-medium mb-2">ERP Connection</div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Host</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="localhost"
                value={connectionConfig.host}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, host: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Database</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="erp_database"
                value={connectionConfig.database}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, database: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Port</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="5432"
                value={connectionConfig.port}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action-specific help text */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-1">
          {ERP_ACTIONS.find(a => a.value === erpAction)?.label} Info
        </div>
        <div className="text-xs text-blue-700">
          {getActionDescription(erpAction)}
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