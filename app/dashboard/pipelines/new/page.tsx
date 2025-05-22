"use client";

import { PipelineEditor } from "@/components/pipeline-editor";

export default function NewPipelinePage() {
  return (
    <div className="h-full w-full flex flex-col">
      <PipelineEditor pipeline={null} isNew={true} data-oid="8ku_5fm" />
    </div>
  );
}
