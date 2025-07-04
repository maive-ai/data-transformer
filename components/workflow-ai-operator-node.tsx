"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface WorkflowAiOperatorNodeData {
  label: string;
  prompt: string;
  videoUrl?: string;
}

export const WorkflowAiOperatorNode = memo(({ data }: NodeProps<WorkflowAiOperatorNodeData & { runState?: string, highlighted?: boolean }>) => {
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
          <Bot className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-center">{data.label}</div>
        {data.prompt && (
          <div className="text-xs text-muted-foreground text-center line-clamp-2">
            {data.prompt}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 