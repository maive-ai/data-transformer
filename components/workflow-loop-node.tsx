"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Repeat } from "lucide-react";

interface WorkflowLoopNodeData {
  label: string;
  type: "action";
  iconType?: string;
}

export const WorkflowLoopNode = memo(({ data }: NodeProps<WorkflowLoopNodeData & { runState?: string, highlighted?: boolean }>) => {
  let borderClass = "";
  if (data.runState === "prompt") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "running") borderClass = "";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== "prompt";

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl"><Repeat className="w-6 h-6" /></div>
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <Handle type="target" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
}); 