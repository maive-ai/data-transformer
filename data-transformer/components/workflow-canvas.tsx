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
import { WorkflowManualUploadNode } from './workflow-manual-upload-node';
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
import { NodeType, RunState, FileType, MimeType, OutputSubType, TriggerSubType, ErpAction, IntegrationSubType, NodeLabel } from "@/types/enums";
import { WorkflowIntegrationNode } from './workflow-integration-node';
import CurvedFeedbackEdge from './workflow-curved-edge';
import { WorkflowOneToManyNode } from './workflow-one-to-many-node';
import { WorkflowAiWebSearchNode } from './workflow-ai-web-search-node';
import { WorkflowAiAnalysisNode } from "./workflow-ai-analysis-node";

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
  manualUpload: WorkflowManualUploadNode,
  action: WorkflowNode,
  output: WorkflowOutputNode,
  httpTrigger: WorkflowHttpTriggerNode,
  httpResponse: WorkflowHttpResponseNode,
  aiOperator: WorkflowAiOperatorNode,
  loop: WorkflowLoopNode,
  erpLookup: WorkflowErpNode,
  integration: WorkflowIntegrationNode,
  one_to_many: WorkflowOneToManyNode,
  ai_web_search: WorkflowAiWebSearchNode,
  aiAnalysis: WorkflowAiAnalysisNode,
};

const edgeTypes = {
  step: StepEdge,
  feedback: CurvedFeedbackEdge,
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

// Helper function to create CSV files from result data
function createCsvFilesFromResult(data: any[]): { files: File[]; titles: string[] } {
  // Handle new structure with titles or old structure
  if (typeof data[0] === 'object' && data[0].title && data[0].csvContent) {
    // New structure with titles (array of objects)
    const files = data.map((item: any, index: number) => {
      const fileName = item.title ? 
        `${slugify(item.title)}.csv` : 
        `bom ${index + 1}.csv`;
      return new File([item.csvContent], fileName, { type: 'text/csv' });
    });
    const titles = data.map((item: any) => item.title || 'Untitled CSV');
    return { files, titles };
  } else if (data.length === 1 && typeof data[0] === 'object' && data[0].title && data[0].csvContent) {
    // Single object with title and csvContent
    const item = data[0];
    const fileName = item.title ? 
      `${slugify(item.title)}.csv` : 
      `bom.csv`;
    const file = new File([item.csvContent], fileName, { type: 'text/csv' });
    return { 
      files: [file], 
      titles: [item.title || 'Untitled CSV'] 
    };
  } else {
    // Old structure - plain CSV strings
    const files = data.map((csvData: string, index: number) => new File([csvData], `bom ${index + 1}.csv`, { type: 'text/csv' }));
    const titles = data.map((_, index: number) => `CSV ${index + 1}`);
    return { files, titles };
  }
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

// Helper function to check if a file is an Excel file
function isExcelFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
         file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
         file.type === 'application/vnd.ms-excel';
}

// Helper function to convert a single Excel file to CSV files
async function convertExcelToCsv(file: File): Promise<File[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const csvFiles: File[] = [];
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const csvFile = new File([csv], `${file.name.replace(/\.(xlsx|xls)$/, '')}_${sheetName}.csv`, { type: 'text/csv' });
    csvFiles.push(csvFile);
  });
  
  return csvFiles;
}

// Helper function to convert Excel files in node data to CSV
async function convertExcelFilesInNodeData(nodeData: Map<string, any>, upstreamIds: string[]): Promise<void> {
  for (const upstreamId of upstreamIds) {
    const upstreamData = nodeData.get(upstreamId);
    if (!upstreamData) continue;

    if (upstreamData.file && isExcelFile(upstreamData.file)) {
      console.log(`🔄 [WORKFLOW] Converting Excel file to CSV before processing: ${upstreamData.file.name}`);
      const csvFiles = await convertExcelToCsv(upstreamData.file);
      // Replace the Excel file with the first CSV file, or add all CSV files
      if (csvFiles.length === 1) {
        nodeData.set(upstreamId, { file: csvFiles[0] });
      } else {
        nodeData.set(upstreamId, { files: csvFiles, file: csvFiles[0] });
      }
      console.log(`✅ [WORKFLOW] Excel file converted to ${csvFiles.length} CSV file(s)`);
    } else if (upstreamData.files) {
      // Handle multiple files, convert any Excel files
      const convertedFiles: File[] = [];
      for (const file of upstreamData.files) {
        if (isExcelFile(file)) {
          console.log(`🔄 [WORKFLOW] Converting Excel file to CSV: ${file.name}`);
          const csvFiles = await convertExcelToCsv(file);
          convertedFiles.push(...csvFiles);
        } else {
          convertedFiles.push(file);
        }
      }
      if (convertedFiles.length !== upstreamData.files.length) {
        nodeData.set(upstreamId, { files: convertedFiles, file: convertedFiles[0] });
        console.log(`✅ [WORKFLOW] Converted Excel files, now have ${convertedFiles.length} CSV files`);
      }
    }
  }
}

