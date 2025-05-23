"use client";

import { useCallback, useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  MarkerType,
  applyEdgeChanges,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { WorkflowNode } from './workflow-node';
import { WorkflowTriggerNode } from './workflow-trigger-node';
import { WorkflowOutputNode } from './workflow-output-node';
import { WorkflowSidebar } from './workflow-sidebar';
import { WorkflowToolbar } from "./workflow-toolbar";
import { convertCsvToExcel } from "@/lib/utils";
import * as XLSX from "xlsx";

// Define nodeTypes outside the component for ReactFlow stability
const nodeTypes = {
  trigger: WorkflowTriggerNode,
  action: WorkflowNode,
  output: WorkflowOutputNode,
};

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
}

// Helper to get PDT time string
function getPdtTimestamp() {
  const now = new Date();
  // Convert to PDT (America/Los_Angeles)
  return now.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/[/:]/g, '-').replace(/, /g, '_').replace(/ /g, '');
}

export const WorkflowCanvas = forwardRef(function WorkflowCanvas({
  initialNodes = [],
  initialEdges = [],
  nodes,
  setNodes,
  edges,
  setEdges,
  onNodesChange,
  onEdgesChange,
}: WorkflowCanvasProps, ref) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [nodeRunHistory, setNodeRunHistory] = useState<Record<string, Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>>>({});
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentUploadNode, setCurrentUploadNode] = useState<string | null>(null);
  const completedRef = useRef(new Set<string>());

  // Reset all nodes to idle state on mount
  useEffect(() => {
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: {
          ...n.data,
          runState: 'idle',
        },
      }))
    );
  }, []);

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
    // Find root nodes (nodes with no incoming edges)
    const sources = new Set(edges.map(e => e.source));
    const rootNodes = nodes.filter(n => !edges.some(e => e.target === n.id));
    // Sort root nodes by y position (ascending = highest on graph first)
    const sortedRootNodes = [...rootNodes].sort((a, b) => a.position.y - b.position.y);
    // Start DFS from sorted root nodes
    sortedRootNodes.forEach(n => dfs(n.id));
    // For any disconnected nodes, run DFS as well
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
    // Find root nodes (no incoming edges), sorted by y position
    const rootNodes = [...nodes.filter(n => !edges.some(e => e.target === n.id))].sort((a, b) => a.position.y - b.position.y);
    // Track node completion and outputs
    const nodeData: Map<string, { file?: File; inputFile?: string; outputFile?: string; fileUrl?: string; files?: File[]; uploadedFileNames?: string[] }> = new Map();
    completedRef.current = new Set();
    const waiting: Record<string, (() => void)[]> = {};

    // Helper: get all downstream nodes
    const getDownstream = (nodeId: string) => edges.filter(e => e.source === nodeId).map(e => e.target);
    // Helper: get all upstream nodes
    const getUpstream = (nodeId: string) => edges.filter(e => e.target === nodeId).map(e => e.source);

    // Helper: run a node if all its dependencies are satisfied
    const runNode = async (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || completedRef.current.has(nodeId)) return;
      // Check if all upstream nodes are completed
      const upstream = getUpstream(nodeId);
      if (upstream.some(id => !completedRef.current.has(id))) {
        // Wait for dependencies
        if (!waiting[nodeId]) waiting[nodeId] = [];
        await new Promise<void>(resolve => waiting[nodeId].push(resolve));
        // After dependencies are done, re-run
        return runNode(nodeId);
      }
      if (node.type === 'trigger' && node.data.type === 'manual') {
        // Set all other file upload nodes to idle before starting this one
        setNodes(nds => nds.map(n =>
          n.type === 'trigger' && n.data.type === 'manual'
            ? { ...n, data: { ...n.data, runState: n.id === nodeId ? 'running' : (n.data.runState === 'done' ? 'done' : 'idle') } }
            : n
        ));
        setCurrentUploadNode(nodeId);
        try {
          await new Promise(requestAnimationFrame);
          await new Promise(resolve => setTimeout(resolve, 2000));
          const files = await new Promise<File[]>((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.json,.xml,.pdf,.doc,.docx';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) {
                resolve(files);
              } else {
                reject(new Error('No files selected'));
              }
            };
            input.click();
          });
          nodeData.set(nodeId, { files });
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'done', uploadedFileNames: files.map(f => f.name) } } : n));
          setCurrentUploadNode(null);
          for (const file of files) {
            const pdtTimestamp = getPdtTimestamp();
            const traceName = `${nodeId}-${pdtTimestamp}-${Date.now()}-input-${file.name}`;
            const inputFormData = new FormData();
            inputFormData.append('nodeId', nodeId);
            inputFormData.append('type', 'input');
            inputFormData.append('file', file, traceName);
            await fetch('/api/trace', { method: 'POST', body: inputFormData });
          }
          completedRef.current.add(nodeId);
          // On successful upload, trigger downstream nodes
          for (const downstreamId of getDownstream(nodeId)) {
            runNode(downstreamId);
          }
          return;
        } catch (error) {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'error' } } : n));
          setCurrentUploadNode(null);
          return;
        }
      } else if (node.type === 'output' && node.data.type === 'excel') {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'running' } } : n));
        try {
          // Gather all input files from upstream nodes
          const inputFiles: File[] = [];
          for (const upstreamId of getUpstream(nodeId)) {
            const upstreamData = nodeData.get(upstreamId);
            if (upstreamData?.files) inputFiles.push(...upstreamData.files);
            else if (upstreamData?.file) inputFiles.push(upstreamData.file);
          }
          if (!inputFiles.length) throw new Error('No input files available');

          // Process each CSV file and convert to Excel
          const excelFiles: File[] = [];
          for (const file of inputFiles) {
            if (file.type === 'text/csv') {
              const csvContent = await file.text();
              const excelBlob = await convertCsvToExcel(csvContent, file.name.replace('.csv', '.xlsx'));
              const excelFile = new File([excelBlob], file.name.replace('.csv', '.xlsx'), { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
              });
              excelFiles.push(excelFile);
            }
          }

          if (excelFiles.length > 0) {
            nodeData.set(nodeId, { files: excelFiles });
            setNodes(nds => nds.map(n => n.id === nodeId ? { 
              ...n, 
              data: { 
                ...n.data, 
                runState: 'done',
                fileUrl: URL.createObjectURL(excelFiles[0]), // Create download URL for the first Excel file
                outputFileName: excelFiles[0].name // Also store the output file name for display
              } 
            } : n));
          } else {
            throw new Error('No CSV files to convert');
          }

          // Log the conversion in run history
          setNodeRunHistory(history => {
            const entry = {
              timestamp: new Date().toISOString(),
              status: 'done',
              inputFile: inputFiles.map(f => f.name).join(','),
              outputFile: excelFiles.map(f => f.name).join(',')
            };
            return {
              ...history,
              [nodeId]: [...(history[nodeId] || []), entry],
            };
          });

        } catch (error) {
          console.error(`Error running Excel export node ${nodeId}:`, error);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'error' } } : n));
        }
        completedRef.current.add(nodeId);
        // Notify any waiting downstream nodes
        for (const downstreamId of getDownstream(nodeId)) {
          if (waiting[downstreamId]) {
            waiting[downstreamId].forEach(fn => fn());
            waiting[downstreamId] = [];
          }
        }
        // Proactively start downstream nodes
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId);
        }
      } else {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'running' } } : n));
        try {
          // Gather all input files from all upstream nodes
          const inputFiles: File[] = [];
          for (const upstreamId of getUpstream(nodeId)) {
            const upstreamData = nodeData.get(upstreamId);
            if (upstreamData?.files) inputFiles.push(...upstreamData.files);
            else if (upstreamData?.file) inputFiles.push(upstreamData.file);
          }
          if (!inputFiles.length) throw new Error('No input files available');
          const formData = new FormData();
          formData.append('inputFile', inputFiles[0]);
          if (node.data.prompt) formData.append('prompt', node.data.prompt);
          if (node.data.useOutputTemplate && node.data.outputTemplateUrl) {
            const outputTemplate = await fetch(node.data.outputTemplateUrl).then(r => r.blob());
            formData.append('outputTemplate', new File([outputTemplate], node.data.outputTemplateName || 'output_template'));
            formData.append('useOutputTemplate', 'true');
          }
          const globalSystemPrompt = typeof window !== 'undefined' ? localStorage.getItem('globalSystemPrompt') : '';
          const response = await fetch('/api/gemini', {
            method: 'POST',
            body: formData,
            headers: globalSystemPrompt ? { 'x-global-system-prompt': globalSystemPrompt } : undefined
          });
          if (!response.ok) throw new Error('Failed to process file with Gemini');
          const result = await response.json();
          const csvFiles = result.data.map((csvData: string, index: number) => new File([csvData], `transformed_${index}.csv`, { type: 'text/csv' }));
          nodeData.set(nodeId, { files: csvFiles });
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'done' } } : n));
          for (const file of inputFiles) {
            const pdtTimestamp = getPdtTimestamp();
            const traceName = `${nodeId}-${pdtTimestamp}-${Date.now()}-input-${file.name}`;
            const inputFormData = new FormData();
            inputFormData.append('nodeId', nodeId);
            inputFormData.append('type', 'input');
            inputFormData.append('file', file, traceName);
            await fetch('/api/trace', { method: 'POST', body: inputFormData });
          }
          for (let i = 0; i < csvFiles.length; i++) {
            const outFile = csvFiles[i];
            const pdtTimestamp = getPdtTimestamp();
            const traceName = `${nodeId}-${pdtTimestamp}-${Date.now()}-output-${outFile.name}`;
            const outputFormData = new FormData();
            outputFormData.append('nodeId', nodeId);
            outputFormData.append('type', 'output');
            outputFormData.append('file', outFile, traceName);
            await fetch('/api/trace', { method: 'POST', body: outputFormData });
          }
        } catch (error) {
          console.error(`Error running node ${nodeId}:`, error);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'error' } } : n));
        }
        completedRef.current.add(nodeId);
        // Notify any waiting downstream nodes
        for (const downstreamId of getDownstream(nodeId)) {
          if (waiting[downstreamId]) {
            waiting[downstreamId].forEach(fn => fn());
            waiting[downstreamId] = [];
          }
        }
        // Proactively start downstream nodes
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId);
        }
      }
      setNodeRunHistory(history => {
        const entry = {
          timestamp: new Date().toISOString(),
          status: 'done',
          inputFile: node?.data?.uploadedFileNames?.join(','),
          outputFile: node?.data?.fileName,
        };
        return {
          ...history,
          [nodeId]: [...(history[nodeId] || []), entry],
        };
      });
    };

    // Start each root node branch independently
    await Promise.all(rootNodes.map(root => runNode(root.id)));
    setRunning(false);
  };

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange?.(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      console.log('handleEdgesChange called with changes:', changes);
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        onEdgesChange?.(changes);
        return updated;
      });
    },
    [onEdgesChange, setEdges]
  );

  const handleAddNode = useCallback(
    (newNode: Node) => {
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
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
          nodes={nodes.map(n => {
            let isHighlighted = false;
            if (n.type === 'trigger' && n.data.type === 'manual') {
              isHighlighted = n.id === currentUploadNode;
            } else {
              isHighlighted = n.data.runState === 'running';
            }
            return {
              ...n,
              selected: n.id === selectedNodeId,
              data: {
                ...n.data,
                running,
                highlighted: isHighlighted,
              },
            };
          })}
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