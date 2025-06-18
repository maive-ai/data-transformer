import { useState } from "react";

interface OutputTemplateUploadProps {
  templateName: string;
  templateUrl: string;
  accept: string;
  onTemplateChange: (url: string, name: string, file: File) => void;
  onRemove: () => void;
  helpText?: string;
}

export function OutputTemplateUpload({ templateName, templateUrl, accept, onTemplateChange, onRemove, helpText }: OutputTemplateUploadProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        onTemplateChange(url, file.name, file);
      }
    }
  };
  return (
    <div>
      <div className="font-medium mb-2">Output Template</div>
      {templateName ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <div className="flex-1">
            <div className="text-sm text-gray-600">{templateName}</div>
          </div>
          <button
            onClick={onRemove}
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
            accept={accept}
            onChange={handleFileChange}
            className="w-full border rounded-lg p-2 text-sm"
          />
          {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
        </div>
      )}
    </div>
  );
} 