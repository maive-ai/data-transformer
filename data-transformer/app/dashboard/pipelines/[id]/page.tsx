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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 20, marginBottom: 32 }}>Loading pipeline...</div>
        <div style={{ width: 240, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: '40%',
            height: '100%',
            background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
            borderRadius: 4,
            position: 'absolute',
            left: 0,
            top: 0,
            animation: 'loading-bar 1.2s infinite cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { left: 0; width: 40%; }
            50% { left: 60%; width: 40%; }
            100% { left: 100%; width: 40%; }
          }
        `}</style>
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
