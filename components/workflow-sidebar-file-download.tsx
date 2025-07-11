"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function isFile(obj: any): obj is File {
  return obj && typeof obj === 'object' && typeof obj.name === 'string' && typeof obj.type === 'string';
}

export function FileDownloadSidebar({ node }: { node: any }) {
  const fileCandidate = node?.data?.file || (node?.data?.files && node.data.files[0]);
  const file = isFile(fileCandidate) ? fileCandidate : undefined;
  const runState = node?.data?.runState;

  const [downloading, setDownloading] = useState(false);
  const [fileName, setFileName] = useState(file ? file.name : "");

  // Update fileName when file changes
  useEffect(() => {
    if (file) {
      setFileName(file.name);
    }
  }, [file]);

  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);
    try {
      const newFile = fileName && fileName !== file.name
        ? new File([file], fileName, { type: file.type })
        : file;
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: newFile.name,
            types: [{
              description: 'File',
              accept: {
                [newFile.type]: [`.${newFile.name.split('.').pop()}`]
              }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(newFile);
          await writable.close();
        } catch (error) {
          if (error && (error as any).name === 'AbortError') {
            // User cancelled, do nothing
            return;
          }
          // Fallback to auto-download
          const url = URL.createObjectURL(newFile);
          const a = document.createElement('a');
          a.href = url;
          a.download = newFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        // Fallback for browsers without File System Access API
        const url = URL.createObjectURL(newFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = newFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {runState === 'done' && file ? (
        <div className="space-y-4">
          <div className="text-base font-semibold flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download File
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="file-name-input">File Name</label>
            <input
              id="file-name-input"
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              maxLength={128}
              disabled={downloading}
            />
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading || !fileName}
            className="w-full flex items-center justify-center gap-2 text-base font-medium"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      ) : runState === 'running' ? (
        <div className="text-sm text-muted-foreground">Processing file...</div>
      ) : runState === 'error' ? (
        <div className="text-sm text-red-600">Error processing file</div>
      ) : (
        <div className="text-sm text-muted-foreground">No file ready for download yet.</div>
      )}
    </div>
  );
} 