"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Upload, Calendar } from "lucide-react";
import { RunState, TriggerSubType } from "@/types/enums";

interface WorkflowTriggerNodeData {
  label: string;
  type: string;
  runState?: string;
  highlighted?: boolean;
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

// Config: disable node outlines/highlights
const HIGHLIGHT_NODES_WHEN_RUNNING = false;

export const WorkflowTriggerNode = memo(({ data }: NodeProps<WorkflowTriggerNodeData>) => {
  let borderClass = "";
  if (HIGHLIGHT_NODES_WHEN_RUNNING) {
    if (data.runState === RunState.PROMPT) borderClass = "border-2 border-blue-400 animate-pulse";
    else if (data.runState === RunState.RUNNING) borderClass = "";
    else if (data.runState === RunState.DONE) borderClass = "border-2 border-green-500";
    else borderClass = "border border-gray-200";
  } else {
    borderClass = "border border-gray-200";
  }

  const highlighted = data.highlighted && data.runState !== RunState.PROMPT;
  if (highlighted) {
    // Debug: log when a node is highlighted
    console.log('Rainbow highlight (trigger):', data.label, highlighted);
  }

  const getIcon = () => {
    switch (data.type) {
      case TriggerSubType.MANUAL:
        return <Upload className="w-6 h-6" />;
      case TriggerSubType.EVENT:
        return <Calendar className="w-6 h-6" />;
      default:
        return <Upload className="w-6 h-6" />;
    }
  };

  const getBgColor = () => {
    switch (data.type) {
      case TriggerSubType.MANUAL:
        return 'bg-white';
      case TriggerSubType.EVENT:
        return 'bg-purple-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''} ${getBgColor()}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 