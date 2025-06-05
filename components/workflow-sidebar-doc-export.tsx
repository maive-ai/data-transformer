import { useState, useEffect } from "react";

interface DocExportSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
}

export function DocExportSidebar({ node, onChange }: DocExportSidebarProps) {
  // State for future configuration options if needed
  const [fileName] = useState("Standard Operating Procedure_ Toothbrush Holder Assembly.docx");

  const handleSave = async () => {
    await onChange(node.id, {
      fileName: "Standard Operating Procedure_ Toothbrush Holder Assembly.docx",
      ioConfig: {
        inputTypes: [],
        outputType: { type: "doc" }
      }
    });
  };

  const handleDownload = async () => {
    const fileUrl = "/static/Standard Operating Procedure_ Toothbrush Holder Assembly.docx";
    try {
      // Try to use the File System Access API if available
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
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
  };

  return (
    <div className="space-y-6">
      {/* Output File Section */}
      <div>
        <div className="font-medium mb-2">Output File</div>
        <div className="text-sm text-gray-600">
          This node will always output: <span className="font-medium">{fileName}</span>
        </div>
      </div>

      {/* Download Section */}
      <div className="flex flex-col items-start gap-2 p-4 border rounded-lg bg-blue-50">
        <div className="font-medium text-sm">Download Output</div>
        <div className="text-xs text-gray-700 mb-2">{fileName}</div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition"
        >
          Download File
        </button>
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