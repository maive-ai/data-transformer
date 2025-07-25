"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Database } from "lucide-react";
import { RunState } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowErpNodeData {
  label: string;
  type: "action";
  iconType?: string;
  erpAction?: string;
  mockDistribution?: {
    directMatch: number;
    substitution: number;
    notFound: number;
  };
  connectionConfig?: {
    host?: string;
    database?: string;
    port?: number;
  };
  displayName?: string;
}

export const WorkflowErpNode = memo(({ data }: NodeProps<WorkflowErpNodeData & { runState?: string, highlighted?: boolean }>) => {
  const borderClass = getNodeBorderClass(data.runState as RunState);

  return (
    <Card className={`p-4 w-full h-full shadow-lg bg-white ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl"><Database className="w-6 h-6" /></div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
        {data.erpAction && (
          <div className="text-xs text-gray-500 text-center">{data.erpAction}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 