"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const INTEGRATIONS = [
  { name: "Gmail", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail" className="w-7 h-7" /> },
  { name: "Outlook", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/640px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" alt="Outlook" className="w-7 h-7" /> },
  { name: "SharePoint", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg/640px-Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg.png" alt="SharePoint" className="w-7 h-7" /> },
  { name: "Google Drive", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/640px-Google_Drive_icon_%282020%29.svg.png" alt="Google Drive" className="w-7 h-7" /> },
  { name: "Dropbox", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/640px-Dropbox_Icon.svg.png" alt="Dropbox" className="w-7 h-7" /> },
  { name: "Salesforce", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/640px-Salesforce.com_logo.svg.png " alt="Salesforce" className="w-7 h-7" /> },
];

export function WorkflowSidebar({ node, onClose, onChange, runHistory = [] }: {
  node: any;
  onClose: () => void;
  onChange: (id: string, newData: any) => void;
  runHistory?: Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>;
}) {
  // For event trigger: integration and description
  const [integration, setIntegration] = useState(node.data.integration || null);
  const [description, setDescription] = useState(node.data.description || "");
  const [prompt, setPrompt] = useState(node.data.prompt || "");
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState(node.data.fileName || "");
  const [outputTemplate, setOutputTemplate] = useState<File | null>(null);
  const [outputTemplateName, setOutputTemplateName] = useState(node.data.outputTemplateName || "");
  const [exampleInput, setExampleInput] = useState<File | null>(null);
  const [exampleInputName, setExampleInputName] = useState(node.data.exampleInputName || "");
  const [exampleOutput, setExampleOutput] = useState<File | null>(null);
  const [exampleOutputName, setExampleOutputName] = useState(node.data.exampleOutputName || "");

  const handleIntegrationSelect = (integration: any) => {
    setIntegration(integration);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value);
  };

  const handleOutputTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setOutputTemplate(e.target.files[0]);
      setOutputTemplateName(e.target.files[0].name);
    }
  };

  const handleExampleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExampleInput(e.target.files[0]);
      setExampleInputName(e.target.files[0].name);
    }
  };

  const handleExampleOutputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExampleOutput(e.target.files[0]);
      setExampleOutputName(e.target.files[0].name);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (node.type === "trigger" && node.data.type === "event") {
      await onChange(node.id, { integration, description });
    } else if (node.type === "action") {
      await onChange(node.id, { prompt, exampleInputName, exampleOutputName });
    } else if (node.type === "output" && node.data.type === "excel") {
      await onChange(node.id, {
        fileName,
        outputTemplateName,
        // Optionally, you could upload the file to a backend or store its contents here
      });
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="font-semibold text-lg">Node Details</div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {node.type === "trigger" && node.data.type === "event" ? (
          <>
            <div className="mb-6">
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
            <div>
              <div className="font-medium mb-2">Trigger Prompt</div>
              <textarea
                className="w-full min-h-[80px] border rounded-lg p-2 text-sm"
                placeholder="Describe what should happen when this event occurs..."
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>
          </>
        ) : node.type === "action" ? (
          <div className="space-y-6">
            <div>
              <div className="font-medium mb-2">Example Input</div>
              <label className="block w-full border-dashed border-2 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleExampleInputChange}
                />
                {exampleInputName ? (
                  <span className="text-sm">{exampleInputName}</span>
                ) : (
                  <span className="text-gray-400 text-sm">Click to upload an example input file</span>
                )}
              </label>
            </div>
            <div>
              <div className="font-medium mb-2">Transform Prompt</div>
              <textarea
                className="w-full min-h-[120px] border rounded-lg p-2 text-sm"
                placeholder="Describe the AI processing step..."
                value={prompt}
                onChange={handlePromptChange}
              />
            </div>
            <div>
              <div className="font-medium mb-2">Example Output</div>
              <label className="block w-full border-dashed border-2 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleExampleOutputChange}
                />
                {exampleOutputName ? (
                  <span className="text-sm">{exampleOutputName}</span>
                ) : (
                  <span className="text-gray-400 text-sm">Click to upload an example output file</span>
                )}
              </label>
            </div>
          </div>
        ) : node.type === "output" && node.data.type === "excel" ? (
          <div className="space-y-6">
            <div>
              <div className="font-medium mb-2">Output File Name</div>
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="output.xlsx"
                value={fileName}
                onChange={handleFileNameChange}
              />
            </div>
            {/* Download section for Excel output node after run */}
            {runHistory.length > 0 && (
              <div className="flex flex-col items-start gap-2 p-4 border rounded-lg bg-green-50">
                <div className="font-medium text-sm">Download Output</div>
                <div className="text-xs text-gray-700 mb-2">WO-2025-05-0015.xlsx</div>
                <a
                  href="/transformed/WO-2025-05-0015.xlsx"
                  download
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow hover:bg-green-700 transition"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Implementation details for this node type coming soon.</div>
        )}
        {/* Run History Section */}
        <div className="mt-8">
          <div className="font-semibold mb-2 text-base">Run History</div>
          {runHistory.length === 0 ? (
            <div className="text-gray-400 text-sm">No runs yet.</div>
          ) : (
            <ul className="space-y-2">
              {runHistory.slice().reverse().map((run, i) => (
                <li key={i} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{new Date(run.timestamp).toLocaleString()}</span>
                    <span className={run.status === 'done' ? 'text-green-600' : 'text-gray-500'}>{run.status}</span>
                  </div>
                  {run.inputFile && <div className="text-xs text-gray-600">Input: {run.inputFile}</div>}
                  {run.outputFile && <div className="text-xs text-gray-600">Output: {run.outputFile}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full flex justify-center pb-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
        <Button
          className="pointer-events-auto px-8 py-2 rounded-xl shadow-lg font-semibold text-base"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
} 