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
  StepEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { WorkflowNode } from './workflow-node';
import { WorkflowTriggerNode } from './workflow-trigger-node';
import { WorkflowSidebar } from './workflow-sidebar';
import { WorkflowToolbar } from "./workflow-toolbar";
import { convertCsvToExcel } from "@/lib/utils";
import * as XLSX from "xlsx";
import { WorkflowOutputNode } from './workflow-output-node';
import { WorkflowHttpTriggerNode } from './workflow-http-trigger-node';
import { WorkflowHttpResponseNode } from './workflow-http-response-node';
import { WorkflowAiOperatorNode } from './workflow-ai-operator-node';
import { WorkflowLoopNode } from './workflow-loop-node';
import { WorkflowErpNode } from './workflow-erp-node';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { NodeType, RunState, FileType, MimeType, OutputSubType, TriggerSubType, ErpAction, IntegrationSubType, NodeLabel, EdgeType } from "@/types/enums";
import { WorkflowIntegrationNode } from './workflow-integration-node';
import CurvedFeedbackEdge from './workflow-curved-edge';

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
  httpTrigger: WorkflowHttpTriggerNode,
  httpResponse: WorkflowHttpResponseNode,
  aiOperator: WorkflowAiOperatorNode,
  loop: WorkflowLoopNode,
  erpLookup: WorkflowErpNode,
  integration: WorkflowIntegrationNode,
};

