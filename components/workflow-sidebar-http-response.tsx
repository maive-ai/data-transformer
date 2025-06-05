import { useState, useEffect } from "react";

interface HttpResponseSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function HttpResponseSidebar({ node, onChange }: HttpResponseSidebarProps) {
  const [statusCode, setStatusCode] = useState(node.data.statusCode || 200);
  const [contentType, setContentType] = useState(node.data.contentType || "application/json");

  // Update state when node changes
  useEffect(() => {
    setStatusCode(node.data.statusCode || 200);
    setContentType(node.data.contentType || "application/json");
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, { 
      statusCode, 
      contentType 
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Code Section */}
      <div>
        <div className="font-medium mb-2">Status Code</div>
        <input
          type="number"
          className="w-full border rounded-lg p-2 text-sm"
          value={statusCode}
          onChange={(e) => setStatusCode(parseInt(e.target.value))}
        />
      </div>

      {/* Content Type Section */}
      <div>
        <div className="font-medium mb-2">Content Type</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
        >
          <option value="application/json">application/json</option>
          <option value="application/xml">application/xml</option>
          <option value="text/plain">text/plain</option>
          <option value="text/html">text/html</option>
        </select>
      </div>

      {/* Response Display Section */}
      {typeof node.data.responseValue !== 'undefined' && (
        <div className="p-4 bg-green-50 border rounded-lg flex flex-col items-start gap-2">
          <div className="font-medium text-sm">HTTP Response</div>
          <div className="text-xs text-gray-700">Status: <span className="font-semibold">{node.data.responseStatus}</span></div>
          <div className="text-xs text-gray-700">Value: <span className="font-semibold">{node.data.responseValue}</span></div>
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