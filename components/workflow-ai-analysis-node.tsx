"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { RunState } from "@/types/enums";

interface WorkflowAiAnalysisNodeData {
  label: string;
  type?: string;
  runState?: string;
  highlighted?: boolean;
  displayName?: string;
}

export const WorkflowAiAnalysisNode = memo(({ data }: NodeProps<WorkflowAiAnalysisNodeData>) => {
  let borderClass = "";
  if (data.runState === RunState.PROMPT) borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === RunState.RUNNING) borderClass = "";
  else if (data.runState === RunState.DONE) borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== RunState.PROMPT;

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''} bg-white`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">
          <Wand2 className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
});

WorkflowAiAnalysisNode.displayName = 'WorkflowAiAnalysisNode'; 