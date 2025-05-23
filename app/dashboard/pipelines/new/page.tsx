"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewPipelinePage() {
  const router = useRouter();

  useEffect(() => {
    async function createPipeline() {
      const id = `pipeline-${Date.now()}`;
      const newPipeline = {
        id,
        name: "Untitled Pipeline",
        description: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [],
        runs: [],
        workflow: { nodes: [], edges: [] },
      };
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPipeline),
      });
      if (res.ok) {
        router.replace(`/dashboard/pipelines/${id}`);
      } else {
        alert("Failed to create pipeline");
      }
    }
    createPipeline();
  }, [router]);

  return <div>Creating pipeline...</div>;
}
