import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'run-history.json');

function readHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return {};
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

function writeHistory(data: any) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const history = readHistory();
  const runs = history[pipelineId] || [];
  return NextResponse.json({ runs });
}

export async function POST(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const { run } = await request.json();
  if (!run) return NextResponse.json({ error: 'Missing run' }, { status: 400 });
  const history = readHistory();
  if (!history[pipelineId]) history[pipelineId] = [];
  history[pipelineId].push(run);
  writeHistory(history);
  return NextResponse.json({ success: true });
} 