import { Node, Edge } from "reactflow";

export interface NodeIOType {
  type: string;  // e.g., "csv", "json", "excel"
  schema?: Record<string, any>;  // Optional schema for validation
  description?: string;
}

export interface NodeIOConfig {
  inputTypes: NodeIOType[];
  outputType: NodeIOType;
}

export interface PipelineStep {
  id: string
  type: string
  name: string
  source: string
  description?: string
  config: Record<string, any>
  ioConfig?: NodeIOConfig  // New field for input/output configuration
  pulseAnalysis?: {
    markdown: string
    chunks: Record<string, any>
    schemaJson: Record<string, any>
  }
}

export interface PipelineRun {
  id: string
  pipelineId: string
  timestamp: string
  status: "success" | "error" | "running"
  inputFile?: string
  outputFile?: string
  error?: string
}

export interface Pipeline {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  steps: PipelineStep[]
  runs: PipelineRun[]
  workflow?: {
    nodes: Node[]
    edges: Edge[]
  }
  naturalLanguageDescription?: string
}
