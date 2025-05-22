import { Node, Edge } from "reactflow";

export interface PipelineStep {
  id: string
  type: string
  name: string
  source: string
  description?: string
  config: Record<string, any>
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
