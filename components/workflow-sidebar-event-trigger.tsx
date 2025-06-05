import { useState, useEffect } from "react";

const INTEGRATIONS = [
  { name: "Gmail", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail" className="w-7 h-7" /> },
  { name: "Outlook", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/640px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" alt="Outlook" className="w-7 h-7" /> },
  { name: "SharePoint", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg/640px-Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg.png" alt="SharePoint" className="w-7 h-7" /> },
  { name: "Google Drive", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/640px-Google_Drive_icon_%282020%29.svg.png" alt="Google Drive" className="w-7 h-7" /> },
  { name: "Dropbox", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/640px-Dropbox_Icon.svg.png" alt="Dropbox" className="w-7 h-7" /> },
  { name: "Salesforce", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/640px-Salesforce.com_logo.svg.png " alt="Salesforce" className="w-7 h-7" /> },
];

interface EventTriggerSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function EventTriggerSidebar({ node, onChange }: EventTriggerSidebarProps) {
  const [integration, setIntegration] = useState(node.data.integration || null);
  const [description, setDescription] = useState(node.data.description || "");

  // Update state when node changes
  useEffect(() => {
    setIntegration(node.data.integration || null);
    setDescription(node.data.description || "");
  }, [node]);

  const handleIntegrationSelect = (selectedIntegration: any) => {
    setIntegration(selectedIntegration);
  };

  const handleSave = async () => {
    await onChange(node.id, { 
      integration, 
      description 
    });
  };

  return (
    <div className="space-y-6">
      {/* Integration Section */}
      <div>
        <div className="font-medium mb-2">Integration</div>
        <div className="grid grid-cols-3 gap-3">
          {INTEGRATIONS.map((int) => (
            <button
              key={int.name}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition hover:bg-gray-100 ${integration?.name === int.name ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
              onClick={() => handleIntegrationSelect(int)}
            >
              <span className="mb-1">{int.icon}</span>
              <span className="text-xs font-medium">{int.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trigger Prompt Section */}
      <div>
        <div className="font-medium mb-2">Trigger Prompt</div>
        <textarea
          className="w-full min-h-[80px] border rounded-lg p-2 text-sm"
          placeholder="Describe what should happen when this event occurs..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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