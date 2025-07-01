"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface WorkflowHttpTriggerNodeData {
  label: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  displayName?: string;
}

export const WorkflowHttpTriggerNode = memo(({ data }: NodeProps<WorkflowHttpTriggerNodeData & { runState?: string, highlighted?: boolean }>) => {
  let borderClass = "";
  if (data.runState === "prompt") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "running") borderClass = "";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-blue-100";

  const highlighted = data.highlighted && data.runState !== "prompt";

  return (
    <Card className={`p-4 w-48 shadow-lg bg-white ${borderClass} ${highlighted ? 'rainbow-outline' : ''}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">
          <Globe className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{data.method}</span>
          <span className="truncate max-w-[120px]">{data.endpoint}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 