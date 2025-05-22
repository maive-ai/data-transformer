"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Mail, Database } from "lucide-react";

interface WorkflowOutputNodeData {
  label: string;
  type: "excel" | "email" | "erp";
  config?: {
    format?: string;
    destination?: string;
  };
}

export const WorkflowOutputNode = memo(({ data }: NodeProps<WorkflowOutputNodeData & { runState?: string }>) => {
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
  let borderClass = "";
  if (data.runState === "running") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-green-100";
  return (
    <Card className={`p-4 w-48 shadow-lg bg-green-50 ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.label}</div>
        {data.config && (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            {data.config.format && <span>Format: {data.config.format}</span>}
            {data.config.destination && <span>To: {data.config.destination}</span>}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 