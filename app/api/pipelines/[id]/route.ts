import { NextRequest, NextResponse } from 'next/server';
import { getPipeline, savePipeline } from '@/lib/storage';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let pipeline = getPipeline(id);

  if (!pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  return NextResponse.json(pipeline);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const updatedPipeline = await request.json();

  if (savePipeline(id, updatedPipeline)) {
    return NextResponse.json(updatedPipeline);
  }

  return NextResponse.json({ error: "Failed to save pipeline" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const newPipeline = await request.json();
  if (savePipeline(newPipeline.id, newPipeline)) {
    return NextResponse.json(newPipeline);
  }
  return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 });
}
