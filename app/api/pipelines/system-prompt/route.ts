import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROMPT_FILE = path.join(process.cwd(), 'data', 'system-prompt.json');

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt } = await request.json();
    if (typeof systemPrompt !== 'string') {
      return NextResponse.json({ error: 'Invalid systemPrompt' }, { status: 400 });
    }
    fs.writeFileSync(PROMPT_FILE, JSON.stringify({ systemPrompt }, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save system prompt' }, { status: 500 });
  }
}

export async function GET() {
  try {
    let systemPrompt = '';
    if (fs.existsSync(PROMPT_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROMPT_FILE, 'utf-8'));
      systemPrompt = data.systemPrompt || '';
    }
    return NextResponse.json({ systemPrompt });
  } catch (error) {
    return NextResponse.json({ systemPrompt: '' });
  }
} 