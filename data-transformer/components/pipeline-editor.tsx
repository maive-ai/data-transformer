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
import { Play, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { Node, Edge, applyEdgeChanges, applyNodeChanges, NodeChange, EdgeChange } from "reactflow";
import debounce from 'lodash.debounce';

interface PipelineEditorProps {
  pipeline: Pipeline | null;
  isNew?: boolean;
}

export function PipelineEditor({ pipeline, isNew = false }: PipelineEditorProps) {
  const [nodes, setNodes] = useState<Node[]>(pipeline?.workflow?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(pipeline?.workflow?.edges || []);
  const [pipelineName, setPipelineName] = useState(pipeline?.name || "New Pipeline");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const canvasRef = useRef<any>(null);
  const pipelineId = pipeline?.id;

  // Refs to always have latest nodes/edges
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pipelineNameRef = useRef(pipelineName);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { pipelineNameRef.current = pipelineName; }, [pipelineName]);

  // Load pipeline from backend on mount
  useEffect(() => {
    if (!pipelineId) return;
    async function loadPipeline() {
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}`);
        if (res.ok) {
          const data = await res.json();
          setNodes(data.workflow.nodes);
          setEdges(data.workflow.edges);
          setPipelineName(data.name || "New Pipeline");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load pipeline",
          variant: "destructive",
        });
      }
    }
    loadPipeline();
  }, [pipelineId]);

  // Debounced save function using refs
  const savePipeline = useCallback(
    debounce(async () => {
      if (!pipelineId) return;
      try {
        const payload = {
          ...pipeline,
          name: pipelineNameRef.current,
          workflow: { nodes: nodesRef.current, edges: edgesRef.current },
          updatedAt: new Date().toISOString(),
        };
        console.log("Saving pipeline to backend:", payload);
        const res = await fetch(`/api/pipelines/${pipelineId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error('Failed to save pipeline');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save pipeline",
          variant: "destructive",
        });
      }
    }, 500),
    [pipeline, pipelineId]
  );

  // Add a ref to track if stopPipeline was called
  const stopPipelineRef = useRef(false);

  // Listen for all nodes going idle after stopPipeline, then save
  useEffect(() => {
    if (stopPipelineRef.current) {
      // If all nodes are idle, persist
      if (nodes.every(n => n.data.runState === 'idle' || n.data.runState === undefined)) {
        savePipeline();
        stopPipelineRef.current = false;
      }
    }
  }, [nodes, savePipeline]);

  const handlePipelineNameChange = (newName: string) => {
    setPipelineName(newName);
    savePipeline();
  };

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      savePipeline();
    },
    [savePipeline]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      savePipeline();
    },
    [savePipeline]
  );

  const handleNodeDataChange = (id: string, newData: any) => {
    setNodes(nds => {
      const updated = nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n);
      savePipeline();
      return updated;
    });
  };

  return (
    <Card className="h-full flex flex-col" data-oid="sj2d5fe" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
      <div className="relative w-full h-full flex-1">
        {/* Top bar and Canvas */}
        <CardHeader className="pb-3" data-oid="5g7o1h9" style={{ display: 'none' }} />
        <CardContent className="flex-1 p-0 h-full" data-oid="ctszpd4">
          <WorkflowCanvas
            ref={canvasRef}
            initialNodes={nodes}
            initialEdges={edges}
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            pipelineName={pipelineName}
            onPipelineNameChange={handlePipelineNameChange}
            renderRight={
              <div className="flex items-center justify-end" style={{ minWidth: 48 }}>
                {canvasRef.current?.running ? (
                  <Button
                    onClick={() => {
                      stopPipelineRef.current = true;
                      canvasRef.current?.stopPipeline?.();
                    }}
                    className="shadow-lg rounded-xl p-3 text-base font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                    aria-label="Stop Pipeline"
                    size="icon"
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => canvasRef.current?.runPipeline()}
                    className="shadow-lg rounded-xl p-3 text-base font-semibold bg-black text-white hover:bg-gray-900 transition"
                    aria-label="Run Pipeline"
                    size="icon"
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                )}
              </div>
            }
          />
        </CardContent>
      </div>
    </Card>
  );
}
