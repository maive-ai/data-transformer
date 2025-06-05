"use client";

import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useRef, useReducer } from "react";
import { AiTransformSidebar } from "./workflow-sidebar-ai-transform";
import { ExcelExportSidebar } from "./workflow-sidebar-excel-export";

const INTEGRATIONS = [
  { name: "Gmail", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail" className="w-7 h-7" /> },
  { name: "Outlook", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/640px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" alt="Outlook" className="w-7 h-7" /> },
  { name: "SharePoint", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg/640px-Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg.png" alt="SharePoint" className="w-7 h-7" /> },
  { name: "Google Drive", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/640px-Google_Drive_icon_%282020%29.svg.png" alt="Google Drive" className="w-7 h-7" /> },
  { name: "Dropbox", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/640px-Dropbox_Icon.svg.png" alt="Dropbox" className="w-7 h-7" /> },
  { name: "Salesforce", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/640px-Salesforce.com_logo.svg.png " alt="Salesforce" className="w-7 h-7" /> },
];

// Define the state type
type NodeState = {
  integration: any;
  description: string;
  prompt: string;
  fileName: string;
  inputTypes: string[];
  outputType: string;
  uploadedFileName: string;
  outputFileName: string;
  useOutputTemplate: boolean;
  outputTemplateName: string;
  sheetNames: string[];
  endpoint: string;
  method: string;
  statusCode: number;
  contentType: string;

  decisionConditions: Array<{
    condition: string;
    outputPath: string;
  }>;
  defaultOutputPath: string;
};

// Define action type
type NodeAction = {
  type: 'UPDATE_NODE';
  payload: Partial<NodeState>;
};

// Initial state
const initialState: NodeState = {
  integration: null,
  description: "",
  prompt: "",
  fileName: "",
  inputTypes: [],
  outputType: "",
  uploadedFileName: "",
  outputFileName: "",
  useOutputTemplate: false,
  outputTemplateName: "",
  sheetNames: [],
  endpoint: "",
  method: "POST",
  statusCode: 200,
  contentType: "application/json",

  decisionConditions: [],
  defaultOutputPath: "",
};

// Reducer function
function nodeReducer(state: NodeState, action: NodeAction): NodeState {
  switch (action.type) {
    case 'UPDATE_NODE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function WorkflowSidebar({ node, onClose, onChange, runHistory = [], nodes = [], edges = [] }: {
  node: any;
  onClose: () => void;
  onChange: (id: string, newData: any) => void;
  runHistory?: Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>;
  nodes?: any[];
  edges?: any[];
}) {
  const [state, dispatch] = useReducer(nodeReducer, initialState);
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [outputFile, setOutputFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [xlsxTemplate, setXlsxTemplate] = useState<File | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Node-specific sidebar components will handle their own state

  // Update state when node changes
  useEffect(() => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        integration: node.data.integration || null,
        description: node.data.description || "",
        prompt: node.data.prompt || "",
        fileName: node.data.fileName || "",
        inputTypes: node.data.ioConfig?.inputTypes?.map((t: any) => t.type) || [],
        outputType: node.data.ioConfig?.outputType?.type || "",
        uploadedFileName: node.data.uploadedFileName || "",
        outputFileName: node.data.outputFileName || "",
        useOutputTemplate: node.data.useOutputTemplate || false,
        outputTemplateName: node.data.outputTemplateName || "",
        sheetNames: node.data.sheetNames || [],
        endpoint: node.data.endpoint || "",
        method: node.data.method || "POST",
        statusCode: node.data.statusCode || 200,
        contentType: node.data.contentType || "application/json",

        decisionConditions: node.data.decisionConditions || [],
        defaultOutputPath: node.data.defaultOutputPath || "",
      }
    });
  }, [node]);

  // Get number of input connections
  const inputConnections = useMemo(() => {
    if (!edges || !node) return 0;
    return edges.filter(e => e.target === node.id).length;
  }, [edges, node]);

  // Ensure inputTypes array matches number of input connections
  useEffect(() => {
    if (node.type === "action") {
      const currentTypes = [...state.inputTypes];
      while (currentTypes.length < inputConnections) {
        currentTypes.push("");
      }
      if (currentTypes.length > inputConnections) {
        currentTypes.splice(inputConnections);
      }
      dispatch({ type: 'UPDATE_NODE', payload: { inputTypes: currentTypes } });
    }
  }, [inputConnections, node.type]);

  // For Excel Export node: compute inbound CSV count based on actual edges
  const inboundCsvCount = useMemo(() => {
    if (node.type !== 'output' || node.data.type !== 'excel') return 0;
    const inboundEdges = edges.filter(e => e.target === node.id);
    let count = 0;
    for (const edge of inboundEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.data?.ioConfig?.outputType?.type === 'csv') {
        count++;
      }
    }
    return count || 1;
  }, [node, nodes, edges]);

  // Ensure sheetNames array matches inboundCsvCount
  useEffect(() => {
    if (node.type === 'output' && node.data.type === 'excel') {
      let names = state.sheetNames.slice();
      while (names.length < inboundCsvCount) names.push(`Sheet${names.length + 1}`);
      if (names.length > inboundCsvCount) names = names.slice(0, inboundCsvCount);
      dispatch({ type: 'UPDATE_NODE', payload: { sheetNames: names } });
    }
  }, [inboundCsvCount, node.id]);

  const handleIntegrationSelect = (integration: any) => {
    dispatch({ type: 'UPDATE_NODE', payload: { integration } });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { description: e.target.value } });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { prompt: e.target.value } });
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { fileName: e.target.value } });
  };

  const handleOutputTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Upload the template file to the server
      const formData = new FormData();
      formData.append('file', file);
      // Use /api/upload, but expect backend to save to /public/templates if it's a template
      const response = await fetch('/api/upload?template=1', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        // Store the template URL and name in node data only
        onChange(node.id, { outputTemplateUrl: url, outputTemplateName: file.name });
        dispatch({ type: 'UPDATE_NODE', payload: { outputTemplateName: file.name } });
      }
    }
  };

  const handleInputTypeChange = (type: string, index: number) => {
    const newTypes = [...state.inputTypes];
    newTypes[index] = type;
    dispatch({ type: 'UPDATE_NODE', payload: { inputTypes: newTypes } });
    if (type === "mp4") {
      dispatch({ type: 'UPDATE_NODE', payload: { outputType: "json" } });
      onChange(node.id, { 
        outputFileName: "P-650-WTH-BKM.json",
        ioConfig: {
          inputTypes: newTypes.map(t => ({ type: t })),
          outputType: { type: "json" }
        }
      });
    }
  };

  const handleOutputTypeChange = (type: string) => {
    dispatch({ type: 'UPDATE_NODE', payload: { outputType: type } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      dispatch({ type: 'UPDATE_NODE', payload: { uploadedFileName: file.name } });
      onChange(node.id, { 
        uploadedFileName: file.name,
        ioConfig: {
          inputTypes: [],
          outputType: { type: file.name.split('.').pop()?.toLowerCase() || "" }
        }
      });
    }
  };

  const handleOutputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setOutputFile(e.target.files[0]);
      dispatch({ type: 'UPDATE_NODE', payload: { outputFileName: e.target.files[0].name } });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (node.type === "httpTrigger") {
      await onChange(node.id, { endpoint: state.endpoint, method: state.method });
    } else if (node.type === "httpResponse") {
      await onChange(node.id, { statusCode: state.statusCode, contentType: state.contentType });
    } else if (node.type === "aiOperator") {
      await onChange(node.id, { prompt: state.prompt });
    } else if (node.type === "trigger" && node.data.type === "event") {
      await onChange(node.id, { integration: state.integration, description: state.description });
    } else if (node.type === "trigger" && node.data.type === "manual") {
      await onChange(node.id, { 
        uploadedFileName: state.uploadedFileName,
        ioConfig: {
          inputTypes: [],
          outputType: { type: uploadedFile?.name.split('.')?.pop()?.toLowerCase() || "csv" }
        }
      });
    } else if (node.type === "action" && node.data.type === "decision") {
      await onChange(node.id, {
        decisionConditions: state.decisionConditions,
        defaultOutputPath: state.defaultOutputPath,
        ioConfig: {
          inputTypes: state.inputTypes.map(type => ({ type })),
          outputType: { type: "decision" }
        }
      });
    } else if (node.type === "action" && node.data.label === "AI Transform") {
      // AI Transform node handles its own save logic
      return;
    } else if (node.type === "action") {
      if (state.inputTypes[0] === "mp4") {
        await onChange(node.id, { 
          prompt: state.prompt,
          outputFileName: "P-650-WTH-BKM.json",
          ioConfig: {
            inputTypes: [{ type: "mp4" }],
            outputType: { type: "json" }
          }
        });
      } else {
        await onChange(node.id, { 
          prompt: state.prompt, 
          outputFileName: state.outputFileName,
          useOutputTemplate: state.useOutputTemplate,
          ioConfig: {
            inputTypes: state.inputTypes.map(type => ({ type })),
            outputType: { type: state.outputType }
          }
        });
      }
    } else if (node.type === "output" && node.data.type === "excel") {
      // Excel Export node handles its own save logic
      return;
    } else if (node.type === "output" && node.data.type === "doc") {
      await onChange(node.id, {
        fileName: "Standard Operating Procedure_ Toothbrush Holder Assembly.docx",
        ioConfig: {
          inputTypes: [],
          outputType: { type: "doc" }
        }
      });
    }
    setSaving(false);
    onClose();
  };

  // Add decision node handlers
  const handleAddCondition = () => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        decisionConditions: [
          ...state.decisionConditions,
          { condition: '', outputPath: '' }
        ]
      }
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...state.decisionConditions];
    newConditions.splice(index, 1);
    dispatch({
      type: 'UPDATE_NODE',
      payload: { decisionConditions: newConditions }
    });
  };

  const handleConditionChange = (index: number, field: 'condition' | 'outputPath', value: string) => {
    const newConditions = [...state.decisionConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    dispatch({
      type: 'UPDATE_NODE',
      payload: { decisionConditions: newConditions }
    });
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-lg truncate" title={node.data.label || state.fileName || 'Node'}>{node.data.label || state.fileName || 'Node'}</div>
          <button
            type="button"
            aria-label="Node information"
            onClick={() => setShowInfoModal(true)}
            className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0 }}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {/* Info Modal */}
        {showInfoModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
            onClick={() => setShowInfoModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative"
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowInfoModal(false)}><X className="w-5 h-5" /></button>
              <div className="font-semibold text-lg mb-4">{node.data.label || state.fileName || 'Node'}</div>
              <p className="text-base text-gray-800">
                {node.type === "output" && node.data.type === "excel"
                  ? "This node accepts CSV files as input and converts them to Excel format."
                  : node.type === "trigger" && node.data.type === "event"
                  ? "This node triggers when an event occurs in the selected integration."
                  : node.type === "trigger" && node.data.type === "manual"
                  ? "This node will prompt for one or more PDF uploads when the pipeline runs."
                  : node.type === "action"
                  ? "This node performs an AI-powered transformation on the input file(s)."
                  : node.type === "output" && node.data.type === "doc"
                  ? "This node will generate a Word document from the input file(s)."
                  : "No additional details for this node type."}
              </p>
            </div>
          </div>
        )}
        {node.type === "httpTrigger" ? (
          <div className="space-y-6">
            <div>
              <div className="font-medium mb-2">HTTP Method</div>
              <select
                className="w-full border rounded-lg p-2 text-sm"
                value={state.method}
                onChange={(e) => dispatch({ type: 'UPDATE_NODE', payload: { method: e.target.value } })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <div className="font-medium mb-2">Endpoint</div>
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="/api/webhook"
                value={state.endpoint}
                onChange={(e) => dispatch({ type: 'UPDATE_NODE', payload: { endpoint: e.target.value } })}
              />
            </div>
          </div>
        ) : node.type === "httpResponse" ? (
          <div className="space-y-6">
            <div>
              <div className="font-medium mb-2">Status Code</div>
              <input
                type="number"
                className="w-full border rounded-lg p-2 text-sm"
                value={state.statusCode}
                onChange={(e) => dispatch({ type: 'UPDATE_NODE', payload: { statusCode: parseInt(e.target.value) } })}
              />
            </div>
            <div>
              <div className="font-medium mb-2">Content Type</div>
              <select
                className="w-full border rounded-lg p-2 text-sm"
                value={state.contentType}
                onChange={(e) => dispatch({ type: 'UPDATE_NODE', payload: { contentType: e.target.value } })}
              >
                <option value="application/json">application/json</option>
                <option value="application/xml">application/xml</option>
                <option value="text/plain">text/plain</option>
                <option value="text/html">text/html</option>
              </select>
            </div>
            {typeof node.data.responseValue !== 'undefined' && (
              <div className="p-4 bg-green-50 border rounded-lg flex flex-col items-start gap-2">
                <div className="font-medium text-sm">HTTP Response</div>
                <div className="text-xs text-gray-700">Status: <span className="font-semibold">{node.data.responseStatus}</span></div>
                <div className="text-xs text-gray-700">Value: <span className="font-semibold">{node.data.responseValue}</span></div>
              </div>
            )}
          </div>
        ) : node.type === "aiOperator" ? (
          <div className="space-y-6">
            <div>
              <div className="font-medium mb-2">AI Prompt</div>
              <textarea
                className="w-full min-h-[120px] border rounded-lg p-2 text-sm"
                placeholder="Describe what the AI should do on the GUI..."
                value={state.prompt}
                onChange={(e) => dispatch({ type: 'UPDATE_NODE', payload: { prompt: e.target.value } })}
              />
            </div>
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
          </div>
        ) : node.type === "trigger" && node.data.type === "event" ? (
          <>
            <div className="mb-6">
              <div className="font-medium mb-2">Integration</div>
              <div className="grid grid-cols-3 gap-3">
                {INTEGRATIONS.map((int) => (
                  <button
                    key={int.name}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition hover:bg-gray-100 ${state.integration?.name === int.name ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
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
                value={state.description}
                onChange={handleDescriptionChange}
              />
            </div>
          </>
        ) : node.type === "trigger" && node.data.type === "manual" ? (
          <>
            {/* Only show run history and other relevant sections for manual trigger node */}
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.pdf,.doc,.docx,.mp4,.txt,text/plain,text/*"
              onChange={handleFileUpload}
            />
          </>
        ) : node.type === "action" && node.data.label === "AI Transform" ? (
          <AiTransformSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === "output" && node.data.type === "excel" ? (
          <ExcelExportSidebar 
            node={node} 
            onChange={onChange}
            edges={edges}
            nodes={nodes}
          />
        ) : node.type === "action" && node.data.type === "decision" ? (
          <div className="space-y-6">
            {/* Decision Conditions Section */}
            <div>
              <div className="font-medium mb-2">Decision Conditions</div>
              <div className="space-y-4">
                {state.decisionConditions.map((condition, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-sm">Condition {index + 1}</div>
                      <button
                        onClick={() => handleRemoveCondition(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Condition</div>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 text-sm"
                          placeholder="e.g., value > 100"
                          value={condition.condition}
                          onChange={(e) => handleConditionChange(index, 'condition', e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Output Path Label</div>
                        <input
                          type="text"
                          className="w-full border rounded-lg p-2 text-sm"
                          placeholder="e.g., High Value"
                          value={condition.outputPath}
                          onChange={(e) => handleConditionChange(index, 'outputPath', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddCondition}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  + Add Condition
                </button>
              </div>
            </div>
            {/* Default Output Path Section */}
            <div>
              <div className="font-medium mb-2">Default Output Path</div>
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="e.g., Default"
                value={state.defaultOutputPath}
                onChange={(e) => dispatch({ type: 'UPDATE_NODE', payload: { defaultOutputPath: e.target.value } })}
              />
              <p className="text-xs text-gray-500 mt-1">This path will be used when no conditions are met</p>
            </div>
          </div>

        ) : node.type === "output" && node.data.type === "doc" ? (
          <div className="space-y-6">
            <div>
              <div className="font-medium mb-2">Output File</div>
              <div className="text-sm text-gray-600">
                This node will always output: <span className="font-medium">Standard Operating Procedure_ Toothbrush Holder Assembly.docx</span>
              </div>
            </div>
            {/* Download section for Doc output node after run */}
            <div className="flex flex-col items-start gap-2 p-4 border rounded-lg bg-blue-50">
              <div className="font-medium text-sm">Download Output</div>
              <div className="text-xs text-gray-700 mb-2">Standard Operating Procedure_ Toothbrush Holder Assembly.docx</div>
              <button
                onClick={async () => {
                  const fileUrl = "/static/Standard Operating Procedure_ Toothbrush Holder Assembly.docx";
                  try {
                    // Try to use the File System Access API if available
                    if ('showSaveFilePicker' in window) {
                      const handle = await window.showSaveFilePicker({
                        suggestedName: "Standard Operating Procedure_ Toothbrush Holder Assembly.docx",
                        types: [{
                          description: 'Word Document',
                          accept: {
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                          }
                        }]
                      });
                      const writable = await handle.createWritable();
                      const response = await fetch(fileUrl);
                      const blob = await response.blob();
                      await writable.write(blob);
                      await writable.close();
                    } else {
                      // Fallback for browsers that don't support File System Access API
                      const downloadLink = document.createElement('a');
                      downloadLink.href = fileUrl;
                      downloadLink.download = "Standard Operating Procedure_ Toothbrush Holder Assembly.docx";
                      downloadLink.click();
                    }
                  } catch (err) {
                    // If user cancels or there's an error, fall back to standard download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = fileUrl;
                    downloadLink.download = "Standard Operating Procedure_ Toothbrush Holder Assembly.docx";
                    downloadLink.click();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition"
              >
                Download File
              </button>
            </div>
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
      {/* Save button only shown for node types that use the general reducer */}
      {!(node.type === "action" && node.data.label === "AI Transform") && 
       !(node.type === "output" && node.data.type === "excel") && (
        <div className="absolute bottom-0 left-0 w-full flex justify-center pb-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
          <Button
            className="pointer-events-auto px-8 py-2 rounded-xl shadow-lg font-semibold text-base"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
} 