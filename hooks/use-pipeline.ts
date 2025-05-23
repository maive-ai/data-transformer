"use client"

import { useEffect, useState } from "react"
import type { Pipeline } from "@/types/pipeline"

export function usePipeline(pipelineId: string) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPipeline() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}`)
        if (!res.ok) throw new Error("Pipeline not found")
        const data = await res.json()
        setPipeline(data)
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
