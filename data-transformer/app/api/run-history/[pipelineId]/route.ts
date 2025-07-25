import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'run-history.json');
fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true }).catch(() => {});
fs.access(HISTORY_FILE).catch(async () => {
  await fs.writeFile(HISTORY_FILE, JSON.stringify({}));
});

async function readHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeHistory(data: any) {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const history = await readHistory();
  const runs = history[pipelineId] || [];
  return NextResponse.json({ runs });
}

export async function POST(request: NextRequest, { params }: { params: { pipelineId: string } }) {
  const { pipelineId } = params;
  const { run } = await request.json();
  if (!run) return NextResponse.json({ error: 'Missing run' }, { status: 400 });
  const history = await readHistory();
  if (!history[pipelineId]) history[pipelineId] = [];
  history[pipelineId].push(run);
  await writeHistory(history);
  return NextResponse.json({ success: true });
}
