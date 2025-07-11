"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Info } from "lucide-react";
import { TriggerSubType, FileType } from "@/types/enums";

interface WorkflowManualUploadSidebarProps {
  node: any;
  onChange: (id: string, newData: any) => void;
  onClose: () => void;
}

const SUPPORTED_FILE_TYPES = [
  { extension: '.csv', label: 'CSV Files', mimeType: 'text/csv' },
  { extension: '.xlsx', label: 'Excel Files', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { extension: '.xls', label: 'Excel Files (Legacy)', mimeType: 'application/vnd.ms-excel' },
  { extension: '.json', label: 'JSON Files', mimeType: 'application/json' },
  { extension: '.txt', label: 'Text Files', mimeType: 'text/plain' },
  { extension: '.docx', label: 'Word Documents', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { extension: '.pdf', label: 'PDF Files', mimeType: 'application/pdf' },
  { extension: '.mp4', label: 'Video Files', mimeType: 'video/mp4' },
];

export function WorkflowManualUploadSidebar({ node, onChange, onClose }: WorkflowManualUploadSidebarProps) {
  const [displayName, setDisplayName] = useState(node.data.displayName || node.data.label || "Manual Upload");
  const [uploadedFileName, setUploadedFileName] = useState(node.data.uploadedFileName || "");
  const [acceptedFileTypes, setAcceptedFileTypes] = useState<string[]>(
    node.data.acceptedFileTypes || SUPPORTED_FILE_TYPES.map(t => t.extension)
  );
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setDisplayName(node.data.displayName || node.data.label || "Manual Upload");
    setUploadedFileName(node.data.uploadedFileName || "");
    setAcceptedFileTypes(node.data.acceptedFileTypes || SUPPORTED_FILE_TYPES.map(t => t.extension));
  }, [node]);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDisplayName(newName);
    onChange(node.id, { displayName: newName });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      onChange(node.id, { 
        uploadedFileName: file.name,
        ioConfig: {
          inputTypes: [],
          outputType: { type: file.name.split('.').pop()?.toLowerCase() || FileType.CSV }
        }
      });
    }
  };

  const toggleFileType = (extension: string) => {
    const newTypes = acceptedFileTypes.includes(extension)
      ? acceptedFileTypes.filter(t => t !== extension)
      : [...acceptedFileTypes, extension];
    
    setAcceptedFileTypes(newTypes);
    onChange(node.id, { acceptedFileTypes: newTypes });
  };

  const getFileTypeLabel = (extension: string) => {
    const fileType = SUPPORTED_FILE_TYPES.find(t => t.extension === extension);
    return fileType?.label || extension;
  };

  const handleSave = async () => {
    await onChange(node.id, { 
      displayName,
      uploadedFileName,
      acceptedFileTypes,
      ioConfig: {
        inputTypes: [],
        outputType: { type: uploadedFileName.split('.')?.pop()?.toLowerCase() || FileType.CSV }
      }
    });
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Manual Upload Node</h3>
          <p className="text-sm text-gray-600">Configure file upload settings</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowInfo(!showInfo)}
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-800">About Manual Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              This node prompts users to upload files when the pipeline runs. 
              It supports various file formats including .docx documents, CSV files, 
              Excel spreadsheets, PDFs, and more. The uploaded file will be passed 
              to downstream nodes in the workflow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="display-name">Display Name</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="Enter a descriptive name"
        />
      </div>

      {/* File Upload Section */}
      <div className="space-y-2">
        <Label>Uploaded File</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById("manual-upload-file")?.click()}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadedFileName || "Select File"}
          </Button>
          <input
            type="file"
            id="manual-upload-file"
            className="hidden"
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileUpload}
          />
          {uploadedFileName && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setUploadedFileName("");
                onChange(node.id, { uploadedFileName: "" });
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {uploadedFileName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            {uploadedFileName}
          </div>
        )}
      </div>

      {/* Accepted File Types */}
      <div className="space-y-2">
        <Label>Accepted File Types</Label>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_FILE_TYPES.map((fileType) => (
            <Button
              key={fileType.extension}
              variant={acceptedFileTypes.includes(fileType.extension) ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleFileType(fileType.extension)}
              className="justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              {fileType.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Users will only be able to select files with these extensions
        </p>
      </div>

      {/* File Type Badges */}
      {acceptedFileTypes.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Types</Label>
          <div className="flex flex-wrap gap-1">
            {acceptedFileTypes.map((extension) => (
              <Badge key={extension} variant="secondary">
                {extension}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} className="flex-1">
          Save
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
} 