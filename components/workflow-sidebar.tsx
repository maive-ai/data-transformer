"use client";

import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useRef } from "react";

const INTEGRATIONS = [
  { name: "Gmail", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail" className="w-7 h-7" /> },
  { name: "Outlook", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/640px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png" alt="Outlook" className="w-7 h-7" /> },
  { name: "SharePoint", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg/640px-Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg.png" alt="SharePoint" className="w-7 h-7" /> },
  { name: "Google Drive", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/640px-Google_Drive_icon_%282020%29.svg.png" alt="Google Drive" className="w-7 h-7" /> },
  { name: "Dropbox", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/640px-Dropbox_Icon.svg.png" alt="Dropbox" className="w-7 h-7" /> },
  { name: "Salesforce", icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/640px-Salesforce.com_logo.svg.png " alt="Salesforce" className="w-7 h-7" /> },
];

export function WorkflowSidebar({ node, onClose, onChange, runHistory = [], nodes = [], edges = [] }: {
  node: any;
  onClose: () => void;
  onChange: (id: string, newData: any) => void;
  runHistory?: Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>;
  nodes?: any[];
  edges?: any[];
}) {
  // For event trigger: integration and description
  const [integration, setIntegration] = useState(node.data.integration || null);
  const [description, setDescription] = useState(node.data.description || "");
  const [prompt, setPrompt] = useState(node.data.prompt || "");
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState(node.data.fileName || "");
  const [inputTypes, setInputTypes] = useState<string[]>(node.data.ioConfig?.inputTypes?.map((t: any) => t.type) || []);
  const [outputType, setOutputType] = useState<string>(node.data.ioConfig?.outputType?.type || "");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState(node.data.uploadedFileName || "");
  const [outputFile, setOutputFile] = useState<File | null>(null);
  const [outputFileName, setOutputFileName] = useState(node.data.outputFileName || "");
  const [useOutputTemplate, setUseOutputTemplate] = useState(node.data.useOutputTemplate || false);
  const [outputTemplateName, setOutputTemplateName] = useState(node.data.outputTemplateName || "");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [xlsxTemplate, setXlsxTemplate] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>(node.data.sheetNames || []);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [endpoint, setEndpoint] = useState(node.data.endpoint || "");
  const [method, setMethod] = useState(node.data.method || "POST");
  const [statusCode, setStatusCode] = useState(node.data.statusCode || 200);
  const [contentType, setContentType] = useState(node.data.contentType || "application/json");
  const [aiPrompt, setAiPrompt] = useState(node.data.prompt || "");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Get number of input connections
  const inputConnections = useMemo(() => {
    if (!edges || !node) return 0;
    return edges.filter(e => e.target === node.id).length;
  }, [edges, node]);

  // Ensure inputTypes array matches number of input connections
  useEffect(() => {
    if (node.type === "action") {
      const currentTypes = [...inputTypes];
      while (currentTypes.length < inputConnections) {
        currentTypes.push("");
      }
      if (currentTypes.length > inputConnections) {
        currentTypes.splice(inputConnections);
      }
      setInputTypes(currentTypes);
    }
  }, [inputConnections, node.type]);

  // For Excel Export node: compute inbound CSV count based on actual edges
  const inboundCsvCount = useMemo(() => {
    if (node.type !== 'output' || node.data.type !== 'excel') return 0;
    // Find all edges where this node is the target
    const inboundEdges = edges.filter(e => e.target === node.id);
    // For each, check if the source node outputs CSV
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
      let names = sheetNames.slice();
      while (names.length < inboundCsvCount) names.push(`Sheet${names.length + 1}`);
      if (names.length > inboundCsvCount) names = names.slice(0, inboundCsvCount);
      setSheetNames(names);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboundCsvCount, node.id]);

  useEffect(() => {
    setOutputTemplateName(node.data.outputTemplateName || "");
  }, [node.id, node.data.outputTemplateName]);

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
        setOutputTemplateName(file.name);
      }
    }
  };

  const handleInputTypeChange = (type: string, index: number) => {
    const newTypes = [...inputTypes];
    newTypes[index] = type;
    setInputTypes(newTypes);
    if (type === "mp4") {
      setOutputType("json");
      // When MP4 is selected, we'll use the specific JSON file as output
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
    setOutputType(type);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setUploadedFileName(file.name);
      // Update the node data with the file type
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
      setOutputFileName(e.target.files[0].name);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (node.type === "httpTrigger") {
      await onChange(node.id, { endpoint, method });
    } else if (node.type === "httpResponse") {
      await onChange(node.id, { statusCode, contentType });
    } else if (node.type === "aiOperator") {
      await onChange(node.id, { prompt: aiPrompt });
    } else if (node.type === "trigger" && node.data.type === "event") {
      await onChange(node.id, { integration, description });
    } else if (node.type === "trigger" && node.data.type === "manual") {
      await onChange(node.id, { 
        uploadedFileName,
        ioConfig: {
          inputTypes: [],  // Manual upload doesn't need input types
          outputType: { type: uploadedFile?.name.split('.')?.pop()?.toLowerCase() || "csv" }
        }
      });
    } else if (node.type === "action") {
      // If input type is MP4, we'll use the specific JSON file
      if (inputTypes[0] === "mp4") {
        await onChange(node.id, { 
          prompt,
          outputFileName: "P-650-WTH-BKM.json",
          ioConfig: {
            inputTypes: [{ type: "mp4" }],
            outputType: { type: "json" }
          }
        });
      } else {
        await onChange(node.id, { 
          prompt, 
          outputFileName,
          useOutputTemplate,
          ioConfig: {
            inputTypes: inputTypes.map(type => ({ type })),
            outputType: { type: outputType }
          }
        });
      }
    } else if (node.type === "output" && node.data.type === "excel") {
      await onChange(node.id, {
        fileName,
        sheetNames,
        ioConfig: {
          inputTypes: [{ type: "csv" }],
          outputType: { type: "excel" }
        }
      });
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

  return (
    <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-lg truncate" title={node.data.label || fileName || 'Node'}>{node.data.label || fileName || 'Node'}</div>
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
              <div className="font-semibold text-lg mb-4">{node.data.label || fileName || 'Node'}</div>
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
                value={method}
                onChange={(e) => setMethod(e.target.value)}
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
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
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
                value={statusCode}
                onChange={(e) => setStatusCode(parseInt(e.target.value))}
              />
            </div>
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
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
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
        ) : node.type === "trigger" && node.data.type === "manual" ? (
          <>
            {/* Only show run history and other relevant sections for manual trigger node */}
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.pdf,.doc,.docx,.mp4"
              onChange={handleFileUpload}
            />
          </>
        ) : node.type === "action" ? (
          <div className="space-y-6">
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
              <div className="font-medium mb-2">Output Template</div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useOutputTemplate"
                  checked={useOutputTemplate}
                  onChange={(e) => setUseOutputTemplate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="useOutputTemplate" className="text-sm">
                  Use output template file
                </label>
              </div>
              {useOutputTemplate && (
                <label className="block w-full border-dashed border-2 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.doc,.docx,.mp4,video/mp4"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setXlsxTemplate(e.target.files[0]);
                        handleOutputTemplateChange(e); // keep existing upload logic
                      }
                    }}
                  />
                  {xlsxTemplate ? (
                    <span className="text-sm">{xlsxTemplate.name}</span>
                  ) : node.data.outputTemplateName ? (
                    <span className="text-sm">{node.data.outputTemplateName}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Click to upload an output template file</span>
                  )}
                </label>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {useOutputTemplate
                  ? "The AI will use this file as a template and add data to it. Multi-sheet Excel templates (.xlsx) and Word documents (.docx) are supported."
                  : "The AI will generate a new output file"}
              </p>
            </div>
            <div>
              <div className="font-medium mb-2">Input File Types</div>
              {inputTypes.map((type, index) => (
                <div key={index} className="mb-2">
                  <div className="text-sm text-gray-600 mb-1">Input {index + 1}</div>
                  <select
                    value={type}
                    onChange={(e) => handleInputTypeChange(e.target.value, index)}
                    className="w-full border rounded-lg p-2 text-sm"
                  >
                    <option value="">Select input type</option>
                    {["csv", "excel", "json", "xml", "pdf", "doc", "docx", "mp4"].map((type) => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <div className="font-medium mb-2">Output File Type</div>
              <select
                value={outputType}
                onChange={(e) => handleOutputTypeChange(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">Select output type</option>
                {["csv", "excel", "json", "xml", "markdown"].map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            {/* Download section for AI Transform node after run */}
            {runHistory.length > 0 && node.data.fileUrl && (
              <div className="flex flex-col items-start gap-2 p-4 border rounded-lg bg-purple-50">
                <div className="font-medium text-sm">Download Transform Output</div>
                <div className="text-xs text-gray-700 mb-2">{outputFileName || `output.${outputType}`}</div>
                <button
                  onClick={async () => {
                    try {
                      // Try to use the File System Access API if available
                      if ('showSaveFilePicker' in window) {
                        const handle = await window.showSaveFilePicker({
                          suggestedName: outputFileName || `output.${outputType}`,
                          types: [{
                            description: 'Transform Output',
                            accept: {
                              'text/csv': ['.csv'],
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                              'application/json': ['.json'],
                              'application/xml': ['.xml'],
                              'text/markdown': ['.md']
                            }
                          }]
                        });
                        const writable = await handle.createWritable();
                        const response = await fetch(node.data.fileUrl);
                        const blob = await response.blob();
                        await writable.write(blob);
                        await writable.close();
                      } else {
                        // Fallback for browsers that don't support File System Access API
                        const downloadLink = document.createElement('a');
                        downloadLink.href = node.data.fileUrl;
                        downloadLink.download = outputFileName || `output.${outputType}`;
                        downloadLink.click();
                      }
                    } catch (err) {
                      // If user cancels or there's an error, fall back to standard download
                      const downloadLink = document.createElement('a');
                      downloadLink.href = node.data.fileUrl;
                      downloadLink.download = outputFileName || `output.${outputType}`;
                      downloadLink.click();
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold shadow hover:bg-purple-700 transition"
                >
                  Download File
                </button>
              </div>
            )}
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
              <p className="text-xs text-gray-500 mt-1">Enter the name for your Excel file (e.g., report.xlsx)</p>
            </div>
            {/* Sheet name configuration for Excel Export node */}
            {node.type === 'output' && node.data.type === 'excel' && (
              <div className="mt-4">
                <div className="font-medium mb-2">Sheet Names</div>
                <div className="space-y-2">
                  {sheetNames.map((name, idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="w-full border rounded-lg p-2 text-sm"
                      value={name}
                      onChange={e => {
                        const newNames = [...sheetNames];
                        newNames[idx] = e.target.value;
                        setSheetNames(newNames);
                      }}
                      placeholder={`Sheet${idx + 1}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">You can customize the name of each sheet in the final Excel file. The number of sheets matches the number of inbound CSV files.</p>
              </div>
            )}
            {/* Download section for Excel output node after run */}
            {runHistory.length > 0 && node.data.fileUrl && (
              <div className="flex flex-col items-start gap-2 p-4 border rounded-lg bg-green-50">
                <div className="font-medium text-sm">Download Output</div>
                <div className="text-xs text-gray-700 mb-2">{fileName || "output.xlsx"}</div>
                <button
                  onClick={async () => {
                    try {
                      // Try to use the File System Access API if available
                      if ('showSaveFilePicker' in window) {
                        const handle = await window.showSaveFilePicker({
                          suggestedName: fileName || 'output.xlsx',
                          types: [{
                            description: 'Excel Spreadsheet',
                            accept: {
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                            }
                          }]
                        });
                        const writable = await handle.createWritable();
                        const response = await fetch(node.data.fileUrl);
                        const blob = await response.blob();
                        await writable.write(blob);
                        await writable.close();
                      } else {
                        // Fallback for browsers that don't support File System Access API
                        const downloadLink = document.createElement('a');
                        downloadLink.href = node.data.fileUrl;
                        downloadLink.download = fileName || 'output.xlsx';
                        downloadLink.click();
                      }
                    } catch (err) {
                      // If user cancels or there's an error, fall back to standard download
                      const downloadLink = document.createElement('a');
                      downloadLink.href = node.data.fileUrl;
                      downloadLink.download = fileName || 'output.xlsx';
                      downloadLink.click();
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow hover:bg-green-700 transition"
                >
                  Download File
                </button>
              </div>
            )}
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