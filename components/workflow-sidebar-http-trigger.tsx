import { useState, useEffect } from "react";

interface HttpTriggerSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function HttpTriggerSidebar({ node, onChange }: HttpTriggerSidebarProps) {
  const [endpoint, setEndpoint] = useState(node.data.endpoint || "");
  const [method, setMethod] = useState(node.data.method || "POST");

  // Update state when node changes
  useEffect(() => {
    setEndpoint(node.data.endpoint || "");
    setMethod(node.data.method || "POST");
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, { 
      endpoint, 
      method 
    });
  };

  return (
    <div className="space-y-6">
      {/* HTTP Method Section */}
      <div>
        <div className="font-medium mb-2">HTTP Method</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* Endpoint Section */}
      <div>
        <div className="font-medium mb-2">Endpoint</div>
        <input
          type="text"
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="/api/webhook"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
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