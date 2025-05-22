"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Clock, Zap } from "lucide-react";

interface WorkflowTriggerNodeData {
  label: string;
  type: "schedule" | "event";
  integration?: {
    name: string;
    icon: string;
  };
}

const INTEGRATIONS = [
  { name: "Gmail", icon: "📧" },
  { name: "Outlook", icon: "📨" },
  { name: "SharePoint", icon: "📁" },
  { name: "Google Drive", icon: "📂" },
  { name: "Dropbox", icon: "📦" },
  { name: "Salesforce", icon: "☁️" },
  { name: "HubSpot", icon: "🎯" },
  { name: "Slack", icon: "💬" },
  { name: "Teams", icon: "👥" },
  { name: "PostgreSQL", icon: "🗄️" },
  { name: "MySQL", icon: "💾" },
  { name: "Custom API", icon: "🔌" },
];

export const WorkflowTriggerNode = memo(({ data }: NodeProps<WorkflowTriggerNodeData & { runState?: string }>) => {
  let borderClass = "";
  if (data.runState === "running") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-blue-100";
  return (
    <Card className={`p-4 w-48 shadow-lg bg-blue-50 ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">
          {data.type === "schedule" ? <Clock /> : <Zap />}
        </div>
        <div className="text-sm font-medium text-center">{data.label}</div>
        {data.integration && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{data.integration.icon}</span>
            <span>{data.integration.name}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 