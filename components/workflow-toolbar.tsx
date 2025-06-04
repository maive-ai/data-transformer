"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Zap, Brain, FileSpreadsheet, Mail, Database, FileUp, FileText, Globe, Bot } from "lucide-react";
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

      {/* Action Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Action
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
                    handleAddNode("action", {
                      label: "AI Transform",
                      type: "action",
                    })
                  }
                >
                  <Brain className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Transform</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleAddNode("aiOperator", {
                      label: "AI Operator",
                      type: "action",
                      prompt: "",
                    })
                  }
                >
                  <Bot className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Operator</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                      label: "ERP Integration",
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