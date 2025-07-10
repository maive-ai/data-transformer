"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Wand2 } from "lucide-react";
import { RunState, ActionSubType, NodeLabel } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowNodeData {
  label: string;
  type?: string;
  runState?: string;
  highlighted?: boolean;
  displayName?: string;
}

export const WorkflowNode = memo(({ data }: NodeProps<WorkflowNodeData>) => {
  const borderClass = getNodeBorderClass(data.runState as RunState);

  const getIcon = () => {
    if (data.type === ActionSubType.DECISION) return <div className="text-2xl">🔀</div>;
    return <Wand2 className="w-6 h-6" />;
  };

  const getBgColor = () => {
    if (data.type === ActionSubType.DECISION) return 'bg-amber-50';
    return '';
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${getBgColor()} bg-white`}>
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