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

  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fileName, setFileName] = useState(file ? file.name : "");

  // Open modal automatically when file arrives
  useEffect(() => {
    if (runState === 'done' && file) {
      setFileName(file.name);
      setModalOpen(true);
    }
  }, [runState, file]);

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
          setModalOpen(false);
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
          setModalOpen(false);
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
        setModalOpen(false);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Modal for download */}
      {modalOpen && runState === 'done' && file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Download className="w-5 h-5" /> Download File
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">File Name</label>
              <input
                className="w-full border rounded p-2 text-sm"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                maxLength={128}
              />
            </div>
            <Button onClick={handleDownload} disabled={downloading || !fileName} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Downloading..." : `Download`}
            </Button>
          </div>
        </div>
      )}
      {/* Sidebar fallback to reopen modal */}
      {runState === 'done' && file ? (
        <Button onClick={() => setModalOpen(true)} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          {`Download ${file.name}`}
        </Button>
      ) : (
        <div className="text-sm text-muted-foreground">No file ready for download yet.</div>
      )}
    </div>
  );
} 