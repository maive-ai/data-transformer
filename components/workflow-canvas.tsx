"use client";

import { useCallback, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { WorkflowNode } from "./workflow-node";
import { WorkflowTriggerNode } from "./workflow-trigger-node";
import { WorkflowOutputNode } from "./workflow-output-node";
import { WorkflowToolbar } from "./workflow-toolbar";
import { WorkflowSidebar } from "./workflow-sidebar";
import { convertCsvToExcel } from "@/lib/utils";
import * as XLSX from "xlsx";

const nodeTypes = {
  trigger: WorkflowTriggerNode,
  action: WorkflowNode,
  output: WorkflowOutputNode,
};

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export const WorkflowCanvas = forwardRef(function WorkflowCanvas({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
}: WorkflowCanvasProps, ref) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [nodeRunStates, setNodeRunStates] = useState<Record<string, 'idle' | 'running' | 'done' | 'error'>>({});
  const [nodeRunHistory, setNodeRunHistory] = useState<Record<string, Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>>>({});
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentUploadNode, setCurrentUploadNode] = useState<string | null>(null);

  // Helper: get topological order of nodes (DAG)
  const getTopologicalOrder = () => {
    const adj: Record<string, string[]> = {};
    edges.forEach(e => {
      if (!adj[e.source]) adj[e.source] = [];
      adj[e.source].push(e.target);
    });
    const visited: Record<string, boolean> = {};
    const order: string[] = [];
    function dfs(v: string) {
      if (visited[v]) return;
      visited[v] = true;
      (adj[v] || []).forEach(dfs);
      order.push(v);
    }
    nodes.forEach(n => dfs(n.id));
    return order.reverse().filter((id, i, arr) => arr.indexOf(id) === i);
  };

  const validateConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;

    // Get output type from source node
    const sourceOutputType = sourceNode.data.ioConfig?.outputType?.type;
    // Get input types from target node
    const targetInputTypes = targetNode.data.ioConfig?.inputTypes?.map((t: any) => t.type) || [];

    // If either node doesn't have type configuration, allow the connection
    if (!sourceOutputType || targetInputTypes.length === 0) return true;

    // Check if the source output type is compatible with any of the target input types
    return targetInputTypes.includes(sourceOutputType);
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!validateConnection(params)) {
        // You could show a toast notification here
        console.warn('Incompatible node types');
        return;
      }
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, validateConnection]
  );

  // Run pipeline animation logic
  const runPipeline = async () => {
    setRunning(true);
    const order = getTopologicalOrder();
    const newRunStates: Record<string, 'idle' | 'running' | 'done' | 'error'> = {};
    order.forEach(id => { newRunStates[id] = 'idle'; });
    setNodeRunStates({ ...newRunStates });

    // Track data flow between nodes
    const nodeData: Map<string, { file?: File; inputFile?: string; outputFile?: string; fileUrl?: string }> = new Map();

    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Update node run state
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              runState: 'running'
            }
          };
        }
        return n;
      }));

      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (node.type === 'trigger' && node.data.type === 'manual') {
          // Handle manual file upload
          const file = await new Promise<File>((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.json,.xml,.pdf,.doc,.docx';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                resolve(file);
              } else {
                reject(new Error('No file selected'));
              }
            };
            input.click();
          });

          // Store the file for downstream nodes
          nodeData.set(nodeId, { file });
          
          // Update node run state
          setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  runState: 'done',
                  uploadedFileName: file.name
                }
              };
            }
            return n;
          }));
        } else if (node.type === 'action') {
          // Get input file from previous node
          const inputNode = edges.find(e => e.target === nodeId)?.source;
          const inputData = inputNode ? nodeData.get(inputNode) : null;
          
          if (!inputData?.file) {
            throw new Error('No input file available');
          }

          // Create form data for Gemini API
          const formData = new FormData();
          formData.append('inputFile', inputData.file);
          
          if (node.data.prompt) {
            formData.append('prompt', node.data.prompt);
          }

          if (node.data.useOutputTemplate && node.data.outputFileName) {
            const outputTemplate = await fetch(`/templates/${node.data.outputFileName}`).then(r => r.blob());
            formData.append('outputTemplate', new File([outputTemplate], node.data.outputFileName));
            formData.append('useOutputTemplate', 'true');
          }

          // Call Gemini API
          const response = await fetch('/api/gemini', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Failed to process file with Gemini');
          }

          const result = await response.json();
          
          // Store the transformed data for downstream nodes
          nodeData.set(nodeId, { 
            file: new File([result.data], 'transformed.csv', { type: 'text/csv' })
          });

          // Update node run state
          setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  runState: 'done'
                }
              };
            }
            return n;
          }));
        } else if (node.type === 'output' && node.data.type === 'excel') {
          // Get input file from previous node
          const inputNode = edges.find(e => e.target === nodeId)?.source;
          const inputData = inputNode ? nodeData.get(inputNode) : null;
          
          if (!inputData?.file) {
            throw new Error('No input file available');
          }

          // Convert CSV to Excel
          const csvContent = await inputData.file.text();
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.aoa_to_sheet(csvContent.split('\n').map(row => row.split(',')));
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
          
          // Generate Excel file
          const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
          const excelFile = new File([excelBuffer], node.data.fileName || 'output.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

          // Upload the Excel file to the backend
          const formData = new FormData();
          formData.append('file', excelFile);
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload Excel file to backend');
          }
          const uploadResult = await uploadResponse.json();
          const fileUrl = uploadResult.url; // e.g., /uploads/uuid-output.xlsx

          // Store the file URL for downstream use (e.g., download link)
          nodeData.set(nodeId, { fileUrl });

          // Update node run state
          setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  runState: 'done',
                  fileUrl, // Make available for sidebar
                }
              };
            }
            return n;
          }));
        }
      } catch (error) {
        console.error(`Error running node ${nodeId}:`, error);
        
        // Update node run state to error
        setNodes(nds => nds.map(n => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                runState: 'error'
              }
            };
          }
          return n;
        }));
      }

      // Add run history for this node
      setNodeRunHistory(history => {
        const entry = {
          timestamp: new Date().toISOString(),
          status: 'done',
          inputFile: node?.data?.uploadedFileName,
          outputFile: node?.data?.fileName,
        };
        return {
          ...history,
          [nodeId]: [...(history[nodeId] || []), entry],
        };
      });
    }
    setRunning(false);
  };

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      onNodesChange?.(nodes);
    },
    [nodes, onNodesChange, onNodesChangeInternal]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      onEdgesChange?.(edges);
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  );

  const handleAddNode = useCallback(
    (newNode: Node) => {
      setNodes((nds) => [...nds, newNode]);
      onNodesChange?.(nodes);
    },
    [nodes, onNodesChange]
  );

  const handleNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleSidebarClose = () => setSelectedNodeId(null);

  const handleNodeDataChange = (id: string, newData: any) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Keyboard shortcut: Cmd+R (Mac) or Ctrl+R (Win/Linux) to run pipeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isRunShortcut = (isMac && e.metaKey && e.key === 'r') || (!isMac && e.ctrlKey && e.key === 'r');
      if (isRunShortcut) {
        e.preventDefault();
        if (!running) runPipeline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running]);

  useImperativeHandle(ref, () => ({
    runPipeline,
    running,
  }));

  return (
    <div className="w-full h-full flex flex-col relative">
      <WorkflowToolbar onAddNode={handleAddNode} />
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes.map(n => ({
            ...n,
            selected: n.id === selectedNodeId,
            data: {
              ...n.data,
              runState: nodeRunStates[n.id] || 'idle',
              running,
            },
          }))}
          edges={edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } }))}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          onNodeClick={handleNodeClick}
          onPaneClick={handleSidebarClose}
        >
          <Background />
          <Controls />
        </ReactFlow>
        {selectedNode && (
          <WorkflowSidebar
            node={selectedNode}
            onClose={handleSidebarClose}
            onChange={handleNodeDataChange}
            runHistory={nodeRunHistory[selectedNode.id] || []}
          />
        )}
        {showFileUpload && currentUploadNode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Upload File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please select a file to continue the pipeline execution.
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.json,.xml,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setShowFileUpload(false);
                    setCurrentUploadNode(null);
                  }
                }}
                className="block w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}); 