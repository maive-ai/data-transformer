import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { JsonDisplay } from '@/components/ui/json-display';

interface AiWebSearchSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function AiWebSearchSidebar({ node, onChange }: AiWebSearchSidebarProps) {
  const [approvedSuppliers, setApprovedSuppliers] = useState<string[]>(node.data.approvedSuppliers || []);

  useEffect(() => {
    setApprovedSuppliers(node.data.approvedSuppliers || []);
  }, [node.data]);

  const handleSupplierChange = (index: number, value: string) => {
    const newSuppliers = [...approvedSuppliers];
    newSuppliers[index] = value;
    setApprovedSuppliers(newSuppliers);
    onChange(node.id, { ...node.data, approvedSuppliers: newSuppliers });
  };

  const addSupplier = () => {
    const newSuppliers = [...approvedSuppliers, ''];
    setApprovedSuppliers(newSuppliers);
    onChange(node.id, { ...node.data, approvedSuppliers: newSuppliers });
  };

  const removeSupplier = (index: number) => {
    const newSuppliers = approvedSuppliers.filter((_, i) => i !== index);
    setApprovedSuppliers(newSuppliers);
    onChange(node.id, { ...node.data, approvedSuppliers: newSuppliers });
  };

  return (
    <div className="p-4 space-y-6">


      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-2">
            Approved Suppliers
          </label>
          <div className="space-y-2">
            {approvedSuppliers.map((supplier, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={supplier}
                  onChange={(e) => handleSupplierChange(index, e.target.value)}
                  placeholder="e.g. DigiKey"
                  className="flex-1"
                />
                {approvedSuppliers.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeSupplier(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addSupplier}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium mb-2">Search Results</h4>
        </div>
        
        {node.data.runState === 'running' && (
          <div className="border rounded-lg p-4 bg-blue-50">
            <p className="text-sm text-blue-600">Searching components...</p>
          </div>
        )}
        
        {node.data.enrichedData ? (
          <div className="border rounded-lg p-4 bg-gray-50">
            <JsonDisplay data={node.data.enrichedData} className="max-h-96 overflow-auto" />
          </div>
        ) : node.data.runState === 'done' && !node.data.enrichedData ? (
          <div className="border rounded-lg p-4 bg-yellow-50">
            <p className="text-sm text-yellow-600">No enriched data available</p>
          </div>
        ) : node.data.runState === 'error' ? (
          <div className="border rounded-lg p-4 bg-red-50">
            <p className="text-sm text-red-600">Error occurred during search</p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Run the pipeline to see results</p>
          </div>
        )}
      </div>
    </div>
  );
} 