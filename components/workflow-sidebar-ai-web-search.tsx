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
  const [websites, setWebsites] = useState<string[]>(node.data.websites || ['']);

  useEffect(() => {
    setWebsites(node.data.websites || ['']);
  }, [node.data]);

  const handleWebsiteChange = (index: number, value: string) => {
    const newWebsites = [...websites];
    newWebsites[index] = value;
    setWebsites(newWebsites);
    onChange(node.id, { ...node.data, websites: newWebsites });
  };

  const addWebsite = () => {
    const newWebsites = [...websites, ''];
    setWebsites(newWebsites);
    onChange(node.id, { ...node.data, websites: newWebsites });
  };

  const removeWebsite = (index: number) => {
    const newWebsites = websites.filter((_, i) => i !== index);
    setWebsites(newWebsites);
    onChange(node.id, { ...node.data, websites: newWebsites });
  };

  return (
    <div className="p-4 space-y-6">


      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Target Websites
          </label>
          <div className="space-y-2">
            {websites.map((website, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={website}
                  onChange={(e) => handleWebsiteChange(index, e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                {websites.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeWebsite(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addWebsite}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Website
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
        
        {node.data.runState === 'done' && node.data.enrichedData ? (
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