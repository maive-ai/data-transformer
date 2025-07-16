import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eye, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AiTransformSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function AiTransformSidebar({ node, onChange }: AiTransformSidebarProps) {
  const [prompt, setPrompt] = useState(node.data.prompt || "");
  const [inputTypes, setInputTypes] = useState(node.data.ioConfig?.inputTypes?.map((t: any) => t.type) || [""]);
  const [outputType, setOutputType] = useState(node.data.ioConfig?.outputType?.type || "");
  const [useOutputTemplate, setUseOutputTemplate] = useState(node.data.useOutputTemplate || false);
  const [outputTemplateName, setOutputTemplateName] = useState(node.data.outputTemplateName || "");
  const [outputTemplateUrl, setOutputTemplateUrl] = useState(node.data.outputTemplateUrl || "");
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvContents, setCsvContents] = useState<string[]>([]);
  const [csvTitles, setCsvTitles] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvIndex, setCsvIndex] = useState(0);
  const [debugInfoExpanded, setDebugInfoExpanded] = useState(false);
  const [debugInfoModalOpen, setDebugInfoModalOpen] = useState(false);

  // Update state when node changes
  useEffect(() => {
    setPrompt(node.data.prompt || "");
    setInputTypes(node.data.ioConfig?.inputTypes?.map((t: any) => t.type) || [""]);
    setOutputType(node.data.ioConfig?.outputType?.type || "");
    setUseOutputTemplate(node.data.useOutputTemplate || false);
    setOutputTemplateName(node.data.outputTemplateName || "");
    setOutputTemplateUrl(node.data.outputTemplateUrl || "");
  }, [node]);

  const handleSave = async () => {
    await onChange(node.id, {
      prompt,
      useOutputTemplate,
      outputTemplateName,
      outputTemplateUrl,
      ioConfig: {
        inputTypes: inputTypes.map((type: string) => ({ type })),
        outputType: { type: outputType }
      }
    });
  };

  const handleOutputTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload?template=1', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        setOutputTemplateUrl(url);
        setOutputTemplateName(file.name);
        setUseOutputTemplate(true);
        onChange(node.id, { 
          outputTemplateUrl: url, 
          outputTemplateName: file.name,
          useOutputTemplate: true
        });
      }
    }
  };

  const handleInputTypeChange = (type: string, index: number) => {
    const newTypes = [...inputTypes];
    newTypes[index] = type;
    setInputTypes(newTypes);
    if (type === "mp4") {
      setOutputType("json");
      onChange(node.id, { 
        outputFileName: "P-650-WTH-BKM.json",
        ioConfig: {
          inputTypes: newTypes.map(t => ({ type: t })),
          outputType: { type: "json" }
        }
      });
    }
  };

  // Helper function to get files from node data
  const getFilesFromNodeData = (): File[] => {
    if (node.data.files && Array.isArray(node.data.files)) {
      return node.data.files;
    } else if (node.data.file) {
      return [node.data.file];
    }
    return [];
  };

  // Helper function to process new format JSON with titles
  const processNewFormatJson = (parsed: any[], processedContents: string[], processedTitles: string[]): void => {
    parsed.forEach((item: any) => {
      if (item.title && item.csvContent) {
        processedContents.push(item.csvContent);
        processedTitles.push(item.title);
      }
    });
  };

  // Helper function to process old format or plain CSV
  const processOldFormatOrPlainCsv = (content: string, processedContents: string[], processedTitles: string[]): void => {
    processedContents.push(content);
    processedTitles.push(`CSV ${processedContents.length}`);
  };

  // Helper function to process a single file content
  const processFileContent = (content: string, processedContents: string[], processedTitles: string[]): void => {
    try {
      // Try to parse as JSON to see if it's the new format
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].title && parsed[0].csvContent) {
        // New format with titles
        processNewFormatJson(parsed, processedContents, processedTitles);
      } else {
        // Old format - treat as plain CSV
        processOldFormatOrPlainCsv(content, processedContents, processedTitles);
      }
    } catch {
      // Not JSON, treat as plain CSV
      processOldFormatOrPlainCsv(content, processedContents, processedTitles);
    }
  };

  // Function to load CSV(s) from node.data.file or node.data.files
  const loadCsvFiles = async () => {
    const files = getFilesFromNodeData();
    
    if (!files.length) {
      setCsvContents([]);
      setCsvTitles([]);
      setCsvError("CSV_OUTPUT_NOT_FOUND: No CSV output data is available for this node. Please run the node and try again.");
      return;
    }

    try {
      const contents = await Promise.all(files.map(file => file.text()));
      
      // Use titles from node data if available, otherwise process from files
      if (node.data.csvTitles && Array.isArray(node.data.csvTitles) && node.data.csvTitles.length === contents.length) {
        setCsvContents(contents);
        setCsvTitles(node.data.csvTitles);
      } else {
        // Fallback: process titles from file content
        const processedContents: string[] = [];
        const processedTitles: string[] = [];
        
        for (const content of contents) {
          processFileContent(content, processedContents, processedTitles);
        }
        
        setCsvContents(processedContents);
        setCsvTitles(processedTitles);
      }
      
      setCsvError(null);
    } catch (err) {
      setCsvContents([]);
      setCsvTitles([]);
      setCsvError("CSV_READ_ERROR: Failed to read CSV output file(s). Please check the node execution and try again.");
    }
  };

  // Load CSV titles from node data on component mount and when node changes
  useEffect(() => {
    if (node.data.csvTitles && Array.isArray(node.data.csvTitles)) {
      setCsvTitles(node.data.csvTitles);
    } else {
      setCsvTitles([]);
    }
  }, [node.data.csvTitles, node.id]);

  // Open modal and load CSVs
  const handleOpenCsvModal = async () => {
    await loadCsvFiles();
    setCsvIndex(0);
    setCsvModalOpen(true);
  };

  // Helper to robustly parse CSV rows, handling quoted fields and commas inside quotes
  function parseCsv(csv: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;
    while (i < csv.length) {
      const char = csv[i];
      if (char === '"') {
        if (inQuotes && csv[i + 1] === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentCell !== '' || currentRow.length > 0) {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        }
        // Handle \r\n (Windows)
        if (char === '\r' && csv[i + 1] === '\n') i++;
      } else {
        currentCell += char;
      }
      i++;
    }
    // Add last cell/row
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    // Remove empty trailing rows
    return rows.filter(row => row.length > 1 || (row.length === 1 && row[0].trim() !== ''));
  }

  // Helper function to detect URLs and create hyperlinks
  function renderCellWithLinks(cell: string) {
    // URL regex pattern to match http/https URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = cell.split(urlRegex);
    
    if (parts.length === 1) {
      // No URL found, return plain text
      return cell;
    }
    
    // URL found, render with links
    return (
      <>
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                LINK
              </a>
            );
          }
          return part;
        })}
      </>
    );
  }

  // Replace the CSV table rendering to use the robust parser
  function renderCsvTable(csv: string, idx: number) {
    const rows = parseCsv(csv);
    if (!rows.length) return <div className="text-gray-500">(Empty CSV)</div>;
    return (
      <div key={idx} className="mb-6">
        {/* Removed CSV File 1 header */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-max border text-xs">
            <thead>
              <tr>
                {rows[0].map((cell, i) => (
                  <th key={i} className="border px-2 py-1 bg-gray-100 text-left font-semibold">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1">{renderCellWithLinks(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Custom DialogContent without default close button
  const CustomDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        className={
          "fixed left-1/2 top-1/2 z-50 flex flex-col w-full max-w-5xl max-h-[80vh] -translate-x-1/2 -translate-y-1/2 border bg-background p-6 shadow-lg sm:rounded-lg " +
          (className || "")
        }
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ));
  CustomDialogContent.displayName = "CustomDialogContent";

  return (
    <div className="space-y-6 relative h-full">
      {/* Prompt Section */}
      <div>
        <div className="font-medium mb-2">AI Prompt</div>
        <textarea
          className="w-full min-h-[120px] border rounded-lg p-2 text-sm"
          placeholder="Describe what the AI should do with the input data..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Input Types Section */}
      <div>
        <div className="font-medium mb-2">Input File Types</div>
        {inputTypes.map((type: string, index: number) => (
          <div key={index} className="mb-2">
            <select
              className="w-full border rounded-lg p-2 text-sm"
              value={type}
              onChange={(e) => handleInputTypeChange(e.target.value, index)}
            >
              <option value="">Select input type</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
              <option value="mp4">MP4 Video</option>
              <option value="txt">Text</option>
            </select>
          </div>
        ))}
      </div>

      {/* Output Type Section */}
      <div>
        <div className="font-medium mb-2">Output File Type</div>
        <select
          className="w-full border rounded-lg p-2 text-sm"
          value={outputType}
          onChange={(e) => setOutputType(e.target.value)}
        >
          <option value="">Select output type</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="xlsx">Excel</option>
          <option value="markdown">Markdown</option>
          <option value="txt">Text</option>
        </select>
      </div>

      {/* Output Template Section */}
      <div>
        <div className="font-medium mb-2">Output Template</div>
        {outputTemplateName ? (
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="flex-1">
              <div className="text-sm text-gray-600">{outputTemplateName}</div>
            </div>
            <button
              onClick={() => {
                setOutputTemplateName("");
                setOutputTemplateUrl("");
                setUseOutputTemplate(false);
                onChange(node.id, { 
                  outputTemplateName: "", 
                  outputTemplateUrl: "", 
                  useOutputTemplate: false 
                });
              }}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Remove template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleOutputTemplateChange}
              className="w-full border rounded-lg p-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Upload a template to structure the AI output</p>
          </div>
        )}
      </div>

      {/* CSV Output Button (secondary, with eye icon) */}
      <Button
        variant="secondary"
        className="w-full mb-2"
        onClick={handleOpenCsvModal}
      >
        <Eye className="mr-2" />
        CSV Output
      </Button>

      {/* Debug Info Section */}
      {node.data.debugInfo && (
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => setDebugInfoExpanded(!debugInfoExpanded)}
              className="flex-1 flex items-center justify-between text-left hover:bg-gray-50 rounded p-2 -m-2"
            >
              <span className="font-medium text-sm">Debug Information</span>
              {debugInfoExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setDebugInfoModalOpen(true)}
              title="Pop out to modal"
            >
              Pop Out
            </button>
          </div>
          {debugInfoExpanded && (
            <div className="p-3 border-t bg-gray-50 max-h-40 overflow-y-auto">
              <div className="prose prose-sm text-xs">
                <ReactMarkdown>
                  {node.data.debugInfo}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {/* Debug Info Modal */}
          <Dialog open={debugInfoModalOpen} onOpenChange={setDebugInfoModalOpen}>
            <CustomDialogContent>
              <button
                onClick={() => setDebugInfoModalOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full p-2 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-0"
                tabIndex={0}
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <DialogTitle className="pr-10">Debug Information</DialogTitle>
              <div className="mt-4 max-h-[60vh] overflow-y-auto prose prose-base text-sm">
                <ReactMarkdown>
                  {node.data.debugInfo}
                </ReactMarkdown>
              </div>
            </CustomDialogContent>
          </Dialog>
        </div>
      )}

      {/* Modal for CSV output */}
      <Dialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
        <CustomDialogContent>
          {/* Custom Close Button - absolutely positioned, always visible */}
          <button
            onClick={() => setCsvModalOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full p-2 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-0"
            tabIndex={0}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <DialogTitle className="pr-10">CSV Output</DialogTitle>
          {csvError ? (
            <div className="text-red-600 font-mono whitespace-pre-wrap mt-4">{csvError}</div>
          ) : csvContents.length > 0 ? (
            <div className="flex-1 flex flex-col mt-4">
              {csvContents.length > 1 && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    onClick={() => setCsvIndex(i => Math.max(0, i - 1))}
                    disabled={csvIndex === 0}
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    {csvTitles[csvIndex] || `CSV ${csvIndex + 1}`} ({csvIndex + 1} of {csvContents.length})
                  </span>
                  <button
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    onClick={() => setCsvIndex(i => Math.min(csvContents.length - 1, i + 1))}
                    disabled={csvIndex === csvContents.length - 1}
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="flex-1 w-full overflow-x-auto overflow-y-auto max-h-[60vh]">
                {renderCsvTable(csvContents[csvIndex], csvIndex)}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 mt-4">No CSV output data found.</div>
          )}
        </CustomDialogContent>
      </Dialog>

      {/* Save Button anchored to bottom center of sidebar with padding */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 pb-9 w-[180px]">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
        >
          <Save className="mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
} 