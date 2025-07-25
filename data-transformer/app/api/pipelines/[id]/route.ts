import { NextRequest, NextResponse } from 'next/server';
import { getPipeline, savePipeline, deletePipeline } from '@/lib/storage';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let pipeline = await getPipeline(id);

  if (!pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  return NextResponse.json(pipeline);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const updatedPipeline = await request.json();

  if (await savePipeline(id, updatedPipeline)) {
    return NextResponse.json(updatedPipeline);
  }

  return NextResponse.json({ error: "Failed to save pipeline" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const newPipeline = await request.json();
  if (await savePipeline(newPipeline.id, newPipeline)) {
    return NextResponse.json(newPipeline);
  }
  return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const pipeline = await getPipeline(id);
  if (!pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }
  if (await deletePipeline(id)) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Failed to delete pipeline" }, { status: 500 });
}
