"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Repeat } from "lucide-react";
import { RunState } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowLoopNodeData {
  label: string;
  type: "action";
  iconType?: string;
  displayName?: string;
}

export const WorkflowLoopNode = memo(({ data }: NodeProps<WorkflowLoopNodeData & { runState?: string, highlighted?: boolean }>) => {
  const borderClass = getNodeBorderClass(data.runState as RunState);

  return (
    <Card className={`p-4 w-full h-full shadow-lg bg-white ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl"><Repeat className="w-6 h-6" /></div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="w-4 h-4" style={{ background: '#2563eb', zIndex: 10 }} />
    </Card>
  );
}); 