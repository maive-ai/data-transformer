import { NextRequest, NextResponse } from 'next/server';
import { savePipeline } from '@/lib/storage';

// In-memory store for pipelines (for demo/dev only)
declare global {
  // eslint-disable-next-line no-var
  var __pipelines: Record<string, any> | undefined;
}
const pipelines: Record<string, any> = globalThis.__pipelines || (globalThis.__pipelines = {});

export async function POST(request: NextRequest) {
  const newPipeline = await request.json();
  
  if (savePipeline(newPipeline.id, newPipeline)) {
    return NextResponse.json(newPipeline);
  }
  
  return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 });
} 