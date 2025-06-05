import { useState, useEffect, useRef } from "react";

interface AiOperatorSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function AiOperatorSidebar({ node, onChange }: AiOperatorSidebarProps) {
  const [prompt, setPrompt] = useState(node.data.prompt || "");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Update state when node changes
  useEffect(() => {
    setPrompt(node.data.prompt || "");
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, { 
      prompt 
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Prompt Section */}
      <div>
        <div className="font-medium mb-2">AI Prompt</div>
        <textarea
          className="w-full min-h-[120px] border rounded-lg p-2 text-sm"
          placeholder="Describe what the AI should do on the GUI..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* GUI Preview Section */}
      {node.data.runState === "running" && (
        <div>
          <div className="font-medium mb-2">GUI Preview</div>
          <video
            ref={videoRef}
            className="w-full rounded-lg"
            src="/ignition_operation.mp4"
            controls
            autoPlay
            onEnded={() => onChange(node.id, { runState: "done" })}
          />
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