import { useState, useEffect } from "react";
import { ErpAction, ErpActionLabel, FileType } from "@/types/enums";
import { Info, X, Maximize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ErpSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

const ERP_ACTIONS = [
  { value: ErpAction.BOM_LOOKUP, label: ErpActionLabel.BOM_LOOKUP },
  { value: ErpAction.BOM_GENERATION, label: ErpActionLabel.BOM_GENERATION },
  { value: ErpAction.INVENTORY_CHECK, label: ErpActionLabel.INVENTORY_CHECK },
  { value: ErpAction.PRICE_LOOKUP, label: ErpActionLabel.PRICE_LOOKUP },
  { value: ErpAction.SUPPLIER_LOOKUP, label: ErpActionLabel.SUPPLIER_LOOKUP },
  { value: ErpAction.LEAD_TIME_CHECK, label: ErpActionLabel.LEAD_TIME_CHECK },
  { value: ErpAction.ALTERNATE_PARTS, label: ErpActionLabel.ALTERNATE_PARTS },
  { value: ErpAction.COMPLIANCE_CHECK, label: ErpActionLabel.COMPLIANCE_CHECK },
];

// Hardcoded mock parameters
const HARDCODED_MOCK_DISTRIBUTION = {
  directMatch: 80,
  substitution: 10,
  notFound: 10,
};

export function ErpSidebar({ node, onChange }: ErpSidebarProps) {
  const [erpAction, setErpAction] = useState(node.data.erpAction || ErpAction.BOM_LOOKUP);
  const [showActionInfo, setShowActionInfo] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [hardcodedCsvFile, setHardcodedCsvFile] = useState<File | null>(null);

  // Update state when node changes
  useEffect(() => {
    setErpAction(node.data.erpAction || ErpAction.BOM_LOOKUP);
  }, [node]);

  // Fetch the hardcoded CSV file when in BOM Generation mode
  useEffect(() => {
    if (erpAction === ErpAction.BOM_GENERATION) {
      fetch('/artifacts/completed_bom_with_status.csv')
        .then(res => res.blob())
        .then(blob => {
          setHardcodedCsvFile(new File([blob], 'completed_bom_with_status.csv', { type: 'text/csv' }));
        });
    }
  }, [erpAction]);

  const handleSave = async () => {
    await onChange(node.id, {
      erpAction,
      // Always use hardcoded mock parameters
      mockDistribution: HARDCODED_MOCK_DISTRIBUTION,
      useMockData: true,
      ioConfig: {
        inputTypes: [{ type: FileType.CSV }], // ERP nodes typically work with CSV/structured data
        outputType: { type: FileType.CSV }
      }
    });
  };

  const getActionDescription = (action: ErpAction): string => {
    switch (action) {
      case ErpAction.BOM_LOOKUP:
        return "Looks up part numbers from BOM data and returns availability status, substitutions, and basic part information.";
      case ErpAction.BOM_GENERATION:
        return "Generates a complete BOM (Bill of Materials) from design requirements, including part specifications, quantities, and assembly structure.";
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
        <div className="flex items-center gap-2 mb-2">
          <div className="font-medium">ERP Action</div>
          <button
            type="button"
            aria-label="Action information"
            onClick={() => setShowActionInfo(true)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0 }}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
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

      {/* Action Info Modal */}
      {showActionInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
          onClick={() => setShowActionInfo(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" 
              onClick={() => setShowActionInfo(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="font-semibold text-lg mb-4">
              {ERP_ACTIONS.find(a => a.value === erpAction)?.label} Info
            </div>
            <p className="text-base text-gray-800">
              {getActionDescription(erpAction)}
            </p>
          </div>
        </div>
      )}

      {/* CSV Preview for BOM Generation */}
      {erpAction === ErpAction.BOM_GENERATION && hardcodedCsvFile && (
        <div className="border rounded-lg p-3 bg-gray-50 relative">
          <div className="font-medium mb-2 flex items-center justify-between">
            <span>Data Added to ERP</span>
            <button
              className="p-1 text-gray-500 hover:text-gray-800 rounded transition absolute right-2 top-2 bg-white"
              title="Expand preview"
              onClick={() => setShowCsvModal(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <CsvPreview file={hardcodedCsvFile} />
          <Dialog open={showCsvModal} onOpenChange={setShowCsvModal}>
            <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-lg">Data Added to ERP</div>
              </div>
              <div className="flex-1 overflow-auto">
                <CsvPreview file={hardcodedCsvFile} full />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

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

// Helper component to preview a CSV file as a table
function CsvPreview({ file, full = false }: { file: File, full?: boolean }) {
  const [rows, setRows] = useState<string[][]>([]);
  useEffect(() => {
    if (!file) return;
    file.text().then(text => {
      const lines = text.split('\n').filter(Boolean);
      const parsed = lines.map(line => line.split(','));
      setRows(full ? parsed : parsed.slice(0, 11)); // header + 10 rows unless full
    });
  }, [file, full]);
  if (!file) return null;
  if (rows.length === 0) return <div className="text-xs text-gray-400">Loading preview...</div>;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border w-full">
        <thead>
          <tr>
            {rows[0]?.map((cell, i) => <th key={i} className="border px-2 py-1 bg-gray-100">{cell}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} className="border px-2 py-1">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!full && rows.length === 11 && <div className="text-xs text-gray-400 mt-1">Showing first 10 rows</div>}
    </div>
  );
} 