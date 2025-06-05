"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Mail, Database, FileText } from "lucide-react";
import { RunState, OutputSubType } from "@/types/enums";

interface WorkflowOutputNodeData {
  label: string;
  type: string;
  runState?: string;
  highlighted?: boolean;
}

export const WorkflowOutputNode = memo(({ data }: NodeProps<WorkflowOutputNodeData>) => {
  let borderClass = "";
  if (data.runState === RunState.PROMPT) borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === RunState.RUNNING) borderClass = "";
  else if (data.runState === RunState.DONE) borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== RunState.PROMPT;
  if (highlighted) {
    // Debug: log when a node is highlighted
    console.log('Rainbow highlight (output):', data.label, highlighted);
  }

  const getIcon = () => {
    switch (data.type) {
      case OutputSubType.EXCEL:
        return <FileSpreadsheet className="w-6 h-6" />;
      case "email":
        return <Mail className="w-6 h-6" />;
      case "erp":
        return <Database className="w-6 h-6" />;
      case OutputSubType.DOC:
        return <FileText className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (data.type) {
      case OutputSubType.EXCEL:
        return 'bg-green-50';
      case OutputSubType.DOC:
        return 'bg-blue-50';
      default:
        return '';
    }
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''} ${getBgColor()}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
    </Card>
  );
}); 