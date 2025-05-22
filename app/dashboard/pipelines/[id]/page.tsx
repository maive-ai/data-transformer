"use client";

import { useParams } from "next/navigation";
import { PipelineEditor } from "@/components/pipeline-editor";
import { usePipeline } from "@/hooks/use-pipeline";

export default function PipelinePage() {
  const params = useParams();
  const pipelineId = params.id as string;
  const { pipeline, isLoading, error } = usePipeline(pipelineId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-oid="k_i83-w">
        Loading pipeline...
      </div>
    );
  }

  if (error || !pipeline) {
    return (
      <div className="flex items-center justify-center h-full" data-oid="y7a:4hf">
        <div className="text-center" data-oid="vzu0dhr">
          <h2 className="text-xl font-bold" data-oid="vv3e4rm">Error loading pipeline</h2>
          <p className="text-gray-500" data-oid="sdsgr4o">{error?.message || "Pipeline not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <PipelineEditor pipeline={pipeline} data-oid="8ku_5fm" />
    </div>
  );
}
