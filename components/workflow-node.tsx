"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";

interface WorkflowNodeData {
  label: string;
  icon?: React.ReactNode;
  type: "action" | "trigger" | "output";
}

export const WorkflowNode = memo(({ data }: NodeProps<WorkflowNodeData & { runState?: string }>) => {
  let borderClass = "";
  if (data.runState === "running") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";
  return (
    <Card className={`p-4 w-48 shadow-lg ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        {data.icon && <div className="text-2xl">{data.icon}</div>}
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 