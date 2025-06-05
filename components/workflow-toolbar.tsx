"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Zap, Brain, FileSpreadsheet, Mail, Database, FileUp, FileText, Globe, Bot, Repeat, Signpost } from "lucide-react";
import { Node } from "reactflow";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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
                    handleAddNode("trigger", {
                      label: "Manual Upload",
                      type: "manual",
                    })
                  }
                >
                  <FileUp className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manual Upload</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("trigger", {
                      label: "Email Trigger",
                      type: "event",
                      integration: { name: "Gmail", icon: "📧" },
                    })
                  }
                >
                  <Mail className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Email Trigger</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("trigger", {
                      label: "Schedule",
                      type: "schedule",
                    })
                  }
                >
                  <Clock className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Schedule</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("httpTrigger", {
                      label: "HTTP Endpoint",
                      type: "http",
                      method: "POST",
                      endpoint: "/api/webhook",
                    })
                  }
                >
                  <Globe className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>HTTP Endpoint</TooltipContent>
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
              onClick={() => handleAddNode("action", { label: "AI Transform", type: "action" })}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Transform
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("aiOperator", { label: "AI Operator", type: "action", prompt: "" })}
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Operator
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("action", { label: "Excel Transform", iconType: "excel", type: "action" })}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Transform
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("action", { label: "Email Action", iconType: "email", type: "action" })}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Action
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("action", { label: "ERP Action", iconType: "erp", type: "action" })}
            >
              <Database className="w-4 h-4 mr-2" />
              ERP Action
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("erpLookup", { label: "ERP Lookup", iconType: "erp", type: "action" })}
            >
              <Database className="w-4 h-4 mr-2" />
              ERP Lookup
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("action", { label: "Decision", iconType: "decision", type: "decision" })}
            >
              <Signpost className="w-4 h-4 mr-2" />
              Decision
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleAddNode("loop", { label: "Loop", type: "action" })}
            >
              <Repeat className="w-4 h-4 mr-2" />
              Loop
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
                    handleAddNode("output", {
                      label: "Excel Export",
                      type: "excel",
                    })
                  }
                >
                  <FileSpreadsheet className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excel Output</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("httpResponse", {
                      label: "HTTP Response",
                      type: "http",
                      statusCode: 200,
                      contentType: "application/json",
                    })
                  }
                >
                  <Globe className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>HTTP Response</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("output", {
                      label: "Doc Export",
                      type: "doc",
                    })
                  }
                >
                  <FileText className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Doc Output</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("output", {
                      label: "Send Email",
                      type: "email",
                    })
                  }
                >
                  <Mail className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Email Output</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("output", {
                      label: "ERP Write",
                      type: "erp",
                    })
                  }
                >
                  <Database className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ERP Output</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </PopoverContent>
      </Popover>
    </div>
  );
} 