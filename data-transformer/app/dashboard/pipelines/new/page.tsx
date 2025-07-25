"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewPipelinePage() {
  const router = useRouter();
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
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
        router.push(`/dashboard/pipelines/${id}`);
      } else {
        alert("Failed to create pipeline");
      }
    }
    createPipeline();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 20, marginBottom: 32 }}>Creating pipeline...</div>
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
