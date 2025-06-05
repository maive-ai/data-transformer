"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Mail, Database, Brain, Signpost } from "lucide-react";

interface WorkflowNodeData {
  label: string;
  iconType?: string; // e.g., 'excel', 'email', 'erp', 'decision'
  type: "action" | "trigger" | "output";
}

export const WorkflowNode = memo(({ data }: NodeProps<WorkflowNodeData & { runState?: string, highlighted?: boolean }>) => {
  let borderClass = "";
  if (data.runState === "prompt") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "running") borderClass = "";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== "prompt";
  if (highlighted) {
    // Debug: log when a node is highlighted
    console.log('Rainbow highlight:', data.label, highlighted);
  }

  // Render icon based on iconType string
  const getIcon = () => {
    switch (data.iconType) {
      case "excel":
        return <FileSpreadsheet className="w-6 h-6" />;
      case "email":
        return <Mail className="w-6 h-6" />;
      case "erp":
        return <Database className="w-6 h-6" />;
      case "brain":
        return <Brain className="w-6 h-6" />;
      case "decision":
        return <Signpost className="w-6 h-6" />;
      default:
        // Default to Brain icon for action nodes
        if (data.type === "action") return <Brain className="w-6 h-6" />;
        return null;
    }
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 