// Config: enable node outlines/highlights
const HIGHLIGHT_NODES_WHEN_RUNNING = true;

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
  const [showCompletionState, setShowCompletionState] = useState(false);
  const [nodeRunHistory, setNodeRunHistory] = useState<Record<string, Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>>>({});
  const [localPipelineName, setLocalPipelineName] = useState(pipelineName);
  const completedRef = useRef(new Set<string>());

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

    // Allow if target accepts any type
    if (targetInputTypes.includes('any')) return true;

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
      
      let edgeType = 'step';
      let targetHandle = params.targetHandle;
      
      if (sourceNode?.data.label === NodeLabel.CSV_APPEND && 
          targetNode?.type === NodeType.LOOP) {
        edgeType = 'feedback';
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
    const fileUploadRoots = rootNodes.filter(n => 
      (n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL) || 
      n.type === 'manualUpload'
    );
    const otherRoots = rootNodes.filter(n => 
      !((n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL) || n.type === 'manualUpload')
    );
    // Track node completion and outputs
    const nodeData: Map<string, { file?: File; inputFile?: string; outputFile?: string; fileUrl?: string; files?: File[]; uploadedFileNames?: string[]; fileUploadResolver?: (files: File[]) => void }> = new Map();
    completedRef.current = new Set();
    const waiting: Record<string, (() => void)[]> = {};

    // Helper: get all downstream nodes
    const getDownstream = (nodeId: string) => edges.filter(e => e.source === nodeId).map(e => e.target);
    // Helper: get all upstream nodes
    const getUpstream = (nodeId: string) => edges.filter(e => e.target === nodeId).map(e => e.source);

    // Helper functions for AI Web Search node
    const getInputFilesFromUpstream = (nodeId: string, nodeData: Map<string, any>, getUpstream: (id: string) => string[]): File[] => {
      const allInputFiles: File[] = [];
      const upstreamIds = getUpstream(nodeId);
      
      for (const upstreamId of upstreamIds) {
        const upstreamData = nodeData.get(upstreamId);
        
        if (upstreamData?.files && upstreamData.files.length > 0) {
          allInputFiles.push(...upstreamData.files);
        } else if (upstreamData?.file) {
          allInputFiles.push(upstreamData.file);
        }
      }
      
      if (allInputFiles.length === 0) {
        throw new Error('No input files available from upstream nodes.');
      }
      
      return allInputFiles;
    };

    const callNexarApi = async (bomFiles: File[], nodeId: string, node: any) => {
      console.log(`📡 [WORKFLOW] Calling Nexar API for node ${nodeId}:`, {
        nodeLabel: node.data.label,
        displayName: node.data.displayName,
        inputFileNames: bomFiles.map(f => f.name)
      });

      const formData = new FormData();
      bomFiles.forEach(file => formData.append('bomFile', file));
      // Add approvedSuppliers if present
      if (node.data.approvedSuppliers && Array.isArray(node.data.approvedSuppliers)) {
        formData.append('approvedSuppliers', JSON.stringify(node.data.approvedSuppliers));
      }

      const response = await fetch('/api/nexar-search', {
        method: 'POST',
        body: formData,
      });

      console.log(`📡 [WORKFLOW] Nexar API response received for node ${nodeId}:`, {
        status: response.status,
        ok: response.ok,
        nodeLabel: node.data.label,
        displayName: node.data.displayName
      });

      if (!response.ok) throw new Error('Failed to process BOM with Nexar API');
      return await response.json();
    };

    const createEnrichedJsonFile = (enrichedData: any) => {
      const jsonBlob = new Blob([JSON.stringify(enrichedData, null, 2)], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'enriched_bom.json', { type: 'application/json' });
      const fileUrl = URL.createObjectURL(jsonBlob);
      return { jsonFile, fileUrl };
    };

    const updateNodeState = (nodeId: string, jsonFile: File, fileUrl: string, setNodes: React.Dispatch<React.SetStateAction<Node[]>>) => {
      setNodes(nds => nds.map(n => n.id === nodeId ? {
        ...n,
        data: {
          ...n.data,
          runState: RunState.DONE,
          fileUrl,
          outputFileName: 'enriched_bom.json',
          files: [jsonFile],
          file: jsonFile
        }
      } : n));
    };

    const handleAiWebSearchNode = async (
      nodeId: string, 
      node: any, 
      nodeData: Map<string, any>, 
      setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
      getUpstream: (id: string) => string[],
      getDownstream: (id: string) => string[],
      runNode: (id: string) => Promise<void>
    ) => {
      try {
        console.log(`🔄 [WORKFLOW] Setting AI Web Search node ${nodeId} to RUNNING state`);
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
        
        // Add a 5-second delay to make the running state more visible
        console.log(`⏳ [WORKFLOW] Starting 5-second delay for AI Web Search node ${nodeId}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log(`✅ [WORKFLOW] 5-second delay completed for AI Web Search node ${nodeId}`);
        
        const bomFiles = getInputFilesFromUpstream(nodeId, nodeData, getUpstream);
        
        console.log(`🚀 [WORKFLOW] Starting AI Web Search (Nexar) node execution:`, {
          nodeId,
          nodeType: node.type,
          nodeLabel: node.data.label,
          displayName: node.data.displayName,
          inputFileNames: bomFiles.map(f => f.name)
        });

        const result = await callNexarApi(bomFiles, nodeId, node);
        
        console.log(`✅ [WORKFLOW] Nexar API processing completed for node ${nodeId}:`, {
          nodeLabel: node.data.label,
          displayName: node.data.displayName,
          resultDataLength: result.data?.length || 0, // Now an array of { filename, enrichedData } objects
          success: result.success
        });

        // Nexar API now returns an array of { filename, enrichedData } for multiple BOMs
        const enrichedResults = result.data;

        // Create individual JSON files from each enriched result
        const enrichedJsonFiles = enrichedResults.map((item: { filename: string; enrichedData: any[] }) => {
          const jsonBlob = new Blob([JSON.stringify(item.enrichedData, null, 2)], { type: 'application/json' });
          const jsonFile = new File([jsonBlob], `enriched_bom_${item.filename.replace(/\.csv$/, '')}.json`, { type: 'application/json' });
          return jsonFile;
        });

        // Store the individual JSON files and the structured enrichedData array on the node
        nodeData.set(nodeId, {
          files: enrichedJsonFiles,
          enrichedData: enrichedResults // Store the array of results for sidebar display
        });

        console.log(`🔄 [WORKFLOW] Setting AI Web Search node ${nodeId} to DONE state`);
        setNodes(nds => nds.map(n => n.id === nodeId ? {
          ...n,
          data: {
            ...n.data,
            enrichedData: enrichedResults, // Store the array of results
            runState: RunState.DONE,
            files: enrichedJsonFiles,
            debugInfo: result.debugInfo || null
          }
        } : n));
        
        console.log(`✅ [WORKFLOW] AI Web Search node ${nodeId} completed successfully:`, {
          nodeLabel: node.data.label,
          displayName: node.data.displayName,
          outputFileNames: enrichedJsonFiles.map((f: File) => f.name)
        });
        
        completedRef.current.add(nodeId);
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId);
        }
      } catch (error) {
        console.error(`❌ [WORKFLOW] Error in AI Web Search node ${nodeId}:`, {
          nodeLabel: node.data.label,
          displayName: node.data.displayName,
          error: error instanceof Error ? error.message : String(error)
        });
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
      }
    };

    // Helper: run a node if all its dependencies are satisfied
    const runNode = async (nodeId: string): Promise<void> => {
      console.log(`🎯 [WORKFLOW] runNode called for ${nodeId}`);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        console.log(`❌ [WORKFLOW] Node ${nodeId} not found`);
        return;
      }
      if (completedRef.current.has(nodeId)) {
        console.log(`⏭️ [WORKFLOW] Node ${nodeId} already completed, skipping`);
        return;
      }
      // Check if all upstream nodes are completed
      const upstream = getUpstream(nodeId);
      console.log(`🔍 [WORKFLOW] Checking dependencies for ${nodeId}:`, {
        upstream,
        upstreamCompleted: upstream.map(id => ({ id, completed: completedRef.current.has(id) })),
        completedRefSize: completedRef.current.size,
        allCompletedIds: Array.from(completedRef.current)
      });
      
      if (upstream.some(id => !completedRef.current.has(id))) {
        const missingDeps = upstream.filter(id => !completedRef.current.has(id));
        console.log(`⏳ [WORKFLOW] Node ${nodeId} waiting for dependencies:`, {
          missingDependencies: missingDeps,
          allUpstream: upstream,
          completedUpstream: upstream.filter(id => completedRef.current.has(id))
        });
        console.log(`🔍 [WORKFLOW] Upstream node details for ${nodeId}:`, {
          upstreamIds: upstream,
          missingIds: missingDeps,
          completedIds: upstream.filter(id => completedRef.current.has(id)),
          allCompletedIds: Array.from(completedRef.current)
        });
        console.log(`🔍 [WORKFLOW] Missing upstream node ID: ${missingDeps[0]}`);
        const missingNode = nodes.find(n => n.id === missingDeps[0]);
        console.log(`🔍 [WORKFLOW] Missing node details:`, {
          id: missingDeps[0],
          type: missingNode?.type,
          label: missingNode?.data?.label,
          displayName: missingNode?.data?.displayName
        });
        // Wait for dependencies
        if (!waiting[nodeId]) waiting[nodeId] = [];
        await new Promise<void>(resolve => waiting[nodeId].push(resolve));
        // After dependencies are done, re-run
        return runNode(nodeId);
      }
      
      console.log(`✅ [WORKFLOW] All dependencies satisfied for ${nodeId}, starting execution`);
      
      // Short-circuit for markdown output type: create a dummy markdown file and pass it downstream, skipping Gemini/model call
      if (node.data.ioConfig?.outputType?.type === FileType.MARKDOWN) {
        // Sleep for 7 seconds before outputting the dummy markdown file
        await new Promise(resolve => setTimeout(resolve, 7000));
        const mdFile = new File([''], 'output.md', { type: 'text/markdown' });
        nodeData.set(nodeId, { files: [mdFile] });
        setNodes(nds => nds.map(n => n.id === nodeId ? {
          ...n,
          data: {
            ...n.data,
            runState: RunState.DONE,
            fileUrl: URL.createObjectURL(mdFile),
            outputFileName: 'output.md',
          }
        } : n));
        completedRef.current.add(nodeId);
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId);
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
        completedRef.current.add(nodeId);
        for (const downstreamId of getDownstream(nodeId)) {
          runNode(downstreamId);
        }
        return;
      }

      // File Download node: only set runState to DONE and make file available, do NOT auto-download or prompt
      if (node.type === NodeType.OUTPUT && node.data.type === OutputSubType.FILE_DOWNLOAD) {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
        try {
          // Get input file from upstream nodes
          const inputFiles: File[] = [];
          for (const upstreamId of getUpstream(nodeId)) {
            const upstreamData = nodeData.get(upstreamId);
            if (upstreamData?.files) inputFiles.push(...upstreamData.files);
            else if (upstreamData?.file) inputFiles.push(upstreamData.file);
          }
          if (!inputFiles.length) throw new Error('No input files available');

          const fileToDownload = inputFiles[0]; // Download the first file

          // Do NOT trigger any download or file picker here. Just set the file and mark as done.
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.DONE,
              file: fileToDownload,
              outputFileName: fileToDownload.name,
            }
          } : n));

          completedRef.current.add(nodeId);
          console.log(`✅ [WORKFLOW] Node ${nodeId} marked as completed. Completed nodes:`, Array.from(completedRef.current));
          for (const downstreamId of getDownstream(nodeId)) {
            runNode(downstreamId);
          }
        } catch (error) {
          console.error(`Error in File Download node ${nodeId}:`, error);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      }

      // MOCKED HTTP TRIGGER/RESPONSE FLOW
      if (node.type === NodeType.HTTP_TRIGGER) {
        try {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          await new Promise(res => setTimeout(res, 800)); // Simulate network delay
          console.log(`HTTP Trigger node ${nodeId} completed, setting state to DONE`);
          setNodes(nds => {
            const updated = nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE } } : n);
            console.log(`Node ${nodeId} state set to DONE, current nodes:`, updated.map(n => ({ id: n.id, runState: n.data.runState })));
            return updated;
          });
          completedRef.current.add(nodeId);
          // Trigger downstream nodes AFTER marking as done
          for (const downstreamId of getDownstream(nodeId)) {
            await runNode(downstreamId);
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
          completedRef.current.add(nodeId);
        } catch (err) {
          console.error('Error in HTTP Response node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      }
      if (node.type === NodeType.TRIGGER && node.data.type === TriggerSubType.MANUAL || node.type === 'manualUpload') {
        setNodes(nds => nds.map(n =>
          (n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL) || n.type === 'manualUpload'
            ? { ...n, data: { ...n.data, runState: n.id === nodeId ? RunState.RUNNING : (n.data.runState === RunState.DONE ? RunState.DONE : RunState.IDLE) } }
            : n
        ));
        
        // Create a file input element and trigger file selection directly
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,.xlsx,.xls,.json,.txt,.docx,.pdf,.mp4';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        const files = await new Promise<File[]>((resolve, reject) => {
          fileInput.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
              const file = target.files[0];
              
              // Check if it's a .docx file and convert to PDF
              if (file.name.toLowerCase().endsWith('.docx')) {
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  const response = await fetch('/api/convert-docx', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (response.ok) {
                    const textBlob = await response.blob();
                    const textFile = new File([textBlob], file.name.replace('.docx', '.txt'), { type: 'text/plain' });
                    resolve([textFile]);
                  } else {
                    console.error('Conversion failed, using original file');
                    resolve([file]);
                  }
                } catch (error) {
                  console.error('Conversion error:', error);
                  resolve([file]);
                }
              } else {
                resolve([file]);
              }
            } else {
              resolve([]); // Indicate cancellation
            }
            document.body.removeChild(fileInput);
          };
          
          fileInput.oncancel = () => {
            // Instead of rejecting with an error, resolve with a special value
            resolve([]); // Indicate cancellation
            document.body.removeChild(fileInput);
          };
          
          // Trigger file selection dialog
          fileInput.click();
        });
        // After file selection, check if cancelled
        if (!files || files.length === 0) {
          // File selection was cancelled, set node to idle and return
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.IDLE,
            }
          } : n));
          return;
        }
        
        nodeData.set(nodeId, { file: files[0] });
        setNodes(nds => nds.map(n => n.id === nodeId ? {
          ...n,
          data: {
            ...n.data,
            runState: RunState.DONE,
            uploadedFileNames: [files[0].name],
          }
        } : n));
        
        // Convert Excel files to CSV once when they first enter the workflow
        if (isExcelFile(files[0])) {
          console.log(`🔄 [WORKFLOW] Converting Excel file to CSV on upload: ${files[0].name}`);
          const csvFiles = await convertExcelToCsv(files[0]);
          if (csvFiles.length === 1) {
            nodeData.set(nodeId, { file: csvFiles[0] });
            setNodes(nds => nds.map(n => n.id === nodeId ? {
              ...n,
              data: {
                ...n.data,
                runState: RunState.DONE,
                uploadedFileNames: [csvFiles[0].name],
              }
            } : n));
          } else {
            nodeData.set(nodeId, { files: csvFiles, file: csvFiles[0] });
            setNodes(nds => nds.map(n => n.id === nodeId ? {
              ...n,
              data: {
                ...n.data,
                runState: RunState.DONE,
                uploadedFileNames: csvFiles.map(f => f.name),
              }
            } : n));
          }
          console.log(`✅ [WORKFLOW] Excel file converted to ${csvFiles.length} CSV file(s) on upload`);
        }
        
        completedRef.current.add(nodeId);
        for (const downstreamId of getDownstream(nodeId)) {
          await runNode(downstreamId);
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

          // Convert Excel files to CSV and collect all CSV files
          const allCsvFiles: File[] = [];
          for (let i = 0; i < inputFiles.length; i++) {
            const file = inputFiles[i];
            
            // All files should be CSV by now, but handle any remaining Excel files as a fallback
            if (isExcelFile(file)) {
              console.warn(`⚠️ [WORKFLOW] Excel file found in Excel export node, converting: ${file.name}`);
              const csvFiles = await convertExcelToCsv(file);
              allCsvFiles.push(...csvFiles);
            } else if (file.type === MimeType.TEXT_CSV) {
              // Already a CSV file, add directly
              allCsvFiles.push(file);
            } else {
              console.warn(`⚠️ [WORKFLOW] Skipping unsupported file type: ${file.name} (${file.type})`);
            }
            
            // Log the file as trace
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

          if (allCsvFiles.length === 0) {
            throw new Error('No valid CSV or Excel files found to process');
          }

          console.log(`📊 [WORKFLOW] Processing ${allCsvFiles.length} CSV files for Excel export`);

          // Merge all CSV files into a single multi-sheet XLSX file
          const wb = XLSX.utils.book_new();
          let sheetCount = 1;
          const sheetNamesFromNode = Array.isArray(node.data.sheetNames) ? node.data.sheetNames : [];
          
          for (let i = 0; i < allCsvFiles.length; i++) {
            const file = allCsvFiles[i];
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
          
          // Generate single Excel file
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const mergedExcelFile = new File([excelBuffer], 'merged_output.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          console.log(`✅ [WORKFLOW] Excel export completed: ${allCsvFiles.length} sheets merged into ${mergedExcelFile.name}`);

          // Store the file data without triggering download
          nodeData.set(nodeId, { files: [mergedExcelFile] });
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.DONE,
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
              status: RunState.DONE,
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
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
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
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));
          
          // Get input file from upstream node
          const upstreamId = getUpstream(nodeId)[0];
          const upstreamData = nodeData.get(upstreamId);
          if (!upstreamData?.file) throw new Error('No input file available');
          
          // Get ERP configuration - handle both legacy and new integration node formats
          const erpAction = node.data.erpAction || ErpAction.BOM_LOOKUP;
          const useMockData = node.data.useMockData !== false;
          const mockDistribution = node.data.mockDistribution || { directMatch: 80, substitution: 10, notFound: 10 };
          
          // Read the input file
          const inputText = await upstreamData.file.text();
          const lines = inputText.split('\n').filter(line => line.trim());
          
          // Skip header line
          const dataLines = lines.slice(1);
          
          // Process each line based on ERP action
          const processedLines = dataLines.map(line => {
            const parts = line.match(/\S+/g) || [];
            
            if (erpAction === ErpAction.BOM_LOOKUP) {
              const refDes = parts[0] || "";
              const mpn = parts[1] || "";
              const manufacturer = parts[2] || "";
              const quantity = parts[3] || "";
              const description = parts[4] || "";
              const package_ = parts[5] || "";

              let status = "Direct Match";
              let substitution = undefined;

              if (useMockData) {
                // Use configured mock distribution
                const rand = Math.random() * 100;
                if (rand < mockDistribution.directMatch) {
                  status = "Direct Match";
                } else if (rand < mockDistribution.directMatch + mockDistribution.substitution) {
                  status = "Substitution Found";
                  substitution = `${mpn}-ALT`;
                } else {
                  status = "Not Found in ERP";
                }
              } else {
                // Real ERP connection logic would go here
                status = "Mock Data Disabled";
              }

              return {
                mpn,
                description,
                manufacturer,
                quantity,
                refDes,
                package: package_,
                status,
                substitution
              };
            } else {
              // Handle other ERP actions
              const baseData = {
                partNumber: parts[0] || "",
                description: parts[1] || "",
                manufacturer: parts[2] || "",
              };

              let actionResult = {};
              
              if (useMockData) {
                switch (erpAction) {
                  case ErpAction.BOM_GENERATION:
                    actionResult = {
                      ...baseData,
                      itemNumber: `ITEM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                      category: ['Resistor', 'Capacitor', 'IC', 'Connector', 'Mechanical'][Math.floor(Math.random() * 5)],
                      bomLevel: Math.floor(Math.random() * 5) + 1,
                      assemblyQuantity: Math.floor(Math.random() * 10) + 1,
                      unitCost: (Math.random() * 50 + 0.1).toFixed(2),
                      totalCost: ((Math.random() * 50 + 0.1) * (Math.floor(Math.random() * 10) + 1)).toFixed(2),
                      status: 'Generated'
                    };
                    break;
                  case ErpAction.INVENTORY_CHECK:
                    actionResult = {
                      ...baseData,
                      stockLevel: Math.floor(Math.random() * 1000),
                      location: `Bin-${Math.floor(Math.random() * 100)}`,
                      status: Math.random() > 0.2 ? 'In Stock' : 'Out of Stock'
                    };
                    break;
                  case ErpAction.PRICE_LOOKUP:
                    actionResult = {
                      ...baseData,
                      unitPrice: (Math.random() * 100 + 1).toFixed(2),
                      currency: 'USD',
                      priceBreaks: '1-99: $' + (Math.random() * 100 + 1).toFixed(2),
                      status: 'Price Available'
                    };
                    break;
                  case ErpAction.SUPPLIER_LOOKUP:
                    actionResult = {
                      ...baseData,
                      supplier: `Supplier-${Math.floor(Math.random() * 10) + 1}`,
                      contactEmail: `contact${Math.floor(Math.random() * 10)}@supplier.com`,
                      leadTime: Math.floor(Math.random() * 30 + 1) + ' days',
                      status: 'Supplier Found'
                    };
                    break;
                  case ErpAction.LEAD_TIME_CHECK:
                    actionResult = {
                      ...baseData,
                      leadTime: Math.floor(Math.random() * 30 + 1) + ' days',
                      supplier: `Supplier-${Math.floor(Math.random() * 10) + 1}`,
                      status: 'Lead Time Available'
                    };
                    break;
                  case ErpAction.ALTERNATE_PARTS:
                    actionResult = {
                      ...baseData,
                      alternates: `${baseData.partNumber}-ALT1, ${baseData.partNumber}-ALT2`,
                      alternateCount: Math.floor(Math.random() * 5) + 1,
                      status: 'Alternates Found'
                    };
                    break;
                  case ErpAction.COMPLIANCE_CHECK:
                    actionResult = {
                      ...baseData,
                      rohsCompliant: Math.random() > 0.1 ? 'Yes' : 'No',
                      reachCompliant: Math.random() > 0.05 ? 'Yes' : 'No',
                      status: 'Compliance Checked'
                    };
                    break;
                  default:
                    actionResult = {
                      ...baseData,
                      result: 'Mock response for ' + erpAction,
                      status: 'Processed'
                    };
                }
              } else {
                actionResult = {
                  ...baseData,
                  status: 'Mock Data Disabled - Configure ERP Connection'
                };
              }

              return actionResult;
            }
          });

          // Generate appropriate headers based on action type
          let headers = [];
          if (erpAction === ErpAction.BOM_LOOKUP) {
            headers = ['Manufacturer Part Number', 'Description', 'Manufacturer', 'Quantity', 'Reference Designators', 'Package', 'Status', 'Substitution'];
          } else if (erpAction === ErpAction.BOM_GENERATION) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Item Number', 'Category', 'BOM Level', 'Assembly Quantity', 'Unit Cost', 'Total Cost', 'Status'];
          } else if (erpAction === ErpAction.INVENTORY_CHECK) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Stock Level', 'Location', 'Status'];
          } else if (erpAction === ErpAction.PRICE_LOOKUP) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Unit Price', 'Currency', 'Price Breaks', 'Status'];
          } else if (erpAction === ErpAction.SUPPLIER_LOOKUP) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Supplier', 'Contact Email', 'Lead Time', 'Status'];
          } else if (erpAction === ErpAction.LEAD_TIME_CHECK) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Lead Time', 'Supplier', 'Status'];
          } else if (erpAction === ErpAction.ALTERNATE_PARTS) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Alternates', 'Alternate Count', 'Status'];
          } else if (erpAction === ErpAction.COMPLIANCE_CHECK) {
            headers = ['Part Number', 'Description', 'Manufacturer', 'RoHS Compliant', 'REACH Compliant', 'Status'];
          } else {
            headers = ['Part Number', 'Description', 'Manufacturer', 'Result', 'Status'];
          }

          // Convert to CSV
          const csvRows = [
            headers.join(','),
            ...processedLines.map(line => {
              if (erpAction === ErpAction.BOM_LOOKUP) {
                return [
                  (line as any).mpn,
                  (line as any).description,
                  (line as any).manufacturer,
                  (line as any).quantity,
                  (line as any).refDes,
                  (line as any).package,
                  (line as any).status,
                  (line as any).substitution || ''
                ].join(',');
              } else {
                return Object.values(line).join(',');
              }
            })
          ];
          const csvContent = csvRows.join('\n');
          
          // Create output file
          const outputFile = new File([csvContent], `erp-${erpAction}-results.csv`, { type: 'text/csv' });
          
          // Update node state
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.DONE,
              file: outputFile,
              ioConfig: {
                inputTypes: [{ type: FileType.CSV }],
                outputType: { type: FileType.CSV }
              }
            }
          } : n));
          
          // Store the output file
          nodeData.set(nodeId, { file: outputFile });
          
          // Mark as completed
          completedRef.current.add(nodeId);
          
          // Process downstream nodes
          for (const downstreamId of getDownstream(nodeId)) {
            await runNode(downstreamId);
          }
        } catch (err) {
          console.error('Error in ERP node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else if (node.type === NodeType.LOOP) {
        try {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));

          // Check if this loop has a feedback connection (CSV append feeding back)
          const feedbackEdges = edges.filter(e => e.target === nodeId && e.type === 'feedback');
          const hasFeedback = feedbackEdges.length > 0;

          if (hasFeedback) {
            // Handle feedback loop: accumulate results iteratively
            await handleFeedbackLoop(nodeId, nodeData, getUpstream, getDownstream, runNode);
          } else {
            // Original loop logic: process each row sequentially
            const upstreamId = getUpstream(nodeId)[0];
            const upstreamData = nodeData.get(upstreamId);
            if (!upstreamData?.file) throw new Error('No input file available');

            // Read the input file
            const inputText = await upstreamData.file.text();
            const lines = inputText.split('\n').filter(line => line.trim());
            if (lines.length < 2) throw new Error('CSV must have at least one data row');
            const header = lines[0];
            const dataLines = lines.slice(1);

            // For each data line, create a new CSV file and run downstream nodes
            for (let i = 0; i < dataLines.length; i++) {
              const csvContent = `${header}\n${dataLines[i]}`;
              const rowFile = new File([csvContent], `row_${i + 1}.csv`, { type: 'text/csv' });
              // For each downstream node, run it with this row file
              for (const downstreamId of getDownstream(nodeId)) {
                // Store the row file as the input for the downstream node
                nodeData.set(nodeId + '_row_' + i, { file: rowFile });
                // Run the downstream node, passing a special upstream context
                await runNodeWithInput(downstreamId, rowFile, nodeId + '_row_' + i);
              }
            }
          }

          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.DONE } } : n));
          completedRef.current.add(nodeId);
        } catch (err) {
          console.error('Error in Loop node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else if (node.type === NodeType.ACTION && node.data.label === NodeLabel.CSV_APPEND) {
        try {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.RUNNING } } : n));

          // Get all input files from upstream nodes
          const inputFiles: File[] = [];
          for (const upstreamId of getUpstream(nodeId)) {
            const upstreamData = nodeData.get(upstreamId);
            if (upstreamData?.files) inputFiles.push(...upstreamData.files);
            else if (upstreamData?.file) inputFiles.push(upstreamData.file);
          }
          
          if (inputFiles.length === 0) throw new Error('No input files available for CSV append');
          
          // Filter for CSV files only
          const csvFiles = inputFiles.filter(file => file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'));
          if (csvFiles.length === 0) throw new Error('No CSV files found in input');

          let allRows: string[] = [];
          let headers: string | null = null;
          
          // Process each CSV file
          for (const csvFile of csvFiles) {
            const csvContent = await csvFile.text();
            const lines = csvContent.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) continue;
            
            const fileHeaders = lines[0];
            const fileDataRows = lines.slice(1);
            
            // Use headers from first file, validate subsequent files have same structure
            if (headers === null) {
              headers = fileHeaders;
              allRows.push(headers);
            } else if (headers !== fileHeaders) {
              console.warn(`CSV file ${csvFile.name} has different headers, skipping data rows`);
              continue;
            }
            
            // Append data rows (skip header)
            allRows.push(...fileDataRows);
          }
          
          if (headers === null) throw new Error('No valid CSV headers found');
          
          // Create the merged CSV content
          const mergedCsvContent = allRows.join('\n');
          const outputFileName = node.data.outputFileName || 'merged_data.csv';
          const outputFile = new File([mergedCsvContent], outputFileName, { type: 'text/csv' });
          
          // Store the output file
          nodeData.set(nodeId, { file: outputFile });
          
          // Update node state
          setNodes(nds => nds.map(n => n.id === nodeId ? {
            ...n,
            data: {
              ...n.data,
              runState: RunState.DONE,
              file: outputFile,
              ioConfig: {
                inputTypes: [{ type: FileType.CSV }],
                outputType: { type: FileType.CSV }
              }
            }
          } : n));
          
          completedRef.current.add(nodeId);
          
          // Process downstream nodes
          for (const downstreamId of getDownstream(nodeId)) {
            await runNode(downstreamId);
          }
        } catch (err) {
          console.error('Error in CSV Append node:', err);
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, runState: RunState.ERROR } } : n));
        }
        return;
      } else if (node.type === NodeType.AI_WEB_SCRAPE) {
        await handleAiWebSearchNode(nodeId, node, nodeData, setNodes, getUpstream, getDownstream, runNode);
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
          
          // Add detailed logging for BOM reformatting and other action nodes
          console.log(`🚀 [WORKFLOW] Starting action node execution:`, {
            nodeId,
            nodeType: node.type,
            nodeLabel: node.data.label,
            displayName: node.data.displayName,
            inputFilesCount: inputFiles.length,
            inputFileNames: inputFiles.map((f: File) => f.name),
            prompt: node.data.prompt,
            useOutputTemplate: node.data.useOutputTemplate,
            outputTemplateUrl: node.data.outputTemplateUrl
          });

          const formData = new FormData();
          inputFiles.forEach(file => formData.append('inputFile', file));
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

          console.log(`📡 [WORKFLOW] Calling Gemini API for node ${nodeId}:`, {
            nodeLabel: node.data.label,
            displayName: node.data.displayName,
            inputFileName: inputFiles[0]?.name,
            prompt: node.data.prompt,
            useOutputTemplate: node.data.useOutputTemplate,
            outputTemplateUrl: node.data.outputTemplateUrl,
            hasGlobalSystemPrompt: !!globalSystemPrompt
          });

          const response = await fetch('/api/gemini', {
            method: 'POST',
            body: formData,
            headers,
          });
          
          console.log(`📡 [WORKFLOW] Gemini API response received for node ${nodeId}:`, {
            status: response.status,
            ok: response.ok,
            nodeLabel: node.data.label,
            displayName: node.data.displayName
          });

          if (!response.ok) throw new Error('Failed to process file with Gemini');
          const result = await response.json();
          
          console.log(`✅ [WORKFLOW] Gemini API processing completed for node ${nodeId}:`, {
            nodeLabel: node.data.label,
            displayName: node.data.displayName,
            resultDataLength: result.data?.length || 0,
            resultDataType: typeof result.data,
            success: result.success,
            hasDebugInfo: !!result.debugInfo
          });

          // Debug: Log the actual result.data structure
          console.log(`🔍 [WORKFLOW] Result data structure for node ${nodeId}:`, {
            resultData: result.data,
            resultDataType: typeof result.data,
            isArray: Array.isArray(result.data),
            length: result.data?.length,
            firstItem: result.data?.[0],
            firstItemType: typeof result.data?.[0]
          });

          let csvFiles: File[] = [];
          let csvTitles: string[] = [];
          
          console.log(`🔍 [WORKFLOW] Processing conditions for node ${nodeId}:`, {
            outputType: node.data.ioConfig?.outputType?.type,
            isJsonOutput: node.data.ioConfig?.outputType?.type === FileType.JSON,
            hasResultData: !!result.data,
            resultDataLength: result.data?.length || 0,
            condition1: node.data.ioConfig?.outputType?.type === FileType.JSON && result.data && result.data.length > 0,
            condition2: result.data && result.data.length > 0
          });
          
          // If output type is json, create a downloadable file from the result (including hardcoded JSON)
          if (node.data.ioConfig?.outputType?.type === FileType.JSON && result.data && result.data.length > 0) {
            const jsonData = result.data.length === 1 ? result.data[0] : result.data;
            // Short-circuit for hardcoded JSON output when input is MP4
            if (node.data.ioConfig?.inputTypes?.some((t: any) => t.type === FileType.MP4)) {
              console.log(`⏭️ [WORKFLOW] Skipping Gemini processing for MP4 input, using hardcoded JSON for node ${nodeId}`);
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
                  files: [jsonFile],
                  file: jsonFile,
                  debugInfo: result.debugInfo || null
                }
              } : n));
              completedRef.current.add(nodeId);
              for (const downstreamId of getDownstream(nodeId)) {
                runNode(downstreamId);
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
                files: [jsonFile],
                file: jsonFile,
                debugInfo: result.debugInfo || null
              }
            } : n));
          } else if (result.data && result.data.length > 0) {
            console.log(`🔍 [WORKFLOW] Processing CSV data for node ${nodeId}:`, {
              dataLength: result.data.length,
              dataType: typeof result.data[0],
              hasTitle: result.data[0]?.title,
              hasCsvContent: result.data[0]?.csvContent
            });
            const csvResult = createCsvFilesFromResult(result.data);
            csvFiles = csvResult.files;
            csvTitles = csvResult.titles;
            console.log(`📁 [WORKFLOW] Created CSV files for node ${nodeId}:`, {
              filesCount: csvFiles.length,
              fileNames: csvFiles.map(f => f.name),
              titles: csvTitles
            });
            nodeData.set(nodeId, { files: csvFiles });
            setNodes(nds => nds.map(n => n.id === nodeId ? {
              ...n,
              data: {
                ...n.data,
                runState: RunState.DONE,
                files: csvFiles,
                file: csvFiles.length === 1 ? csvFiles[0] : undefined,
                csvTitles: csvTitles,
                debugInfo: result.debugInfo || null
              }
            } : n));
          } else {
            // No output data
            setNodes(nds => nds.map(n => n.id === nodeId ? {
              ...n,
              data: {
                ...n.data,
                runState: RunState.DONE,
                files: [],
                file: undefined,
                debugInfo: result.debugInfo || null
              }
            } : n));
          }
          
          console.log(`✅ [WORKFLOW] Node ${nodeId} completed successfully:`, {
            nodeLabel: node.data.label,
            displayName: node.data.displayName,
            outputFilesCount: csvFiles.length,
            outputFileNames: csvFiles.map((f: File) => f.name)
          });
          
          // Always mark node as completed and trigger downstream nodes after output is set
          completedRef.current.add(nodeId);
          console.log(`✅ [WORKFLOW] Structured Generation node ${nodeId} marked as completed. Completed nodes:`, Array.from(completedRef.current));
          
          const downstreamNodes = getDownstream(nodeId);
          console.log(`🔗 [WORKFLOW] Triggering downstream nodes for ${nodeId}:`, {
            downstreamNodes,
            downstreamCount: downstreamNodes.length,
            allEdges: edges.filter(e => e.source === nodeId)
          });
          
          for (const downstreamId of downstreamNodes) {
            console.log(`🚀 [WORKFLOW] Starting downstream node: ${downstreamId}`);
            runNode(downstreamId);
          }
        } catch (error: unknown) {
          console.error(`❌ [WORKFLOW] Error running node ${nodeId}:`, {
            nodeLabel: node.data.label,
            displayName: node.data.displayName,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
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

    // Helper function to run a node with a specific input file and context key
    async function runNodeWithInput(nodeId: string, file: File, contextKey: string) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || completedRef.current.has(contextKey)) return;
      // Store the file in nodeData with the context key
      nodeData.set(contextKey, { file });
      // Mark as completed for this context
      completedRef.current.add(contextKey);
      // Run the node as usual (could be extended for more context-aware logic)
      await runNode(nodeId);
    }

    // Helper function to handle feedback loops (Loop -> ERP -> CSV Append -> Loop)
    async function handleFeedbackLoop(
      loopNodeId: string, 
      nodeData: Map<string, any>, 
      getUpstream: (id: string) => string[], 
      getDownstream: (id: string) => string[], 
      runNode: (id: string) => Promise<void>
    ) {
      // Get initial input data
      const upstreamId = getUpstream(loopNodeId)[0];
      const upstreamData = nodeData.get(upstreamId);
      if (!upstreamData?.file) throw new Error('No input file available for feedback loop');

      // Read the input file
      const inputText = await upstreamData.file.text();
      const lines = inputText.split('\n').filter((line: string) => line.trim());
      if (lines.length < 2) throw new Error('CSV must have at least one data row for feedback loop');
      
      const header = lines[0];
      const dataLines = lines.slice(1);
      
      // Initialize accumulated results with header
      let accumulatedResults = [header];
      
      // Process each row through the feedback loop
      for (let i = 0; i < dataLines.length; i++) {
        const csvContent = `${header}\n${dataLines[i]}`;
        const rowFile = new File([csvContent], `row_${i + 1}.csv`, { type: 'text/csv' });
        
        // Store row file for this iteration
        const iterationKey = `${loopNodeId}_iteration_${i}`;
        nodeData.set(iterationKey, { file: rowFile });
        
        // Run downstream nodes (ERP -> CSV Append)
        const downstreamNodes = getDownstream(loopNodeId);
        for (const downstreamId of downstreamNodes) {
          // Skip feedback edges to avoid infinite loop
          const isDirectDownstream = edges.some(e => 
            e.source === loopNodeId && 
            e.target === downstreamId && 
            e.type !== 'feedback'
          );
          
          if (isDirectDownstream) {
            // Run the downstream chain (ERP -> CSV Append)
            await runDownstreamChain(downstreamId, rowFile, iterationKey);
            
            // Get the result from CSV Append node (find it in the chain)
            const csvAppendNodeId = findCsvAppendInChain(downstreamId);
            if (csvAppendNodeId) {
              const csvAppendResult = nodeData.get(csvAppendNodeId);
              if (csvAppendResult?.file) {
                               const resultText = await csvAppendResult.file.text();
               const resultLines = resultText.split('\n').filter((line: string) => line.trim());
                // Add new data rows (skip header)
                if (resultLines.length > 1) {
                  accumulatedResults.push(...resultLines.slice(1));
                }
              }
            }
          }
        }
      }
      
      // Create final accumulated file
      const finalCsvContent = accumulatedResults.join('\n');
      const finalFile = new File([finalCsvContent], 'accumulated_results.csv', { type: 'text/csv' });
      nodeData.set(loopNodeId, { file: finalFile });
    }

    // Helper to run a chain of nodes starting from a given node
    async function runDownstreamChain(startNodeId: string, inputFile: File, contextKey: string) {
      const startNode = nodes.find(n => n.id === startNodeId);
      if (!startNode) return;
      
      // Store input for this chain
      nodeData.set(contextKey, { file: inputFile });
      
      // Run the starting node
      await runNode(startNodeId);
      
      // Continue with its downstream nodes
      const nextDownstream = getDownstream(startNodeId);
      for (const nextId of nextDownstream) {
        // Skip feedback edges
        const isNotFeedback = !edges.some(e => 
          e.source === startNodeId && 
          e.target === nextId && 
          e.type === 'feedback'
        );
        
        if (isNotFeedback) {
          const nodeResult = nodeData.get(startNodeId);
          if (nodeResult?.file) {
            await runDownstreamChain(nextId, nodeResult.file, `${contextKey}_${nextId}`);
          }
        }
      }
    }

    // Helper to find CSV Append node in a downstream chain
    function findCsvAppendInChain(startNodeId: string): string | null {
      const visited = new Set<string>();
      const queue = [startNodeId];
      
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        const node = nodes.find(n => n.id === nodeId);
        if (node?.data.label === NodeLabel.CSV_APPEND) {
          return nodeId;
        }
        
        // Add downstream nodes (excluding feedback edges)
        const downstream = getDownstream(nodeId).filter(id => 
          !edges.some(e => e.source === nodeId && e.target === id && e.type === 'feedback')
        );
        queue.push(...downstream);
      }
      
      return null;
    }

    // Sequentially prompt for file upload roots in y order, but do not await downstreams
    for (let i = 0; i < fileUploadRoots.length; i++) {
      await runNode(fileUploadRoots[i].id);
    }
    // After all file upload roots, start any other root nodes (if any)
    await Promise.all(otherRoots.map(root => runNode(root.id)));
    
    // Set completion state to show green borders
    setShowCompletionState(true);
    
    // Reset all nodes to idle state after a delay to show completion state
    // setTimeout(() => {
    //   console.log('Resetting all nodes to IDLE state after pipeline completion');
    //   setShowCompletionState(false);
    //   setNodes(nds =>
    //     nds.map(n => ({
    //       ...n,
    //       data: {
    //         ...n.data,
    //         runState: RunState.IDLE,
    //       },
    //     }))
    //   );
    // }, 60000); // Show completion state for 5 seconds
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
    console.log('stopPipeline called - resetting all nodes to IDLE');
    setRunning(false);
    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        runState: RunState.IDLE,
      },
    })));
    // Optionally clear other state if needed
  }, [setNodes]);

  useImperativeHandle(ref, () => ({
    runPipeline,
    running,
    stopPipeline,
  }));

  // Set running=true at the start of runPipeline, and only set running=false when all nodes are done or error
  useEffect(() => {
    // If any node is running, set running to true
    if (nodes.some(n => n.data.runState === RunState.RUNNING)) {
      setRunning(true);
    } else if (nodes.length > 0 && nodes.every(n => n.data.runState === RunState.DONE || n.data.runState === RunState.ERROR || n.data.runState === RunState.IDLE || n.data.runState === undefined)) {
      setRunning(false);
    }
  }, [nodes]);

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
            // Simplified highlighting logic - highlight running nodes and selected manual triggers
            const isHighlighted = n.data.runState === RunState.RUNNING || 
              ((n.type === NodeType.TRIGGER && n.data.type === TriggerSubType.MANUAL) || n.type === 'manualUpload') && n.id === selectedNodeId;
            
            // Debug logging for AI Web Search nodes
            if (n.type === NodeType.AI_WEB_SCRAPE) {
              console.log(`🎯 [REACTFLOW] AI Web Search node ${n.id}: runState=${n.data.runState}, isHighlighted=${isHighlighted}`);
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
          edges={edges.map(e => ({
            ...e,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#222' }
          }))}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          onNodeClick={handleNodeClick}
          onPaneClick={handleSidebarClose}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { strokeDasharray: '6 3', strokeWidth: 2, stroke: '#222' }
          }}
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
      </div>
    </div>
  );
}); 
