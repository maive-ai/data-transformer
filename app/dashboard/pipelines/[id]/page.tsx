"use client";

import { useParams } from "next/navigation";
import { PipelineEditor } from "@/components/pipeline-editor";
import { PipelineExecutor } from "@/components/pipeline-executor";
import { PipelineHistory } from "@/components/pipeline-history";
import { usePipeline } from "@/hooks/use-pipeline";

export default function PipelinePage() {
  const params = useParams();
  const pipelineId = params.id as string;
  const { pipeline, isLoading, error } = usePipeline(pipelineId);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        data-oid="k_i83-w"
      >
        Loading pipeline...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-full"
        data-oid="y7a:4hf"
      >
        <div className="text-center" data-oid="vzu0dhr">
          <h2 className="text-xl font-bold" data-oid="vv3e4rm">
            Error loading pipeline
          </h2>
          <p className="text-gray-500" data-oid="sdsgr4o">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full"
      data-oid="lns7_qu"
    >
      <div className="lg:col-span-3 h-full" data-oid="hcpb.a2">
        <PipelineHistory pipelineId={pipelineId} data-oid="z0asji7" />
      </div>
      <div className="lg:col-span-6 h-full" data-oid="fpa9vhc">
        <PipelineEditor pipeline={pipeline} data-oid="8ku_5fm" />
      </div>
      <div className="lg:col-span-3 h-full" data-oid="zcw.6r9">
        <PipelineExecutor pipeline={pipeline} data-oid="mg2m_s8" />
      </div>
    </div>
  );
}
