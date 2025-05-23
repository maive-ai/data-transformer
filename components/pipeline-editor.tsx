"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { WorkflowCanvas } from "@/components/workflow-canvas";
import type { Pipeline } from "@/types/pipeline";
import { Save, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { Node, Edge, applyEdgeChanges, applyNodeChanges, NodeChange, EdgeChange } from "reactflow";

interface PipelineEditorProps {
  pipeline: Pipeline | null;
  isNew?: boolean;
}

export function PipelineEditor({ pipeline, isNew = false }: PipelineEditorProps) {
  const [nodes, setNodes] = useState<Node[]>(pipeline?.workflow?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(pipeline?.workflow?.edges || []);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (pipeline?.workflow) {
      setNodes(pipeline.workflow.nodes);
      setEdges(pipeline.workflow.edges);
    } else if (isNew) {
      // Set default name and description for new pipeline
      pipeline = {
        id: '',
        name: 'GMail to Excel',
        description: 'Convert PO in GMail to ERP Spreadsheet',
        createdAt: '',
        updatedAt: '',
        steps: [],
        runs: [],
      };
    }
  }, [pipeline, isNew]);

  // Ensure PipelineEditor always has the latest nodes state
  const handleNodesChange = useCallback(
    (updatedNodes: Node[]) => {
      setNodes(updatedNodes);
      // Auto-save pipeline to localStorage on node change
      if (!pipeline) return;
      const updatedPipeline = {
        ...pipeline,
        workflow: {
          nodes: updatedNodes,
          edges,
        },
        updatedAt: new Date().toISOString(),
      };
      const pipelines = JSON.parse(localStorage.getItem("pipelines") || "[]");
      const index = pipelines.findIndex((p: Pipeline) => p.id === pipeline!.id);
      if (index !== -1) {
        pipelines[index] = updatedPipeline;
        localStorage.setItem("pipelines", JSON.stringify(pipelines));
      }
    },
    [pipeline, edges]
  );

  // Use ReactFlow's applyEdgeChanges for correct edge updates
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isNew) {
        // Create new pipeline
        const newPipeline = {
          id: `pipeline-${Date.now()}`,
          name: pipeline?.name || "GMail to Excel",
          description: pipeline?.description || "Convert PO in GMail to ERP Spreadsheet",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          steps: [],
          runs: [],
          workflow: {
            nodes,
            edges,
          },
        };
        
        // Store in local storage for demo purposes
        const pipelines = JSON.parse(localStorage.getItem("pipelines") || "[]");
        pipelines.push(newPipeline);
        localStorage.setItem("pipelines", JSON.stringify(pipelines));
        
        toast({
          title: "Success",
          description: "Pipeline created successfully",
        });
        
        router.push(`/dashboard/pipelines/${newPipeline.id}`);
      } else {
        // Update existing pipeline
        const updatedPipeline = {
          ...pipeline,
          workflow: {
            nodes,
            edges,
          },
          updatedAt: new Date().toISOString(),
        };
        
        // Update in local storage for demo purposes
        const pipelines = JSON.parse(localStorage.getItem("pipelines") || "[]");
        const index = pipelines.findIndex((p: Pipeline) => p.id === pipeline?.id);
        if (index !== -1) {
          pipelines[index] = updatedPipeline;
          localStorage.setItem("pipelines", JSON.stringify(pipelines));
        }
        
        toast({
          title: "Success",
          description: "Pipeline updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save pipeline",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full flex flex-col" data-oid="sj2d5fe" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
      <div className="relative w-full h-full flex-1">
        {/* Floating Play and Save Buttons */}
        <div className="fixed z-30 top-6 right-10 flex gap-3 items-center">
          <Button
            onClick={() => canvasRef.current?.runPipeline()}
            disabled={canvasRef.current?.running}
            className="shadow-lg rounded-xl p-3 text-base font-semibold bg-black text-white hover:bg-gray-900 transition"
            aria-label="Run Pipeline"
            size="icon"
          >
            <Play className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-lg rounded-xl px-6 py-2 text-base font-semibold bg-black text-white hover:bg-gray-900 transition"
            data-oid=":.iu:qg"
          >
            <Save className="mr-2 h-5 w-5" data-oid="7o6f4fk" />
            {isSaving ? "Saving..." : isNew ? "Create" : "Save"}
          </Button>
        </div>
        {/* Floating Toolbar and Canvas */}
        <CardHeader className="pb-3" data-oid="5g7o1h9" style={{ display: 'none' }} />
        <CardContent className="flex-1 p-0 h-full" data-oid="ctszpd4">
          <WorkflowCanvas
            ref={canvasRef}
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={setEdges}
          />
        </CardContent>
      </div>
    </Card>
  );
}
