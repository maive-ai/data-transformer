"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { RunState } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowFileDownloadNodeData {
  label: string;
  type: string;
  runState?: string;
  highlighted?: boolean;
  displayName?: string;
}

export const WorkflowFileDownloadNode = memo(({ data }: NodeProps<WorkflowFileDownloadNodeData>) => {
  const borderClass = getNodeBorderClass(data.runState as RunState);

  return (
    <Card className={`p-4 w-full h-full shadow-lg bg-white ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">
          <Download className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
      </div>
    </Card>
  );
}); 