"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Zap, Brain, FileSpreadsheet, Mail, Database, FileUp, FileText, Globe, Bot, Repeat, Signpost, Server, Cloud } from "lucide-react";
import { Node } from "reactflow";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { 
  IntegrationSubType, 
  NodeType, 
  TriggerSubType, 
  OutputSubType, 
  ActionSubType,
  NodeLabel,
  ErpAction,
  EmailAction,
  IntegrationDirection,
  HttpMethod
} from "@/types/enums";

interface WorkflowToolbarProps {
  onAddNode: (node: Node) => void;
}

// We'll keep a simple counter in closure to offset nodes
let nodeCount = 0;

export function WorkflowToolbar({ onAddNode }: WorkflowToolbarProps) {
  const getNextPosition = () => {
    const offset = 40;
    const pos = { x: 100 + nodeCount * offset, y: 100 + nodeCount * offset };
    nodeCount += 1;
    return pos;
  };

  const handleAddNode = (type: string, data: any) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: getNextPosition(),
      data,
    };
    onAddNode(newNode);
  };

  return (
    <div className="flex flex-row gap-6 p-2 bg-white border rounded-lg shadow-sm items-center">
      {/* Trigger Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Trigger
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-row gap-2 p-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode(NodeType.TRIGGER, {
                      label: NodeLabel.FILE_UPLOAD,
                      type: TriggerSubType.MANUAL,
                    })
                  }
                >
                  <FileUp className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{NodeLabel.FILE_UPLOAD}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode(NodeType.TRIGGER, {
                      label: NodeLabel.SCHEDULE,
                      type: TriggerSubType.SCHEDULE,
                    })
                  }
                >
                  <Clock className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{NodeLabel.SCHEDULE}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode(NodeType.HTTP_TRIGGER, {
                      label: NodeLabel.HTTP_ENDPOINT,
                      type: TriggerSubType.HTTP,
                      method: HttpMethod.POST,
                      endpoint: "/api/webhook",
                    })
                  }
                >
                  <Globe className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{NodeLabel.HTTP_ENDPOINT}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </PopoverContent>
      </Popover>

      {/* Actions Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Actions
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="grid gap-2">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.ACTION, { 
                label: NodeLabel.AI_TRANSFORM, 
                type: ActionSubType.AI_TRANSFORM 
              })}
            >
              <Brain className="w-4 h-4 mr-2" />
              {NodeLabel.AI_TRANSFORM}
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.AI_OPERATOR, { 
                label: NodeLabel.AI_OPERATOR, 
                type: ActionSubType.AI_TRANSFORM, 
                prompt: "" 
              })}
            >
              <Bot className="w-4 h-4 mr-2" />
              {NodeLabel.AI_OPERATOR}
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.ACTION, { 
                label: NodeLabel.EXCEL_TRANSFORM, 
                iconType: "excel", 
                type: ActionSubType.EXCEL_TRANSFORM 
              })}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {NodeLabel.EXCEL_TRANSFORM}
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.ACTION, { 
                label: NodeLabel.DECISION, 
                iconType: "decision", 
                type: ActionSubType.DECISION 
              })}
            >
              <Signpost className="w-4 h-4 mr-2" />
              {NodeLabel.DECISION}
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.LOOP, { 
                label: NodeLabel.LOOP, 
                type: ActionSubType.LOOP 
              })}
            >
              <Repeat className="w-4 h-4 mr-2" />
              {NodeLabel.LOOP}
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.ACTION, { 
                label: NodeLabel.CSV_APPEND, 
                type: ActionSubType.AI_TRANSFORM 
              })}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {NodeLabel.CSV_APPEND}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Output Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Output
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-row gap-2 p-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode(NodeType.OUTPUT, {
                      label: NodeLabel.EXCEL_EXPORT,
                      type: OutputSubType.EXCEL,
                    })
                  }
                >
                  <FileSpreadsheet className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{NodeLabel.EXCEL_EXPORT}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode(NodeType.HTTP_RESPONSE, {
                      label: NodeLabel.HTTP_RESPONSE,
                      type: OutputSubType.HTTP,
                      statusCode: 200,
                      contentType: "application/json",
                    })
                  }
                >
                  <Globe className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{NodeLabel.HTTP_RESPONSE}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode(NodeType.OUTPUT, {
                      label: NodeLabel.DOC_EXPORT,
                      type: OutputSubType.DOC,
                    })
                  }
                >
                  <FileText className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{NodeLabel.DOC_EXPORT}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </PopoverContent>
      </Popover>

      {/* Integration Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Integration
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="grid gap-2">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.INTEGRATION, { 
                label: NodeLabel.ERP, 
                type: NodeType.INTEGRATION,
                integrationType: IntegrationSubType.ERP,
                erpAction: ErpAction.BOM_LOOKUP,
                direction: IntegrationDirection.BOTH
              })}
            >
              <Database className="w-4 h-4 mr-2" />
              ERP System
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.INTEGRATION, { 
                label: "Email", 
                type: NodeType.INTEGRATION,
                integrationType: IntegrationSubType.EMAIL,
                emailAction: EmailAction.SEND,
                direction: IntegrationDirection.BOTH
              })}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.INTEGRATION, { 
                label: "File Storage", 
                type: NodeType.INTEGRATION,
                integrationType: IntegrationSubType.FILE_STORAGE,
                direction: IntegrationDirection.BOTH
              })}
            >
              <FileUp className="w-4 h-4 mr-2" />
              File Storage
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.INTEGRATION, { 
                label: "Database", 
                type: NodeType.INTEGRATION,
                integrationType: IntegrationSubType.DATABASE,
                direction: IntegrationDirection.BOTH
              })}
            >
              <Server className="w-4 h-4 mr-2" />
              Database
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.INTEGRATION, { 
                label: "API", 
                type: NodeType.INTEGRATION,
                integrationType: IntegrationSubType.API,
                direction: IntegrationDirection.BOTH
              })}
            >
              <Globe className="w-4 h-4 mr-2" />
              API
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode(NodeType.INTEGRATION, { 
                label: "Webhook", 
                type: NodeType.INTEGRATION,
                integrationType: IntegrationSubType.WEBHOOK,
                direction: IntegrationDirection.WRITE
              })}
            >
              <Cloud className="w-4 h-4 mr-2" />
              Webhook
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 