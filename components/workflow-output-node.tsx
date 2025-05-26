"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Mail, Database } from "lucide-react";

interface WorkflowOutputNodeData {
  label: string;
  type: "excel" | "email" | "erp";
}

export const WorkflowOutputNode = memo(({ data }: NodeProps<WorkflowOutputNodeData & { runState?: string; highlighted?: boolean }>) => {
  let borderClass = "";
  if (data.runState === "prompt") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "running") borderClass = "";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== "prompt";
  if (highlighted) {
    // Debug: log when a node is highlighted
    console.log('Rainbow highlight (output):', data.label, highlighted);
  }

  const getIcon = () => {
    switch (data.type) {
      case "excel":
        return <FileSpreadsheet className="w-6 h-6" />;
      case "email":
        return <Mail className="w-6 h-6" />;
      case "erp":
        return <Database className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''} ${data.type === 'excel' ? 'bg-green-50' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 