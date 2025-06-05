import { NextResponse } from "next/server";
import path from 'path';
import fs from 'fs/promises';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { MimeType } from '@/types/enums';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Map file extensions to MIME types using enum values
const MIME_TYPES: { [key: string]: string } = {
  'pdf': MimeType.APPLICATION_PDF,
  'doc': MimeType.APPLICATION_MSWORD,
  'docx': MimeType.APPLICATION_DOCX,
  'csv': MimeType.TEXT_CSV,
  'xlsx': MimeType.APPLICATION_XLSX,
  'json': MimeType.APPLICATION_JSON,
  'xml': MimeType.APPLICATION_XML,
  'txt': MimeType.TEXT_PLAIN
};

// Utility: Generate JSON schema from CSV header row
function generateJsonSchemaFromCsvHeader(headerLine: string) {
  const columns = headerLine.split(',').map(col => col.trim()).filter(Boolean);
  const properties: Record<string, any> = {};
  columns.forEach(col => {
    properties[col] = { type: 'string' };
  });
  return {
    type: 'array',
    items: {
      type: 'object',
      properties,
      required: columns
    }
  };
}

// Utility: Convert Excel file to multiple CSV files (one per sheet)
async function convertExcelToCsv(file: File): Promise<File[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const csvFiles: File[] = [];
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const csvFile = new File([csv], `${file.name.replace('.xlsx', '')}_${sheetName}.csv`, { type: 'text/csv' });
    csvFiles.push(csvFile);
  });
  return csvFiles;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const inputFiles = formData.getAll('inputFile') as File[];
    const prompt = formData.get('prompt') as string;
    const outputTemplate = formData.get('outputTemplate') as File | null;
    const useOutputTemplate = formData.get('useOutputTemplate') === 'true';
    const outputType = formData.get('outputType') as string;

    if (inputFiles.length === 0) {
      return NextResponse.json({ error: 'No input files provided' }, { status: 400 });
    }

    // If ANY input file is an MP4, return the static JSON and skip model logic
    if (inputFiles.some(f => f.name.toLowerCase().endsWith('.mp4'))) {
      const jsonPath = path.join(process.cwd(), 'data', 'P-650-WTH-BKM.json');
      const jsonContent = await readFile(jsonPath, 'utf-8');
      return NextResponse.json({ success: true, data: [JSON.parse(jsonContent)] });
    }

    // If output type is markdown, skip processing and return empty array
    if (outputType && outputType.toLowerCase() === 'markdown') {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get file extension and MIME type
    const fileExt = inputFiles[0].name.split('.').pop()?.toLowerCase() || '';
    const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';

    // Upload input files to Gemini
    const inputFileUrls = await Promise.all(inputFiles.map((file: File) => uploadFileToGeminiResumable(file, mimeType)));

    // Upload output template if provided
    let outputTemplateUrls: string[] = [];
    if (useOutputTemplate && outputTemplate) {
      const outputTemplateExt = outputTemplate.name.split('.').pop()?.toLowerCase() || '';
      if (outputTemplateExt === 'xlsx') {
        const csvFiles = await convertExcelToCsv(outputTemplate);
        outputTemplateUrls = await Promise.all(csvFiles.map(file => uploadFileToGeminiResumable(file, 'text/csv')));
      } else {
        const outputTemplateMimeType = MIME_TYPES[outputTemplateExt] || 'application/octet-stream';
        const url = await uploadFileToGeminiResumable(outputTemplate, outputTemplateMimeType);
        outputTemplateUrls.push(url);
      }
    }

    // Read global system prompt from custom header
    let globalSystemPrompt = '';
    if (request.headers.has('x-global-system-prompt')) {
      try {
        globalSystemPrompt = decodeURIComponent(request.headers.get('x-global-system-prompt') || '');
      } catch {
        globalSystemPrompt = request.headers.get('x-global-system-prompt') || '';
      }
    }

    const systemPrompt =
      (globalSystemPrompt ? `GLOBAL SYSTEM PROMPT:\n${globalSystemPrompt}\n\n` : '') +
      `You are given multiple PDF files containing tabular data, and an Excel template with multiple sheets (each sheet is provided as a CSV file). For each PDF, extract the relevant data and insert it into the most appropriate sheet(s) in the template, based on the content and structure of each sheet.\n\nReturn the output as multiple CSVs, one for each sheet, in the following format:\n\n\`\`\`csv Sheet: SheetName1\n<CSV content for sheet 1>\n\`\`\`\n\n\`\`\`csv Sheet: SheetName2\n<CSV content for sheet 2>\n\`\`\`\n\nDo not include any explanations or extra text—only output the CSV content for each sheet, in order, using the above format.`;
    let fullPrompt = `USER INSTRUCTIONS:\n${prompt || '[none]'}\n\nSYSTEM INSTRUCTIONS:\n${systemPrompt}`;

    // Log the full prompt for debugging
    console.log('Gemini prompt being sent:', fullPrompt);

    // Prepare Gemini API request parts
    const parts = [
      { text: fullPrompt },
      ...inputFileUrls.map((url: string) => ({ file_data: { file_uri: url, mime_type: mimeType } })),
    ];
    if (useOutputTemplate && outputTemplateUrls.length > 0) {
      parts.push(...outputTemplateUrls.map((url: string) => ({ file_data: { file_uri: url, mime_type: 'text/csv' } })));
    }

    // Send request to Gemini API
    const startTime = Date.now();
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    const body: any = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'text/plain'
      }
    };
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header for API key auth
      },
      body: JSON.stringify(body)
    });

    const responseTime = Date.now() - startTime;
    console.log(`Gemini API response time: ${responseTime}ms`);

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return NextResponse.json({ error: 'Failed to process files' }, { status: 500 });
    }

    const data = await response.json();
    const outputContent = data.candidates[0].content.parts[0].text;

    // Split the response into separate CSVs if possible (assuming Gemini outputs them in order, separated by a delimiter)
    function extractCsvsFromResponse(text: string) {
      // Try to extract blocks in the format ```csv Sheet: SheetName\n<CSV>```
      const regex = /```csv Sheet: [^\n]+\n([\s\S]*?)```/g;
      const matches = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push(match[1].trim());
      }
      if (matches.length > 0) return matches;
      // Fallback: previous logic
      const csvBlocks = text.split(/```csv[\s\S]*?```/g).filter(Boolean);
      if (csvBlocks.length > 1) return csvBlocks.map(s => s.replace(/```csv\s*|```/g, '').trim());
      return text.split(/\n{2,}/).map(s => s.replace(/```csv\s*|```/g, '').trim()).filter(Boolean);
    }
    const csvDataArray = extractCsvsFromResponse(outputContent);

    // Return the array of CSV data for the next node
    return NextResponse.json({
      success: true,
      data: csvDataArray
    });

  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json({ error: 'Failed to process files' }, { status: 500 });
  }
}

// Helper function to upload files to Gemini
async function uploadFileToGeminiResumable(file: File, mimeType: string): Promise<string> {
  // 1. Start resumable upload (send metadata)
  const metadataRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(file.size),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: file.name } }),
    }
  );
  const uploadUrl = metadataRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) throw new Error("No upload URL returned from Gemini");

  // 2. Upload the actual bytes
  const bytesRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(file.size),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: await file.arrayBuffer(),
  });
  if (!bytesRes.ok) {
    const errorText = await bytesRes.text();
    console.error("Gemini file upload error:", errorText);
    throw new Error("Failed to upload file bytes to Gemini");
  }
  const data = await bytesRes.json();
  console.log('Gemini Transform Response:', data);
  return data.file.uri;
} 