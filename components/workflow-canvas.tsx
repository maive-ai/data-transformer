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
import { WorkflowSidebar } from './workflow-sidebar';
import { WorkflowToolbar } from "./workflow-toolbar";
import { convertCsvToExcel } from "@/lib/utils";
import * as XLSX from "xlsx";
import { WorkflowOutputNode } from './workflow-output-node';

// Add File System Access API type declarations
declare global {
  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

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
  pipelineName?: string;
  onPipelineNameChange?: (name: string) => void;
  renderRight?: React.ReactNode;
}

// Helper to slugify node label for filenames
function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Helper to get readable timestamp
function getReadableTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
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
  pipelineName = "New Pipeline",
  onPipelineNameChange,
  renderRight,
}: WorkflowCanvasProps, ref) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [nodeRunHistory, setNodeRunHistory] = useState<Record<string, Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>>>({});
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [currentUploadNode, setCurrentUploadNode] = useState<string | null>(null);
  const [localPipelineName, setLocalPipelineName] = useState(pipelineName);
  const completedRef = useRef(new Set<string>());
  // Add a ref to store the resolver for the file upload promise
  const fileUploadResolver = useRef<((files: File[]) => void) | null>(null);

  // Update local name when prop changes
  useEffect(() => {
    setLocalPipelineName(pipelineName);
  }, [pipelineName]);

  // Handle pipeline name changes
  const handlePipelineNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalPipelineName(newName);
    onPipelineNameChange?.(newName);
  };

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
    // Reset all nodes to idle state at the start of each run
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: {
          ...n.data,
          runState: 'idle',
        },
      }))
    );
    setRunning(true);
    // Find root nodes (no incoming edges), sorted by y position
    const rootNodes = [...nodes.filter(n => !edges.some(e => e.target === n.id))].sort((a, b) => a.position.y - b.position.y);
    // Only consider file upload root nodes (manual triggers)
    const fileUploadRoots = rootNodes.filter(n => n.type === 'trigger' && n.data.type === 'manual');
    const otherRoots = rootNodes.filter(n => !(n.type === 'trigger' && n.data.type === 'manual'));
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
        setNodes(nds => nds.map(n =>
          n.type === 'trigger' && n.data.type === 'manual'
            ? { ...n, data: { ...n.data, runState: n.id === nodeId ? 'prompt' : (n.data.runState === 'done' ? 'done' : 'idle') } }
            : n
        ));
        setCurrentUploadNode(nodeId);
        setShowFileUpload(true);
        try {
          // Wait for the user to upload a file via the modal
          const files = await new Promise<File[]>((resolve, reject) => {
            fileUploadResolver.current = resolve;
          });
          nodeData.set(nodeId, { files });
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'done', uploadedFileNames: files.map(f => f.name) } } : n));
          setCurrentUploadNode(null);
          setShowFileUpload(false);
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const labelSlug = slugify(node.data.label || nodeId);
            const timestamp = getReadableTimestamp();
            const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
            const ext = file.name.split('.').pop() || 'dat';
            const traceName = `${labelSlug}-${timestamp}-${i + 1}-${uuid}.${ext}`;
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
        } catch (error) {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'error' } } : n));
          setCurrentUploadNode(null);
          setShowFileUpload(false);
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

          // Log each input CSV as a trace
          for (let i = 0; i < inputFiles.length; i++) {
            const file = inputFiles[i];
            if (file.type === 'text/csv') {
              const labelSlug = slugify(node.data.label || nodeId);
              const timestamp = getReadableTimestamp();
              const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
              const ext = file.name.split('.').pop() || 'csv';
              const traceName = `${labelSlug}-input-${timestamp}-${i + 1}-${uuid}.${ext}`;
              const inputFormData = new FormData();
              inputFormData.append('nodeId', nodeId);
              inputFormData.append('type', 'input');
              inputFormData.append('file', file, traceName);
              await fetch('/api/trace', { method: 'POST', body: inputFormData });
            }
          }

          // Merge all input CSVs into a single multi-sheet XLSX file
          const wb = XLSX.utils.book_new();
          let sheetCount = 1;
          const sheetNamesFromNode = Array.isArray(node.data.sheetNames) ? node.data.sheetNames : [];
          for (let i = 0; i < inputFiles.length; i++) {
            const file = inputFiles[i];
            if (file.type === 'text/csv') {
              const csvContent = await file.text();
              const rows = csvContent.split('\n').map(row => row.split(','));
              const headers = rows[0];
              const data = rows.slice(1).map(row => {
                const obj: Record<string, any> = {};
                headers.forEach((header, index) => {
                  const value = row[index] || '';
                  // Try to convert to number if possible
                  const numValue = Number(value);
                  obj[header] = !isNaN(numValue) && value.trim() !== '' ? numValue : value;
                });
                return obj;
              });
              const ws = XLSX.utils.json_to_sheet(data, { cellDates: true });
              // Sheet name: use user-specified name, fallback to SheetN, ensure uniqueness
              let baseSheetName = (sheetNamesFromNode[i] || '').trim() || `Sheet${sheetCount}`;
              let sheetName = baseSheetName;
              let suffix = 1;
              while (wb.SheetNames.includes(sheetName)) {
                sheetName = `${baseSheetName}_${suffix}`;
                suffix++;
              }
              XLSX.utils.book_append_sheet(wb, ws, sheetName);
              sheetCount++;
            }
          }
          // Generate single Excel file
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const mergedExcelFile = new File([excelBuffer], 'merged_output.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          // Store the file data without triggering download
          nodeData.set(nodeId, { files: [mergedExcelFile] });
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: 'done',
              fileUrl: URL.createObjectURL(mergedExcelFile),
              outputFileName: node.data.fileName || mergedExcelFile.name,
            },
          } : n));

          // Log trace for the single merged Excel file
          const labelSlug = slugify(node.data.label || nodeId);
          const timestamp = getReadableTimestamp();
          const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
          const traceName = `${labelSlug}-output-${timestamp}-1-${uuid}.xlsx`;
          const outputFormData = new FormData();
          outputFormData.append('nodeId', nodeId);
          outputFormData.append('type', 'output');
          outputFormData.append('file', mergedExcelFile, traceName);
          await fetch('/api/trace', { method: 'POST', body: outputFormData });

          // Log the conversion in run history
          setNodeRunHistory(history => {
            const entry = {
              timestamp: new Date().toISOString(),
              status: 'done',
              inputFile: inputFiles.map(f => f.name).join(','),
              outputFile: mergedExcelFile.name,
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
          // Always send outputType so backend can short-circuit for markdown
          formData.append('outputType', node.data.ioConfig?.outputType?.type || '');
          const globalSystemPrompt = typeof window !== 'undefined' ? localStorage.getItem('globalSystemPrompt') : '';
          const response = await fetch('/api/gemini', {
            method: 'POST',
            body: formData,
            headers: globalSystemPrompt ? { 'x-global-system-prompt': globalSystemPrompt } : undefined
          });
          if (!response.ok) throw new Error('Failed to process file with Gemini');
          const result = await response.json();
          let csvFiles = [];
          // If output type is json, create a downloadable file from the result (including hardcoded JSON)
          if (node.data.ioConfig?.outputType?.type === 'json' && result.data && result.data.length > 0) {
            const jsonData = result.data.length === 1 ? result.data[0] : result.data;
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            const fileUrl = URL.createObjectURL(blob);
            setNodes(nds => nds.map(n => n.id === nodeId ? {
              ...n,
              data: {
                ...n.data,
                runState: 'done',
                fileUrl,
                outputFileName: 'P-650-WTH-BKM.json',
              }
            } : n));
          } else {
            csvFiles = result.data.map((csvData: string, index: number) => new File([csvData], `transformed_${index}.csv`, { type: 'text/csv' }));
            nodeData.set(nodeId, { files: csvFiles });
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'done' } } : n));
          }
          // Always mark node as completed and trigger downstream nodes after output is set
          completedRef.current.add(nodeId);
          for (const downstreamId of getDownstream(nodeId)) {
            runNode(downstreamId);
          }
        } catch (error) {
          console.error(`Error running node ${nodeId}:`, error);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: 'error' } } : n));
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
      }
    };

    // Sequentially prompt for file upload roots in y order, but do not await downstreams
    for (let i = 0; i < fileUploadRoots.length; i++) {
      await runNode(fileUploadRoots[i].id);
    }
    // After all file upload roots, start any other root nodes (if any)
    await Promise.all(otherRoots.map(root => runNode(root.id)));
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

  const stopPipeline = useCallback(() => {
    setRunning(false);
    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        runState: 'idle',
      },
    })));
    setCurrentUploadNode(null);
    // Optionally clear other state if needed
  }, [setNodes]);

  useImperativeHandle(ref, () => ({
    runPipeline,
    running,
    stopPipeline,
  }));

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Top bar: pipeline name, toolbar, play/stop button, absolutely positioned */}
      <div className="absolute left-0 right-0 top-6 z-40 flex flex-row items-center justify-between px-8 pointer-events-none">
        {/* Pipeline name input, left */}
        <div className="pointer-events-auto">
          <input
            type="text"
            value={localPipelineName}
            onChange={handlePipelineNameChange}
            className="text-xl font-semibold bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden text-ellipsis whitespace-nowrap"
            placeholder="Enter pipeline name"
            style={{ minWidth: 280, maxWidth: 520 }}
          />
        </div>
        {/* Toolbar, center */}
        <div className="flex-1 flex justify-center pointer-events-auto">
          <WorkflowToolbar onAddNode={handleAddNode} />
        </div>
        {/* Play/Stop button or placeholder, right */}
        <div className="pointer-events-auto">{renderRight ?? <div style={{ width: 48 }} />}</div>
      </div>
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
            nodes={nodes}
            edges={edges}
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
                accept=".csv,.xlsx,.json,.xml,.pdf,.doc,.docx,.mp4,video/mp4"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    if (fileUploadResolver.current) {
                      fileUploadResolver.current(Array.from(e.target.files));
                      fileUploadResolver.current = null;
                    }
                    e.target.value = '';
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