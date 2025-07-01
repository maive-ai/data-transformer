"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Database, Mail, FileUp, Server, Zap, Cloud } from "lucide-react";
import { IntegrationSubType } from "@/types/enums";

interface WorkflowIntegrationNodeData {
  label: string;
  type: string;
  integrationType: IntegrationSubType;
  erpAction?: string;
  emailAction?: string;
  direction?: 'read' | 'write' | 'both';
  displayName?: string;
}

export const WorkflowIntegrationNode = memo(({ data }: NodeProps<WorkflowIntegrationNodeData & { runState?: string, highlighted?: boolean }>) => {
  let borderClass = "";
  if (data.runState === "prompt") borderClass = "border-2 border-blue-400 animate-pulse";
  else if (data.runState === "running") borderClass = "";
  else if (data.runState === "done") borderClass = "border-2 border-green-500";
  else borderClass = "border border-gray-200";

  const highlighted = data.highlighted && data.runState !== "prompt";

  const getIcon = () => {
    switch (data.integrationType) {
      case IntegrationSubType.ERP:
        return <Database className="w-6 h-6" />;
      case IntegrationSubType.EMAIL:
        return <Mail className="w-6 h-6" />;
      case IntegrationSubType.FILE_STORAGE:
        return <FileUp className="w-6 h-6" />;
      case IntegrationSubType.DATABASE:
        return <Server className="w-6 h-6" />;
      case IntegrationSubType.API:
        return <Zap className="w-6 h-6" />;
      case IntegrationSubType.WEBHOOK:
        return <Cloud className="w-6 h-6" />;
      default:
        return <Database className="w-6 h-6" />;
    }
  };

  const getSubLabel = () => {
    if (data.integrationType === IntegrationSubType.ERP && data.erpAction) {
      return data.erpAction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (data.integrationType === IntegrationSubType.EMAIL && data.emailAction) {
      return data.emailAction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return data.integrationType.toUpperCase();
  };

  return (
    <Card className={`p-4 w-full h-full shadow-lg ${borderClass} ${highlighted ? 'rainbow-outline' : ''} bg-white`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-sm font-medium text-center">{data.displayName || data.label}</div>
        <div className="text-xs text-gray-500 text-center">{getSubLabel()}</div>
        {data.direction && (
          <div className="text-xs text-blue-600 font-medium">
            {data.direction === 'read' ? '→' : data.direction === 'write' ? '←' : '↔'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 