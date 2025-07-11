"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { RunState, TriggerSubType, FileType } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowManualUploadNodeData {
  label: string;
  type: string;
  runState?: string;
  highlighted?: boolean;
  displayName?: string;
  uploadedFileNames?: string[];
  uploadedFileName?: string;
  acceptedFileTypes?: string[];
}

const DEFAULT_ACCEPTED_TYPES = [
  '.csv',
  '.xlsx', 
  '.xls',
  '.json',
  '.txt',
  '.docx',
  '.pdf',
  '.mp4'
];

export const WorkflowManualUploadNode = memo(({ data }: NodeProps<WorkflowManualUploadNodeData>) => {
  const [isUploading, setIsUploading] = useState(false);
  const borderClass = getNodeBorderClass(data.runState as RunState);
  const acceptedTypes = data.acceptedFileTypes || DEFAULT_ACCEPTED_TYPES;

  const getStatusIcon = () => {
    switch (data.runState) {
      case RunState.DONE:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case RunState.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case RunState.RUNNING:
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getFileIcon = () => {
    const fileName = data.uploadedFileName || data.uploadedFileNames?.[0];
    if (!fileName) return <Upload className="w-6 h-6" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'docx':
      case 'doc':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <FileText className="w-6 h-6 text-green-600" />;
      case 'json':
        return <FileText className="w-6 h-6 text-yellow-600" />;
      case 'mp4':
        return <FileText className="w-6 h-6 text-purple-600" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getDisplayText = () => {
    if (data.uploadedFileNames && data.uploadedFileNames.length > 0) {
      return data.uploadedFileNames[0];
    }
    if (data.uploadedFileName) {
      return data.uploadedFileName;
    }
    return data.displayName || data.label || "Manual Upload";
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // This will be handled by the parent component through the workflow canvas
      // The actual file processing is done in WorkflowCanvas.tsx
      console.log('File selected:', files[0].name);
    }
  }, []);

  const triggerFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes.join(',');
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        // For demo: use a global resolver set by the canvas
        if (typeof window !== 'undefined' && (window as any).__fileUploadResolver) {
          (window as any).__fileUploadResolver(Array.from(target.files));
          (window as any).__fileUploadResolver = null;
        }
      }
      document.body.removeChild(input);
    };
    
    input.oncancel = () => {
      document.body.removeChild(input);
    };
    
    input.click();
  }, [acceptedTypes]);

  return (
    <Card className={`p-4 w-full h-full shadow-lg bg-white ${borderClass} hover:shadow-xl transition-shadow`}>
      <div className="flex flex-col items-center gap-2 h-full">
        <div className="flex items-center gap-2">
          {getFileIcon()}
          {getStatusIcon()}
        </div>
        
        <div className="text-sm font-medium text-center leading-tight">
          {getDisplayText()}
        </div>
        
        {data.runState === RunState.PROMPT && (
          <Button
            size="sm"
            variant="outline"
            onClick={triggerFileSelect}
            disabled={isUploading}
            className="mt-2 text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            {isUploading ? "Uploading..." : "Select File"}
          </Button>
        )}
        
        {data.uploadedFileNames && data.uploadedFileNames.length > 0 && (
          <div className="text-xs text-gray-500 text-center mt-1">
            {data.uploadedFileNames.length} file{data.uploadedFileNames.length > 1 ? 's' : ''} uploaded
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
});

WorkflowManualUploadNode.displayName = 'WorkflowManualUploadNode'; 