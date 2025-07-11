import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";

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
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvIndex, setCsvIndex] = useState(0);

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

  // Function to load CSV(s) from node.data.file or node.data.files
  const loadCsvFiles = async () => {
    let files: File[] = [];
    if (node.data.files && Array.isArray(node.data.files)) {
      files = node.data.files;
    } else if (node.data.file) {
      files = [node.data.file];
    }
    if (!files.length) {
      setCsvContents([]);
      setCsvError("CSV_OUTPUT_NOT_FOUND: No CSV output data is available for this node. Please run the node and try again.");
      return;
    }
    try {
      const contents = await Promise.all(files.map(file => file.text()));
      setCsvContents(contents);
      setCsvError(null);
    } catch (err) {
      setCsvContents([]);
      setCsvError("CSV_READ_ERROR: Failed to read CSV output file(s). Please check the node execution and try again.");
    }
  };

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

  // Replace the CSV table rendering to use the robust parser
  function renderCsvTable(csv: string, idx: number) {
    const rows = parseCsv(csv);
    if (!rows.length) return <div className="text-gray-500">(Empty CSV)</div>;
    return (
      <div key={idx} className="mb-6">
        <div className="font-semibold mb-2">CSV File {idx + 1}</div>
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
                    <td key={j} className="border px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Run History Section (find and render if present) */}
      {node.data.runHistory && Array.isArray(node.data.runHistory) && (
        <div>
          <div className="font-medium mb-2">Run History</div>
          <ul className="text-xs text-gray-700 space-y-1">
            {node.data.runHistory.map((run: any, idx: number) => (
              <li key={idx} className="flex items-center gap-2">
                <span>{run.timestamp}</span>
                <span className={run.status === 'done' ? 'text-green-600' : 'text-red-600'}>{run.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View CSV Output Button (always visible) */}
      <button
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        onClick={handleOpenCsvModal}
      >
        View CSV Output
      </button>

      {/* Modal for CSV output */}
      <Dialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
        <DialogContent className="bg-white p-6 max-w-5xl w-auto overflow-x-auto">
          <DialogTitle>CSV Output</DialogTitle>
          {csvError ? (
            <div className="text-red-600 font-mono whitespace-pre-wrap">{csvError}</div>
          ) : csvContents.length > 0 ? (
            <div>
              {csvContents.length > 1 && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    onClick={() => setCsvIndex(i => Math.max(0, i - 1))}
                    disabled={csvIndex === 0}
                  >
                    Previous
                  </button>
                  <span className="text-sm">CSV {csvIndex + 1} of {csvContents.length}</span>
                  <button
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    onClick={() => setCsvIndex(i => Math.min(csvContents.length - 1, i + 1))}
                    disabled={csvIndex === csvContents.length - 1}
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="max-h-[65vh] overflow-y-auto">
                {renderCsvTable(csvContents[csvIndex], csvIndex)}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No CSV output data found.</div>
          )}
        </DialogContent>
      </Dialog>

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