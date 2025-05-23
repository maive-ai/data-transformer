"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Clock, Zap, FileUp } from "lucide-react";

interface WorkflowTriggerNodeData {
  label: string;
  type: "schedule" | "event" | "manual";
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

export const WorkflowTriggerNode = memo(({ data }: NodeProps<WorkflowTriggerNodeData & { runState?: string, highlighted?: boolean }>) => {
  let borderClass = "";
  if (data.runState === "running") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-blue-100";

  const highlighted = data.highlighted;
  if (highlighted) {
    // Debug: log when a trigger node is highlighted
    console.log('Rainbow highlight (trigger):', data.label, highlighted);
  }

  const getIcon = () => {
    switch (data.type) {
      case "schedule":
        return <Clock className="w-6 h-6" />;
      case "event":
        return <Zap className="w-6 h-6" />;
      case "manual":
        return <FileUp className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-4 w-48 shadow-lg bg-blue-50 ${borderClass} ${highlighted ? 'rainbow-outline' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">
          {getIcon()}
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