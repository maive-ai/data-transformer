"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Zap, Brain, FileSpreadsheet, Mail, Database, FileUp } from "lucide-react";
import { Node } from "reactflow";

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
    <TooltipProvider>
      <div
        className="absolute left-1/2 top-6 z-20 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-xl shadow-lg bg-white/80 backdrop-blur border border-gray-200"
        style={{ pointerEvents: "auto" }}
      >
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
          <TooltipContent>Schedule Trigger</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleAddNode("trigger", {
                  label: "Event",
                  type: "event",
                })
              }
            >
              <Zap className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Event Trigger</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleAddNode("trigger", {
                  label: "File Upload",
                  type: "manual",
                  icon: <FileUp className="w-6 h-6" />,
                })
              }
            >
              <FileUp className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>File Upload</TooltipContent>
        </Tooltip>
        <span className="w-px h-6 bg-gray-200 mx-2" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleAddNode("action", {
                  label: "AI Data Transform",
                  type: "action",
                  icon: <Brain className="w-6 h-6" />,
                })
              }
            >
              <Brain className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>AI Action</TooltipContent>
        </Tooltip>
        <span className="w-px h-6 bg-gray-200 mx-2" />
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
      </div>
    </TooltipProvider>
  );
} 