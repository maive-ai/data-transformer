import { NextRequest, NextResponse } from 'next/server';
import { savePipeline, getPipelines } from '@/lib/storage';

export async function POST(request: NextRequest) {
  const newPipeline = await request.json();
  
  if (savePipeline(newPipeline.id, newPipeline)) {
    return NextResponse.json(newPipeline);
  }
  
  return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 });
}

export async function GET() {
  // Read all pipelines from disk and return as array
  const pipelines = getPipelines();
  return NextResponse.json(Object.values(pipelines));
} 