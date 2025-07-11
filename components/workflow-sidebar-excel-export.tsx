import { useState, useEffect } from "react";

interface ExcelExportSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
  edges: any[];
  nodes: any[];
}

export function ExcelExportSidebar({ node, onChange, edges, nodes }: ExcelExportSidebarProps) {
  const [fileName, setFileName] = useState(node.data.fileName || "");
  const [sheetNames, setSheetNames] = useState(node.data.sheetNames || []);

  // Compute inbound CSV count based on actual edges
  const inboundCsvCount = (() => {
    const inboundEdges = edges.filter(e => e.target === node.id);
    let count = 0;
    for (const edge of inboundEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.data?.ioConfig?.outputType?.type === 'csv') {
        count++;
      }
    }
    return count || 1;
  })();

  // Ensure sheetNames array matches inboundCsvCount
  useEffect(() => {
    let names = sheetNames.slice();
    while (names.length < inboundCsvCount) names.push(`Sheet${names.length + 1}`);
    if (names.length > inboundCsvCount) names = names.slice(0, inboundCsvCount);
    setSheetNames(names);
  }, [inboundCsvCount]);

  const handleSave = async () => {
    await onChange(node.id, {
      fileName,
      sheetNames,
      ioConfig: {
        inputTypes: [{ type: "csv" }],
        outputType: { type: "excel" }
      }
    });
  };

  const handleSheetNameChange = (index: number, value: string) => {
    const newNames = [...sheetNames];
    newNames[index] = value;
    setSheetNames(newNames);
  };

  return (
    <div className="space-y-6">
      {/* File Name Section */}
      <div>
        <div className="font-medium mb-2">Output File Name</div>
        <input
          type="text"
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="output.xlsx"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Enter the name for your Excel file (e.g., report.xlsx)</p>
      </div>

      {/* Sheet Names Section */}
      <div>
        <div className="font-medium mb-2">Sheet Names</div>
        <div className="space-y-2">
          {sheetNames.map((name: string, idx: number) => (
            <input
              key={idx}
              type="text"
              className="w-full border rounded-lg p-2 text-sm"
              value={name}
              onChange={(e) => handleSheetNameChange(idx, e.target.value)}
              placeholder={`Sheet${idx + 1}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">You can customize the name of each sheet in the final Excel file. The number of sheets matches the number of inbound CSV files.</p>
      </div>

      {/* Download section for Excel output node after run */}
      {node.data.fileUrl && (
        <div className="flex flex-col items-start gap-2 p-4 border rounded-lg bg-green-50">
          <div className="font-medium text-sm">Download Output</div>
          <div className="text-xs text-gray-700 mb-2">{fileName || "output.xlsx"}</div>
          <button
            onClick={async () => {
              try {
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
                  const downloadLink = document.createElement('a');
                  downloadLink.href = node.data.fileUrl;
                  downloadLink.download = fileName || 'output.xlsx';
                  downloadLink.click();
                }
              } catch (err) {
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

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Save
      </button>
    </div>
  );
} 