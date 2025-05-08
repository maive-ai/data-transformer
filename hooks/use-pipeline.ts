"use client"

import { useEffect, useState } from "react"
import type { Pipeline } from "@/types/pipeline"

export function usePipeline(pipelineId: string) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPipeline = () => {
      setIsLoading(true)
      setError(null)

      try {
        // In a real app, this would be an API call
        const pipelines = JSON.parse(localStorage.getItem("pipelines") || "[]")
        const foundPipeline = pipelines.find((p: Pipeline) => p.id === pipelineId)

        if (foundPipeline) {
          setPipeline(foundPipeline)
        } else {
          throw new Error("Pipeline not found")
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load pipeline"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPipeline()
  }, [pipelineId])

  return { pipeline, isLoading, error }
}
