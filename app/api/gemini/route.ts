import { NextResponse } from "next/server";
import path from 'path';
import fs from 'fs/promises';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Map file extensions to MIME types
const MIME_TYPES: { [key: string]: string } = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'csv': 'text/csv',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'json': 'application/json',
  'xml': 'application/xml',
  'txt': 'text/plain'
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const inputFile = formData.get('inputFile') as File;
    const prompt = formData.get('prompt') as string;
    const outputTemplate = formData.get('outputTemplate') as File | null;
    const useOutputTemplate = formData.get('useOutputTemplate') === 'true';

    if (!inputFile) {
      return NextResponse.json({ error: 'No input file provided' }, { status: 400 });
    }

    // Get file extension and MIME type
    const fileExt = inputFile.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';

    // Upload input file to Gemini
    const inputFileUrl = await uploadFileToGeminiResumable(inputFile, mimeType);

    // Upload output template if provided
    let outputTemplateUrl = null;
    if (useOutputTemplate && outputTemplate) {
      const outputTemplateExt = outputTemplate.name.split('.').pop()?.toLowerCase() || '';
      const outputTemplateMimeType = MIME_TYPES[outputTemplateExt] || 'application/octet-stream';
      outputTemplateUrl = await uploadFileToGeminiResumable(outputTemplate, outputTemplateMimeType);
    }

    // Compose the prompt with file references
    let fullPrompt = prompt || "Please process this file and extract the data.";
    if (useOutputTemplate && outputTemplateUrl) {
      fullPrompt += `\n\nTake the attached output template file and insert the extracted data into the appropriate columns. Return the entire template, with the new data inserted, as a CSV file. Do not add any explanations or extra text. Only output the CSV file contents.`;
    }

    // Log the full prompt for debugging
    console.log('Gemini prompt being sent:', fullPrompt);

    // Prepare Gemini API request parts
    const parts = [
      { text: fullPrompt },
      { file_data: { file_uri: inputFileUrl, mime_type: mimeType } }
    ];
    if (useOutputTemplate && outputTemplate && outputTemplateUrl) {
      const outputTemplateExt = outputTemplate.name.split('.').pop()?.toLowerCase() || '';
      const outputTemplateMimeType = MIME_TYPES[outputTemplateExt] || 'application/octet-stream';
      parts.push({ file_data: { file_uri: outputTemplateUrl, mime_type: outputTemplateMimeType } });
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
      return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }

    const data = await response.json();
    const outputContent = data.candidates[0].content.parts[0].text;

    // Extract CSV from markdown code block if present
    function extractCsvFromMarkdown(text: string) {
      return text.replace(/```csv\s*|```/g, '').trim();
    }
    const csv = extractCsvFromMarkdown(outputContent);

    // Return only the CSV data for the next node
    return NextResponse.json({
      success: true,
      data: csv
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
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