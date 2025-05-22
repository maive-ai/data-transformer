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
  const [nodeRunStates, setNodeRunStates] = useState<Record<string, 'idle' | 'running' | 'done'>>( {} );
  const [nodeRunHistory, setNodeRunHistory] = useState<Record<string, Array<{ timestamp: string; status: string; inputFile?: string; outputFile?: string }>>>({});

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

  const onConnect = useCallback(
    (connection: Connection) => {
      // Prevent cycles (DAG enforcement)
      const source = connection.source;
      const target = connection.target;
      if (!source || !target) return;
      // Build adjacency list
      const adj: Record<string, string[]> = {};
      edges.forEach(e => {
        if (!adj[e.source]) adj[e.source] = [];
        adj[e.source].push(e.target);
      });
      // Add the new connection
      if (!adj[source]) adj[source] = [];
      adj[source].push(target);
      // DFS to check for cycle
      const visited: Record<string, boolean> = {};
      const recStack: Record<string, boolean> = {};
      function hasCycle(v: string): boolean {
        if (!visited[v]) {
          visited[v] = true;
          recStack[v] = true;
          for (const n of adj[v] || []) {
            if (!visited[n] && hasCycle(n)) return true;
            else if (recStack[n]) return true;
          }
        }
        recStack[v] = false;
        return false;
      }
      if (hasCycle(source)) {
        // Optionally, show a warning/toast here
        return;
      }
      // Add edge with arrow at target
      setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
      onEdgesChange?.(edges);
    },
    [edges, onEdgesChange]
  );

  // Run pipeline animation logic
  const runPipeline = async () => {
    setRunning(true);
    const order = getTopologicalOrder();
    const newRunStates: Record<string, 'idle' | 'running' | 'done'> = {};
    order.forEach(id => { newRunStates[id] = 'idle'; });
    setNodeRunStates({ ...newRunStates });
    for (const nodeId of order) {
      setNodeRunStates(states => ({ ...states, [nodeId]: 'running' }));
      await new Promise(res => setTimeout(res, 3000)); // Simulate node run for 3 seconds
      setNodeRunStates(states => ({ ...states, [nodeId]: 'done' }));
      // Add run history for this node
      setNodeRunHistory(history => {
        const node = nodes.find(n => n.id === nodeId);
        const entry = {
          timestamp: new Date().toISOString(),
          status: 'done',
          inputFile: node?.data?.exampleInputName,
          outputFile: node?.data?.fileName || node?.data?.exampleOutputName,
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
      </div>
    </div>
  );
}); 