"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { RunState } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowAiOperatorNodeData {
  label: string;
  prompt: string;
  videoUrl?: string;
  displayName?: string;
}

export const WorkflowAiOperatorNode = memo(({ data }: NodeProps<WorkflowAiOperatorNodeData & { runState?: string, highlighted?: boolean }>) => {
  const borderClass = getNodeBorderClass(data.runState as RunState);

  return (
    <Card className={`p-4 w-48 shadow-lg bg-white ${borderClass}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">
          <Bot className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
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