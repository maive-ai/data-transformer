import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: Request) {
  const formData = await request.formData();
  const nodeId = formData.get('nodeId') as string;
  const type = formData.get('type') as string;
  const file = formData.get('file') as File;
  if (!nodeId || !type || !file) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const timestamp = Date.now();
  const fileName = `${nodeId}-${timestamp}-${type}-${file.name}`;
  const tracesDir = path.join(process.cwd(), 'public', 'traces');
  await fs.mkdir(tracesDir, { recursive: true });
  const filePath = path.join(tracesDir, fileName);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  return NextResponse.json({ success: true, path: `/traces/${fileName}` });
} 