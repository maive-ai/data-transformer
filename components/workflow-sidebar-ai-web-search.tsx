import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { JsonDisplay } from '@/components/ui/json-display';
import { X, Plus } from 'lucide-react';

interface AiWebSearchSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

// Hardcoded test data: array of components/parts
const testWebSearchData = [
  {
    manufacturer: "TE Connectivity",
    part_number: "CRG0603F10K",
    description: "10kΩ 0603 1% Resistor",
    stock: 937853,
    price: "$0.00696",
    specifications: {
      resistance: "10kΩ",
      tolerance: "±1%",
      power_rating: "0.1W",
      package: "0603",
      temperature_coefficient: "±100ppm/°C"
    },
    suppliers: [
      {
        name: "Digi-Key",
        stock: 937853,
        price: "$0.00696",
        shipping: "Same-day"
      },
      {
        name: "Mouser",
        stock: 560351,
        price: "$0.00800",
        shipping: "Same-day"
      }
    ]
  },
  {
    manufacturer: "ams OSRAM",
    part_number: "AS1115-BSST",
    description: "LED Driver 24-QSOP",
    stock: 4360,
    price: "$1.540000",
    specifications: {
      package: "24-QSOP",
      operating_temperature: "-40°C to +125°C",
      supply_voltage: "4.5V to 5.5V",
      output_current: "40mA per segment"
    },
    features: [
      "8-digit LED driver",
      "I2C interface",
      "Programmable brightness",
      "Low power consumption"
    ]
  }
];

export function AiWebSearchSidebar({ node, onChange }: AiWebSearchSidebarProps) {
  const [prompt, setPrompt] = useState(node.data.prompt || '');
  const [websites, setWebsites] = useState<string[]>(node.data.websites || ['']);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPrompt(node.data.prompt || '');
    setWebsites(node.data.websites || ['']);
  }, [node.data]);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    onChange(node.id, { ...node.data, prompt: value });
  };

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
      <div>
        <h3 className="text-lg font-semibold mb-2">AI Web Search</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure AI-powered web scraping to extract structured data from websites.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Search Prompt
          </label>
          <Textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Describe what data you want to extract from the websites..."
            className="min-h-[100px]"
          />
        </div>

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
          <h4 className="text-md font-medium mb-2">Output</h4>
          <p className="text-sm text-gray-600 mb-3">
            Extracted data from web search results
          </p>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <JsonDisplay 
            data={testWebSearchData} 
            className="max-h-96 overflow-auto"
          />
        </div>
      </div>
    </div>
  );
} 