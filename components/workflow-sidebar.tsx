"use client";

import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useRef, useReducer } from "react";
import { AiTransformSidebar } from "./workflow-sidebar-ai-transform";
import { ExcelExportSidebar } from "./workflow-sidebar-excel-export";
import { HttpTriggerSidebar } from "./workflow-sidebar-http-trigger";
import { HttpResponseSidebar } from "./workflow-sidebar-http-response";
import { AiOperatorSidebar } from "./workflow-sidebar-ai-operator";
import { EventTriggerSidebar } from "./workflow-sidebar-event-trigger";
import { DecisionSidebar } from "./workflow-sidebar-decision";
import { DocExportSidebar } from "./workflow-sidebar-doc-export";
import { ErpSidebar } from "./workflow-sidebar-erp";
import { IntegrationSidebar } from "./workflow-sidebar-integration";
import { CsvAppendSidebar } from "./workflow-sidebar-csv-append";
import { AiWebSearchSidebar } from './workflow-sidebar-ai-web-search';
import { NodeType, TriggerSubType, OutputSubType, ActionSubType, FileType, NodeLabel } from "@/types/enums";



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
    if (node.type === NodeType.ACTION) {
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
    if (node.type !== NodeType.OUTPUT || node.data.type !== OutputSubType.EXCEL) return 0;
    const inboundEdges = edges.filter(e => e.target === node.id);
    let count = 0;
    for (const edge of inboundEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.data?.ioConfig?.outputType?.type === FileType.CSV) {
        count++;
      }
    }
    return count || 1;
  }, [node, nodes, edges]);

  // Ensure sheetNames array matches inboundCsvCount
  useEffect(() => {
    if (node.type === NodeType.OUTPUT && node.data.type === OutputSubType.EXCEL) {
      let names = state.sheetNames.slice();
      while (names.length < inboundCsvCount) names.push(`Sheet${names.length + 1}`);
      if (names.length > inboundCsvCount) names = names.slice(0, inboundCsvCount);
      dispatch({ type: 'UPDATE_NODE', payload: { sheetNames: names } });
    }
  }, [inboundCsvCount, node.id]);



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
    if (node.type === NodeType.TRIGGER && node.data.type === TriggerSubType.MANUAL) {
      await onChange(node.id, { 
        uploadedFileName: state.uploadedFileName,
        ioConfig: {
          inputTypes: [],
          outputType: { type: uploadedFile?.name.split('.')?.pop()?.toLowerCase() || FileType.CSV }
        }
      });
    } else if (node.type === NodeType.ACTION && node.data.label === NodeLabel.AI_TRANSFORM) {
      // Structured Generation node handles its own save logic
      return;
    } else if (node.type === NodeType.ACTION) {
      if (state.inputTypes[0] === FileType.MP4) {
        await onChange(node.id, { 
          prompt: state.prompt,
          outputFileName: "P-650-WTH-BKM.json",
          ioConfig: {
            inputTypes: [{ type: FileType.MP4 }],
            outputType: { type: FileType.JSON }
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
    } else if (node.type === NodeType.OUTPUT && node.data.type === OutputSubType.EXCEL) {
      // Excel Export node handles its own save logic
      return;
    }
    setSaving(false);
    onClose();
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
        {node.type === NodeType.HTTP_TRIGGER ? (
          <HttpTriggerSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.HTTP_RESPONSE ? (
          <HttpResponseSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.AI_OPERATOR ? (
          <AiOperatorSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.TRIGGER && node.data.type === TriggerSubType.EVENT ? (
          <EventTriggerSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.TRIGGER && node.data.type === TriggerSubType.MANUAL ? (
          <>
            {/* File upload prompt when running */}
            {node.data.runState === 'prompt' ? (
              <div className="mb-6">
                <div className="font-medium mb-2">Upload File</div>
                <div className="text-sm text-gray-600 mb-4">Please select a file to continue the pipeline execution.</div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.json,.xml,.pdf,.doc,.docx,.mp4,video/mp4,.txt"
                  className="block w-full mb-2"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      // For demo: use a global resolver set by the canvas
                      if (typeof window !== 'undefined' && (window as any).__fileUploadResolver) {
                        (window as any).__fileUploadResolver(Array.from(e.target.files));
                        (window as any).__fileUploadResolver = null;
                      }
                    }
                  }}
                />
              </div>
            ) : null}
            {/* Only show run history and other relevant sections for manual trigger node */}
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.pdf,.doc,.docx,.mp4,.txt,text/plain,text/*"
              onChange={handleFileUpload}
            />
          </>
        ) : (node.type === NodeType.ACTION && node.data.type === ActionSubType.DECISION) ? (
          <DecisionSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : (node.type === NodeType.ACTION && node.data.label === NodeLabel.ERP) ? (
          <ErpSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : (node.type === NodeType.ACTION && node.data.label === NodeLabel.CSV_APPEND) ? (
          <CsvAppendSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.INTEGRATION ? (
          <IntegrationSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.ACTION && node.data.label === NodeLabel.AI_TRANSFORM ? (
          <AiTransformSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.OUTPUT && node.data.type === OutputSubType.EXCEL ? (
          <ExcelExportSidebar 
            node={node} 
            onChange={onChange}
            edges={edges}
            nodes={nodes}
          />
        ) : node.type === NodeType.OUTPUT && node.data.type === OutputSubType.DOC ? (
          <DocExportSidebar 
            node={node} 
            onChange={onChange}
          />
        ) : node.type === NodeType.AI_WEB_SEARCH ? (
          <AiWebSearchSidebar 
            node={node} 
            onChange={onChange}
          />
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
      {!(node.type === NodeType.HTTP_TRIGGER) &&
       !(node.type === NodeType.HTTP_RESPONSE) &&
       !(node.type === NodeType.AI_OPERATOR) &&
       !(node.type === NodeType.TRIGGER && node.data.type === TriggerSubType.EVENT) &&
       !(node.type === NodeType.ACTION && node.data.label === NodeLabel.AI_TRANSFORM) && 
       !(node.type === NodeType.ACTION && node.data.label === NodeLabel.ERP) &&
       !(node.type === NodeType.ACTION && node.data.label === NodeLabel.CSV_APPEND) &&
       !(node.type === NodeType.OUTPUT && node.data.type === OutputSubType.EXCEL) &&
       !(node.type === NodeType.ACTION && node.data.type === ActionSubType.DECISION) &&
       !(node.type === NodeType.OUTPUT && node.data.type === OutputSubType.DOC) &&
       !(node.type === NodeType.INTEGRATION) && (
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