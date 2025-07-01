"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { RunState, ActionSubType, NodeLabel } from "@/types/enums";

interface WorkflowNodeData {
  label: string;
  type?: string;
  runState?: string;
  highlighted?: boolean;
  displayName?: string;
}

export const WorkflowNode = memo(({ data }: NodeProps<WorkflowNodeData>) => {
  let borderClass = "";
  if (data.runState === RunState.PROMPT) borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === RunState.RUNNING) borderClass = "";
  else if (data.runState === RunState.DONE) borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== RunState.PROMPT;
  if (highlighted) {
    // Debug: log when a node is highlighted
    console.log('Rainbow highlight (action):', data.label, highlighted);
  }

  const getIcon = () => {
    if (data.type === ActionSubType.DECISION) return <div className="text-2xl">🔀</div>;
    return <Wand2 className="w-6 h-6" />;
  };

  const getBgColor = () => {
    if (data.type === ActionSubType.DECISION) return 'bg-amber-50';
    return '';
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''} ${getBgColor()} bg-white`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      {/* Extra bottom handle for feedback from CSV Append */}
      {data.label === NodeLabel.CSV_APPEND && (
        <Handle type="source" position={Position.Bottom} id="bottom" className="w-4 h-4" style={{ background: '#2563eb', zIndex: 10 }} />
      )}
      <Handle type="target" position={Position.Right} className="hidden" />
    </Card>
  );
}); 