const edgeTypes = {
  [EdgeType.STEP]: StepEdge,
  [EdgeType.FEEDBACK]: CurvedFeedbackEdge,
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

// Helper to log node output as a trace file
async function logNodeTrace(nodeId: string, node: Node, output: File | object | undefined, labelOverride?: string) {
  try {
    if (!output) return;
    let file: File;
    let ext = 'txt';
    if (output instanceof File) {
      file = output;
      ext = file.name.split('.').pop() || 'txt';
    } else if (typeof output === 'object') {
      // JSON output
      const jsonString = JSON.stringify(output, null, 2);
      file = new File([jsonString], 'output.json', { type: 'application/json' });
      ext = 'json';
    } else {
      return;
    }
    const labelSlug = slugify(labelOverride || node.data.label || nodeId);
    const timestamp = getReadableTimestamp();
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
    const traceName = `${labelSlug}-output-${timestamp}-${uuid}.${ext}`;
    const outputFormData = new FormData();
    outputFormData.append('nodeId', nodeId);
    outputFormData.append('type', 'output');
    outputFormData.append('file', file, traceName);
    await fetch('/api/trace', { method: 'POST', body: outputFormData });
  } catch (traceErr) {
    console.error('Trace logging error:', traceErr);
  }
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
  // Dedicated accumulator for CSV template mode
  const csvTemplateAccumulators: Map<string, { csv: string }> = new Map();

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
      
      // Check if this is a feedback connection (CSV Append to Loop)
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      let edgeType = EdgeType.STEP;
      let targetHandle = params.targetHandle;
      
      if (sourceNode?.data.label === NodeLabel.CSV_APPEND && 
          targetNode?.type === NodeType.LOOP) {
        edgeType = EdgeType.FEEDBACK;
        targetHandle = 'bottom'; // Force connection to bottom handle
        params = { ...params, sourceHandle: 'bottom' } as Connection;
      }
      
      const newEdge = {
        ...params,
        type: edgeType,
        targetHandle,
        id: `${params.source}-${params.target}`,
        sourceHandle: params.sourceHandle,
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, validateConnection, nodes]
  );

  // Run pipeline animation logic
  const runPipeline = async () => {
    // Reset all nodes to idle state at the start of each run
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: {
          ...n.data,
          runState: RunState.IDLE,
        },
      }))
    );
    setRunning(true);
    // Find root nodes (no incoming edges), sorted by y position
    const rootNodes = [...nodes.filter(n => !edges.some(e => e.target === n.id))].sort((a, b) => a.position.y - b.position.y);
    // Only consider file upload root nodes (manual triggers)
    const fileUploadRoots = rootNodes.filter(n => n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL);
    const otherRoots = rootNodes.filter(n => !(n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL));
    // Track node completion and outputs
    const nodeData: Map<string, {
      file?: File;
      inputFile?: string;
      outputFile?: string;
      fileUrl?: string;
      files?: File[];
      uploadedFileNames?: string[];
      row?: Record<string, any>;
      rows?: Record<string, any>[];
      headers?: string[];
    }> = new Map();
    completedRef.current = new Set();
    const waiting: Record<string, (() => void)[]> = {};

    // Helper: get all downstream nodes
    const getDownstream = (nodeId: string) => edges.filter(e => e.source === nodeId).map(e => e.target);
    // Helper: get all upstream nodes (ignore feedback edges)
    const getUpstream = (nodeId: string) => {
      // For loop nodes, only consider regular step edges as dependencies
      // Feedback edges are handled separately in the loop execution logic
      if (nodes.find(n => n.id === nodeId)?.type === NodeType.LOOP) {
        return edges
          .filter(e => e.target === nodeId && e.type === EdgeType.STEP)
          .map(e => e.source);
      }
      // For all other nodes, consider all edges except feedback edges
      return edges
        .filter(e => e.target === nodeId && (e.type === undefined || e.type === EdgeType.STEP))
        .map(e => e.source);
    };

    // Helper function to run a node if all its dependencies are satisfied
    const runNode = async (nodeId: string, contextKey?: string) => {
      const node = nodes.find(n => n.id === nodeId);
      const key = contextKey ? `${nodeId}_${contextKey}` : nodeId;
      console.log(`[runNode] Attempting to run nodeId: ${nodeId}, type: ${node?.type}, contextKey: ${contextKey}`);
      console.log('[runNode] Full node object:', node);
      if (!node || completedRef.current.has(key)) return;
      // Check if all upstream nodes are completed (use contextKey for feedback loop)
      const upstream = getUpstream(nodeId);
      const upstreamKeys = upstream.map(upId => contextKey ? `${upId}_${contextKey}` : upId);
      console.log(`[runNode] Upstream for nodeId ${nodeId}:`, upstream, 'Completed:', Array.from(completedRef.current), 'ContextKey:', contextKey);
      if (upstreamKeys.some(id => !completedRef.current.has(id))) {
        console.log(`[runNode] Waiting for upstream dependencies for nodeId: ${nodeId}, contextKey: ${contextKey}`);
        if (!waiting[key]) waiting[key] = [];
        await new Promise<void>(resolve => waiting[key].push(resolve));
        // After dependencies are done, re-run
        return runNode(nodeId, contextKey);
      }
      console.log(`[runNode] All upstream dependencies satisfied for nodeId: ${nodeId}, contextKey: ${contextKey}`);
      // Short-circuit for markdown output type: create a dummy markdown file and pass it downstream, skipping Gemini/model call
      if (node.data.ioConfig?.outputType?.type === FileType.MARKDOWN) {
        // Sleep for 7 seconds before outputting the dummy markdown file
        await new Promise(resolve => setTimeout(resolve, 7000));
        const mdFile = new File([''], 'output.md', { type: 'text/markdown' });
        nodeData.set(key, { files: [mdFile] });
        setNodes(nds => nds.map(n => n.id === nodeId ? {
          ...n,
          data: {
            ...n.data,
            runState: RunState.DONE,
            fileUrl: URL.createObjectURL(mdFile),
            outputFileName: 'output.md',
          }
        } : n));
        completedRef.current.add(key);
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId, contextKey);
        }
        return;
      }

      // Short-circuit for Doc Export node: always output the hardcoded DOCX file, skip Gemini/model call
      if (node.type === NodeType.OUTPUT && node.data.type === OutputSubType.DOC) {
        setNodes(nds => nds.map(n => n.id === nodeId ? {
          ...n,
          data: {
            ...n.data,
            runState: RunState.DONE,
            fileUrl: '/static/Standard Operating Procedure_ Toothbrush Holder Assembly.docx',
            outputFileName: 'Standard Operating Procedure_ Toothbrush Holder Assembly.docx',
          }
        } : n));
        completedRef.current.add(key);
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId, contextKey);
        }
        return;
      }

      // MOCKED HTTP TRIGGER/RESPONSE FLOW
      if (node.type === NodeType.HTTP_TRIGGER) {
        try {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          await new Promise(res => setTimeout(res, 800)); // Simulate network delay
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE } } : n));
          completedRef.current.add(key);
          // Trigger downstream nodes AFTER marking as done
          for (const downstreamId of getDownstream(nodeId)) {
            await runNode(downstreamId, contextKey);
          }
        } catch (err) {
          console.error('Error in HTTP Trigger node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      }
      if (node.type === NodeType.HTTP_RESPONSE) {
        try {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          await new Promise(res => setTimeout(res, 800)); // Simulate processing delay
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE, responseValue: 81.72, responseStatus: 200 } } : n));
          completedRef.current.add(key);
        } catch (err) {
          console.error('Error in HTTP Response node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      }
      if (node.type === NodeType.TRIGGER && node.data.type === TriggerSubType.MANUAL) {
        // Set node to PROMPT (waiting for upload)
        setNodes(nds => nds.map(n =>
          n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL
            ? { ...n, data: { ...n.data, runState: n.id === nodeId ? RunState.PROMPT : (n.data.runState === RunState.DONE ? RunState.DONE : RunState.IDLE) } }
            : n
        ));
        setCurrentUploadNode(nodeId);
        setShowFileUpload(true);

        // Wait for file upload to complete
        const uploadedFiles = await new Promise<File[]>((resolve) => {
          fileUploadResolver.current = resolve;
        });

        // Clean up modal immediately after upload
        setShowFileUpload(false);
        setCurrentUploadNode(null);

        // Process the uploaded files
        if (uploadedFiles && uploadedFiles.length > 0) {
          const file = uploadedFiles[0]; // Take first file for now
          nodeData.set(key, { file });

          // Set node to RUNNING while processing
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.RUNNING,
              file,
              uploadedFileNames: uploadedFiles.map(f => f.name),
            }
          } : n));

          // Now mark as DONE
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.DONE,
            }
          } : n));

          // Mark as completed and trigger downstream nodes
          completedRef.current.add(key);
          for (const downstreamId of getDownstream(nodeId)) {
            await runNode(downstreamId, contextKey);
          }
        } else {
          // Handle case where no files were uploaded
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: { ...n.data, runState: RunState.ERROR }
          } : n));
        }
        return;
      } else if (node.type === NodeType.OUTPUT && node.data.type === OutputSubType.EXCEL) {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
        try {
          // Gather all input files from upstream nodes
          const inputFiles: File[] = [];
          for (const upstreamId of getUpstream(nodeId)) {
            const upstreamData = nodeData.get(upstreamId);
            if (upstreamData?.files) inputFiles.push(...upstreamData.files);
            else if (upstreamData?.file) inputFiles.push(upstreamData.file);
          }
          if (!inputFiles.length) throw new Error('No input files available');

          // Merge all input CSVs into a single multi-sheet XLSX file
          const wb = XLSX.utils.book_new();
          let sheetCount = 1;
          const sheetNamesFromNode = Array.isArray(node.data.sheetNames) ? node.data.sheetNames : [];
          for (let i = 0; i < inputFiles.length; i++) {
            const file = inputFiles[i];
            if (file.type === MimeType.TEXT_CSV) {
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
          nodeData.set(key, { files: [mergedExcelFile] });
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.DONE,
              fileUrl: URL.createObjectURL(mergedExcelFile),
              outputFileName: node.data.fileName || mergedExcelFile.name,
            },
          } : n));

          // Log output trace for ERP node
          await logNodeTrace(nodeId, node, mergedExcelFile, node.data.label || nodeId);

        } catch (error) {
          console.error(`Error running Excel export node ${nodeId}:`, error);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        completedRef.current.add(key);
        // Notify any waiting downstream nodes
        for (const downstreamId of getDownstream(nodeId)) {
          if (waiting[downstreamId]) {
            waiting[downstreamId].forEach(fn => fn());
            waiting[downstreamId] = [];
          }
        }
        // Proactively start downstream nodes
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId, contextKey);
        }
      } else if (node.type === NodeType.AI_OPERATOR) {
        try {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          // Do not mark as done here; let the sidebar video onEnded handler do it
          // Do not call any backend or set a timeout
        } catch (err) {
          console.error('Error in AI Operator node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else if (node.type === NodeType.ERP_LOOKUP || (node.type === NodeType.ACTION && node.data.label === 'ERP') || (node.type === NodeType.INTEGRATION && node.data.integrationType === IntegrationSubType.ERP)) {
        try {
          // Simulate running for 3 seconds if triggered by loop
          const loopNodeId = getUpstream(nodeId)[0];
          if (nodes.find(n => n.id === loopNodeId)?.type === NodeType.LOOP) {
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
            const csvAppendNodeId = getDownstream(nodeId)[0];
            setNodes(nds => nds.map(n => n.id === csvAppendNodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
            await new Promise(res => setTimeout(res, 3000));
          } else {
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          }

          // Get input CSV file
          const upstreamId = getUpstream(nodeId)[0];
          const upstreamData = nodeData.get(upstreamId);
          if (!upstreamData?.file) throw new Error('No input file available');
          const inputText = await upstreamData.file.text();
          const lines = inputText.split('\n').filter((line: string) => line.trim());
          if (lines.length < 2) throw new Error('CSV must have at least one data row');
          const header = lines[0];
          const dataLines = lines.slice(1);

          // Add a 'status' column with the ratio of assigned statuses to total rows
          const totalRows = dataLines.length;
          const statusCount = totalRows; // For simulation, all rows get a status
          const newHeader = header.includes('status') ? header : header + ',status';
          const newRows = dataLines.map((row, idx) => row + `,Status: ${statusCount}/${totalRows}`);
          const csvContent = [newHeader, ...newRows].join('\n');
          const outputFile = new File([csvContent], `erp-bom-lookup.csv`, { type: 'text/csv' });
          nodeData.set(nodeId, { file: outputFile });

          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE, file: outputFile } } : n));
          completedRef.current.add(nodeId);

          // Trigger CSV Append node
          const csvAppendNodeId = getDownstream(nodeId)[0];
          await runNode(csvAppendNodeId);
        } catch (err) {
          console.error('Error in ERP node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else if (node.type === NodeType.LOOP) {
        try {
          // Simulate all three nodes running for 3 seconds
          const erpNodeId = getDownstream(nodeId)[0];
          const csvAppendNodeId = getDownstream(erpNodeId)[0];

          setNodes(nds => nds.map(n =>
            n.id === nodeId || n.id === erpNodeId || n.id === csvAppendNodeId
              ? { ...n, data: { ...n.data, runState: RunState.RUNNING } }
              : n
          ));

          // Wait 3 seconds
          await new Promise(res => setTimeout(res, 3000));

          // Pass the upstream CSV file to the ERP node
          const upstreamId = getUpstream(nodeId)[0];
          const upstreamData = nodeData.get(upstreamId);
          if (!upstreamData?.file) throw new Error('No input file available');

          // ERP BOM Lookup: add status column
          const inputText = await upstreamData.file.text();
          const lines = inputText.split('\n').filter((line: string) => line.trim());
          if (lines.length < 2) throw new Error('CSV must have at least one data row');
          const header = lines[0];
          const dataLines = lines.slice(1);
          const totalRows = dataLines.length;
          const statusCount = totalRows;
          const newHeader = header.includes('status') ? header : header + ',status';
          const newRows = dataLines.map((row, idx) => row + `,Status: ${statusCount}/${totalRows}`);
          const erpCsvContent = [newHeader, ...newRows].join('\n');
          const erpOutputFile = new File([erpCsvContent], `erp-bom-lookup.csv`, { type: 'text/csv' });

          // CSV Append: just pass through
          const csvAppendOutputFile = erpOutputFile;

          // Set all three nodes to DONE and update their files
          setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
              return { ...n, data: { ...n.data, runState: RunState.DONE } };
            } else if (n.id === erpNodeId) {
              return { ...n, data: { ...n.data, runState: RunState.DONE, file: erpOutputFile } };
            } else if (n.id === csvAppendNodeId) {
              return { ...n, data: { ...n.data, runState: RunState.DONE, file: csvAppendOutputFile } };
            }
            return n;
          }));

          nodeData.set(nodeId, { file: upstreamData.file });
          nodeData.set(erpNodeId, { file: erpOutputFile });
          nodeData.set(csvAppendNodeId, { file: csvAppendOutputFile });
          completedRef.current.add(nodeId);
          completedRef.current.add(erpNodeId);
          completedRef.current.add(csvAppendNodeId);

          // Trigger downstream node (ERP BOM Generation)
          const downstreamId = getDownstream(csvAppendNodeId)[0];
          if (downstreamId) {
            await runNode(downstreamId);
          }
        } catch (err) {
          console.error('[Loop Node] Error in Loop node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else if (node.type === NodeType.ACTION && node.data.label === NodeLabel.CSV_APPEND) {
        try {
          // Simulate running for 3 seconds if triggered by ERP node in loop
          const erpNodeId = getUpstream(nodeId)[0];
          if (nodes.find(n => n.id === erpNodeId)?.type === NodeType.ERP_LOOKUP) {
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
            await new Promise(res => setTimeout(res, 3000));
          } else {
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          }

          // Pass the CSV file through to the next node
          const upstreamId = getUpstream(nodeId)[0];
          const upstreamData = nodeData.get(upstreamId);
          if (!upstreamData?.file) throw new Error('No input file available');
          nodeData.set(nodeId, { file: upstreamData.file });

          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE, file: upstreamData.file } } : n));
          completedRef.current.add(nodeId);

          // Trigger downstream node (ERP BOM Generation)
          const downstreamId = getDownstream(nodeId)[0];
          await runNode(downstreamId);
        } catch (err) {
          console.error('Error in CSV Append node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
        try {
          // Gather all input files from all upstream nodes
          const inputFiles: File[] = [];
          for (const upstreamId of getUpstream(nodeId)) {
            const upstreamData = nodeData.get(upstreamId);
            if (upstreamData?.files) inputFiles.push(...upstreamData.files);
            else if (upstreamData?.file) inputFiles.push(upstreamData.file);
          }
          if (!inputFiles.length && node.type !== NodeType.AI_OPERATOR) throw new Error('No input files available');
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
          
          // Fetch system prompt from API
          const systemPromptResponse = await fetch('/api/pipelines/system-prompt');
          const { systemPrompt: globalSystemPrompt } = await systemPromptResponse.json();
          
          // Sanitize system prompt to ensure header value contains no newline or invalid characters
          const headers: Record<string, string> | undefined = globalSystemPrompt && globalSystemPrompt.length > 0
            ? { 'x-global-system-prompt': encodeURIComponent(globalSystemPrompt) }
            : undefined;

          const response = await fetch('/api/gemini', {
            method: 'POST',
            body: formData,
            headers,
          });
          if (!response.ok) throw new Error('Failed to process file with Gemini');
          const result = await response.json();
          let csvFiles = [];
          // If output type is json, create a downloadable file from the result (including hardcoded JSON)
          if (node.data.ioConfig?.outputType?.type === FileType.JSON && result.data && result.data.length > 0) {
            const jsonData = result.data.length === 1 ? result.data[0] : result.data;
            // Short-circuit for hardcoded JSON output when input is MP4
            if (node.data.ioConfig?.inputTypes?.some((t: any) => t.type === FileType.MP4)) {
              // Sleep for 30 seconds before outputting the hardcoded JSON
              await new Promise(resolve => setTimeout(resolve, 30000));
              const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
              const fileUrl = URL.createObjectURL(blob);
              const jsonFile = new File([JSON.stringify(jsonData, null, 2)], 'P-650-WTH-BKM.json', { type: 'application/json' });
              nodeData.set(nodeId, { files: [jsonFile] });
              setNodes(nds => nds.map(n => n.id === nodeId ? {
                ...n,
                data: {
                  ...n.data,
                  runState: RunState.DONE,
                  fileUrl,
                  outputFileName: 'P-650-WTH-BKM.json',
                }
              } : n));
              completedRef.current.add(nodeId);
              for (const downstreamId of getDownstream(nodeId)) {
                runNode(downstreamId, contextKey);
              }
              return;
            }
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            const fileUrl = URL.createObjectURL(blob);
            const jsonFile = new File([JSON.stringify(jsonData, null, 2)], 'P-650-WTH-BKM.json', { type: 'application/json' });
            nodeData.set(nodeId, { files: [jsonFile] });
            setNodes(nds => nds.map(n => n.id === nodeId ? {
              ...n,
              data: {
                ...n.data,
                runState: RunState.DONE,
                fileUrl,
                outputFileName: 'P-650-WTH-BKM.json',
              }
            } : n));
          } else {
            csvFiles = result.data.map((csvData: string, index: number) => new File([csvData], `transformed_${index}.csv`, { type: 'text/csv' }));
            // Always pass only the first CSV file as 'file' (not 'files')
            if (csvFiles.length > 0) {
              nodeData.set(nodeId, { file: csvFiles[0] });
            } else {
              nodeData.set(nodeId, {});
            }
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE } } : n));
          }
          // Always mark node as completed and trigger downstream nodes after output is set
          completedRef.current.add(nodeId);
          for (const downstreamId of getDownstream(nodeId)) {
            runNode(downstreamId, contextKey);
          }
        } catch (error) {
          console.error(`Error running node ${nodeId}:`, error);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        setNodeRunHistory(history => {
          const entry = {
            timestamp: new Date().toISOString(),
            status: RunState.DONE,
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

    // Helper function to handle feedback loops (Loop -> ERP -> CSV Append -> Loop)
    async function handleFeedbackLoop(
      loopNodeId: string, 
      nodeData: Map<string, any>, 
      getUpstream: (id: string) => string[], 
      getDownstream: (id: string) => string[], 
      runNode: (id: string, contextKey?: string) => Promise<void>
    ) {
      console.log('[Loop Node] Starting execution for nodeId:', loopNodeId);
      const loopNode = nodes.find(n => n.id === loopNodeId);
      if (!loopNode) return;
      
      // --- 1. Identify nodes and data within the loop ---
      const triggerNodeId = getUpstream(loopNodeId)[0];
      const initialData = nodeData.get(triggerNodeId);
      if (!initialData?.file) throw new Error('No trigger data available for loop node');
      
      const erpNodeId = getDownstream(loopNodeId)[0];
      const erpNode = nodes.find(n => n.id === erpNodeId);
      if (!erpNode) throw new Error("Could not find ERP node in loop");

      const csvAppendNodeId = getDownstream(erpNodeId)[0];
      const csvAppendNode = nodes.find(n => n.id === csvAppendNodeId);
      if (!csvAppendNode) throw new Error("Could not find CSV Append node in loop");

      // --- 2. Parse input CSV into header and data rows ---
      const inputText = await initialData.file.text();
      const lines = inputText.split('\n').filter((line: string) => line.trim());
      if (lines.length < 2) throw new Error('CSV must have at least one data row');
      const header = lines[0];
      const dataLines = lines.slice(1);
      const headers = header.split(',').map(h => h.trim());

      // --- 3. Row-by-row processing ---
      const accumulatedRows: Record<string, any>[] = [];
      for (let i = 0; i < dataLines.length; i++) {
        console.log(`[Loop Node] Processing row ${i + 1} of ${dataLines.length}`);
        // Convert CSV row to JSON object
        const values = dataLines[i].split(',');
        const rowObj: Record<string, any> = {};
        headers.forEach((h: string, idx: number) => {
          rowObj[h] = values[idx] ?? '';
        });

        // --- ERP Node: enrich the row ---
        setNodes(nds => nds.map(n => n.id === erpNodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
        // Modify ERP logic to accept a single row
        const erpResult = await executeErpNodeLogicSingleRow(erpNode, rowObj, headers);
        setNodes(nds => nds.map(n => n.id === erpNodeId ? { ...n, data: { ...n.data, runState: RunState.DONE } } : n));

        // --- CSV Append Node: accumulate the enriched row ---
        setNodes(nds => nds.map(n => n.id === csvAppendNodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
        accumulatedRows.push(erpResult);
        setNodes(nds => nds.map(n => n.id === csvAppendNodeId ? { ...n, data: { ...n.data, runState: RunState.DONE } } : n));
        // Feedback edge: next iteration
      }

      // --- 4. Finalize Loop: output the final CSV ---
      // Use headers from the first enriched row if available, else original headers
      const finalHeaders = accumulatedRows.length > 0 ? Object.keys(accumulatedRows[0]) : headers;
      const csvContent = [
        finalHeaders.join(','),
        ...accumulatedRows.map((row: Record<string, any>) => finalHeaders.map((h: string) => row[h] ?? '').join(','))
      ].join('\n');
      const finalOutputFile = new File([csvContent], 'loop_output.csv', { type: 'text/csv' });

      // Store final aggregated data on loop node
      nodeData.set(loopNodeId, { file: finalOutputFile, rows: accumulatedRows, headers: finalHeaders });
      nodeData.set(erpNodeId, { file: finalOutputFile, rows: accumulatedRows, headers: finalHeaders });
      nodeData.set(csvAppendNodeId, { file: finalOutputFile, rows: accumulatedRows, headers: finalHeaders });

      // Log traces for all nodes in the loop
      await logNodeTrace(loopNodeId, loopNode, finalOutputFile, loopNode.data.label || loopNodeId);
      await logNodeTrace(erpNodeId, erpNode, finalOutputFile, erpNode.data.label || erpNodeId);
      await logNodeTrace(csvAppendNodeId, csvAppendNode, finalOutputFile, csvAppendNode.data.label || csvAppendNodeId);

      completedRef.current.add(loopNodeId);
      completedRef.current.add(erpNodeId);
      completedRef.current.add(csvAppendNodeId);
      console.log('[Loop Node] Completed all row-by-row iterations');

      // --- 5. Run nodes downstream of the loop ---
      const nodesAfterLoop = getDownstream(loopNodeId).filter(downstreamId => 
        !edges.some(e => e.source === downstreamId && e.target === loopNodeId && e.type === EdgeType.FEEDBACK)
      );
      for (const nodeId of nodesAfterLoop) {
        await runNode(nodeId);
      }
    }

    // Helper: ERP node logic for a single row
    async function executeErpNodeLogicSingleRow(node: Node, row: Record<string, any>, headers: string[]): Promise<Record<string, any>> {
      // Use the same logic as executeErpNodeLogic, but for a single row
      const erpAction = node.data.erpAction || ErpAction.BOM_LOOKUP;
      const useMockData = node.data.useMockData !== false;
      const mockDistribution = node.data.mockDistribution || { directMatch: 80, substitution: 10, notFound: 10 };
      // Map row fields to expected ERP fields
      let result: Record<string, any> = {};
      if (erpAction === ErpAction.BOM_LOOKUP) {
        const refDes = row['Reference Designators'] || row['refDes'] || row['RefDes'] || '';
        const mpn = row['Manufacturer Part Number'] || row['mpn'] || '';
        const manufacturer = row['Manufacturer'] || '';
        const quantity = row['Quantity'] || '';
        const description = row['Description'] || '';
        const package_ = row['Package'] || '';
        let status = 'Direct Match';
        let substitution = undefined;
        if (useMockData) {
          const rand = Math.random() * 100;
          if (rand < mockDistribution.directMatch) {
            status = 'Direct Match';
          } else if (rand < mockDistribution.directMatch + mockDistribution.substitution) {
            status = 'Substitution Found';
            substitution = `${mpn}-ALT`;
          } else {
            status = 'Not Found in ERP';
          }
        } else {
          status = 'Mock Data Disabled';
        }
        result = {
          'Manufacturer Part Number': mpn,
          'Description': description,
          'Manufacturer': manufacturer,
          'Quantity': quantity,
          'Reference Designators': refDes,
          'Package': package_,
          'Status': status,
          'Substitution': substitution || ''
        };
      } else {
        // For other ERP actions, just return the row as-is (or extend as needed)
        result = { ...row, Status: 'Processed' };
      }
      return result;
    }

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

  // Remove keyboard shortcut effect
  const stopPipeline = useCallback(() => {
    setRunning(false);
    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        runState: RunState.IDLE,
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
            if (n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL) {
              isHighlighted = n.id === currentUploadNode;
            } else if (n.data.runState === RunState.RUNNING) {
              isHighlighted = true;
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
          edgeTypes={edgeTypes}
          fitView
          onNodeClick={handleNodeClick}
          onPaneClick={handleSidebarClose}
          defaultEdgeOptions={{ type: 'step', style: { strokeWidth: 2, stroke: '#222' } }}
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
                accept=".csv,.xlsx,.json,.xml,.pdf,.doc,.docx,.mp4,video/mp4,.txt"
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