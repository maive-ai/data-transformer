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
    console.log('🔍 [GEMINI] API route called');
    
    const formData = await request.formData();
    const inputFiles = formData.getAll('inputFile') as File[];
    const prompt = formData.get('prompt') as string;
    const outputTemplate = formData.get('outputTemplate') as File | null;
    const useOutputTemplate = formData.get('useOutputTemplate') === 'true';
    const outputType = formData.get('outputType') as string;

    console.log('📋 [GEMINI] Request details:', {
      inputFilesCount: inputFiles.length,
      inputFileNames: inputFiles.map(f => f.name),
      prompt: prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
      useOutputTemplate,
      outputType,
      hasOutputTemplate: !!outputTemplate
    });

    if (inputFiles.length === 0) {
      console.log('❌ [GEMINI] No input files provided');
      return NextResponse.json({ error: 'No input files provided' }, { status: 400 });
    }

    // If ANY input file is an MP4, return the static JSON and skip model logic
    if (inputFiles.some(f => f.name.toLowerCase().endsWith('.mp4'))) {
      console.log('⏭️ [GEMINI] MP4 file detected, using hardcoded JSON bypass');
      const jsonPath = path.join(process.cwd(), 'data', 'P-650-WTH-BKM.json');
      const jsonContent = await readFile(jsonPath, 'utf-8');
      console.log('✅ [GEMINI] Returning hardcoded JSON for MP4 input');
      return NextResponse.json({ success: true, data: [JSON.parse(jsonContent)] });
    }

    // If output type is markdown, skip processing and return empty array
    if (outputType && outputType.toLowerCase() === 'markdown') {
      console.log('⏭️ [GEMINI] Markdown output type detected, skipping processing');
      return NextResponse.json({ success: true, data: [] });
    }

    console.log('🚀 [GEMINI] Starting actual Gemini API processing');

    // Separate JSON files from other files
    const jsonFiles: string[] = [];
    const nonJsonFiles: File[] = [];

    for (const file of inputFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json' || file.type === 'application/json') {
        // Read JSON content and add to prompt
        const jsonContent = await file.text();
        jsonFiles.push(jsonContent);
        console.log(`📄 [GEMINI] JSON file detected: ${file.name}, content length: ${jsonContent.length}`);
      } else {
        // Upload as file
        nonJsonFiles.push(file);
      }
    }

    console.log('📤 [GEMINI] File processing summary:', {
      jsonFilesCount: jsonFiles.length,
      nonJsonFilesCount: nonJsonFiles.length,
      nonJsonFileNames: nonJsonFiles.map(f => f.name)
    });

    // Upload non-JSON files to Gemini
    const inputFileUrls = nonJsonFiles.length > 0 
      ? await Promise.all(nonJsonFiles.map((file: File) => {
          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';
          return uploadFileToGeminiResumable(file, mimeType);
        }))
      : [];

    // Upload output template if provided and required (not CSV)
    let outputTemplateUrls: string[] = [];
    let shouldUploadTemplate = false;
    if (useOutputTemplate && outputTemplate) {
      const outputTemplateExt = outputTemplate.name.split('.').pop()?.toLowerCase() || '';
      if (outputTemplateExt === 'xlsx') {
        // For XLSX, upload as before
        const csvFiles = await convertExcelToCsv(outputTemplate);
        outputTemplateUrls = await Promise.all(csvFiles.map(file => uploadFileToGeminiResumable(file, 'text/csv')));
        shouldUploadTemplate = true;
      } else if (outputTemplateExt !== 'csv') {
        // For other types, upload as before
        const outputTemplateMimeType = MIME_TYPES[outputTemplateExt] || 'application/octet-stream';
        const url = await uploadFileToGeminiResumable(outputTemplate, outputTemplateMimeType);
        outputTemplateUrls.push(url);
        shouldUploadTemplate = true;
      }
      // For CSV, do NOT upload as file_data; only use for schema extraction
    }

    console.log('✅ [GEMINI] Input files uploaded successfully:', {
      inputFileUrlsCount: inputFileUrls.length
    });

    // Read global system prompt from custom header
    let globalSystemPrompt = '';
    if (request.headers.has('x-global-system-prompt')) {
      try {
        globalSystemPrompt = decodeURIComponent(request.headers.get('x-global-system-prompt') || '');
      } catch {
        globalSystemPrompt = request.headers.get('x-global-system-prompt') || '';
      }
    }

    let schemaText = '';
    if (useOutputTemplate && outputTemplate && outputTemplate.name.toLowerCase().endsWith('.csv')) {
      // Read the CSV template and convert to JSON schema
      const csvText = await outputTemplate.text();
      const lines = csvText.split(/\r?\n/).filter(Boolean);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        // Build a pseudo-code schema string
        schemaText = '\n\nProduce JSON matching this specification:';
        schemaText += `\nRow = { ${headers.map(h => `\"${h}\": string`).join(', ')} }`;
        schemaText += '\nReturn: array<Row>';
      }
    }

    const systemPrompt =
      (globalSystemPrompt ? `GLOBAL SYSTEM PROMPT:\n${globalSystemPrompt}\n\n` : '')

    // Build the prompt with JSON data first
    let fullPrompt = '';
    
    // Add JSON content first if any
    if (jsonFiles.length > 0) {
      fullPrompt += 'JSON Data:\n';
      jsonFiles.forEach((jsonContent, index) => {
        fullPrompt += `\n--- JSON File ${index + 1} ---\n${jsonContent}\n`;
      });
      fullPrompt += '\n';
    }
    
    fullPrompt += `USER INSTRUCTIONS:\n${prompt || '[none]'}${schemaText}\n\nSYSTEM INSTRUCTIONS:\n${systemPrompt}`;

    console.log('📝 [GEMINI] Prepared prompt for Gemini API:', {
      promptLength: fullPrompt.length,
      hasGlobalSystemPrompt: !!globalSystemPrompt,
      userPromptLength: prompt?.length || 0
    });

    // Log the full prompt for debugging
    console.log('Gemini prompt being sent:', fullPrompt);

    // Prepare Gemini API request parts
    const parts = [
      { text: fullPrompt },
      ...inputFileUrls.map((url: string, index: number) => {
        const file = nonJsonFiles[index];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';
        return { file_data: { file_uri: url, mime_type: mimeType } };
      }),
    ];
    if (shouldUploadTemplate && outputTemplateUrls.length > 0) {
      parts.push(...outputTemplateUrls.map((url: string) => ({ file_data: { file_uri: url, mime_type: 'text/csv' } })));
    }

    console.log('📡 [GEMINI] Calling Gemini API with parts:', {
      textParts: 1,
      fileParts: inputFileUrls.length + outputTemplateUrls.length,
      totalParts: parts.length
    });

    // Send request to Gemini API
    const startTime = Date.now();
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
    console.log(`⏱️ [GEMINI] Gemini API response time: ${responseTime}ms`);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [GEMINI] Gemini API error:', error);
      return NextResponse.json({ error: 'Failed to process files' }, { status: 500 });
    }

    const data = await response.json();
    console.log('🧾 [GEMINI] Full Gemini API response:', JSON.stringify(data, null, 2));
    const outputContent = data.candidates[0].content.parts[0].text;

    console.log('📄 [GEMINI] Received response from Gemini API:', {
      outputContentLength: outputContent.length,
      outputContentPreview: outputContent.substring(0, 200) + (outputContent.length > 200 ? '...' : '')
    });

    // Split the response into separate CSVs if possible (assuming Gemini outputs them in order, separated by a delimiter)
    function extractCsvsFromResponse(text: string) {
      // If output type is CSV, but the model returned JSON, convert JSON to CSV
      if (outputType && outputType.toLowerCase() === 'csv') {
        // Look for ```json ... ``` blocks
        const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
        const jsonBlocks = [];
        let jsonMatch;
        while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
          jsonBlocks.push(jsonMatch[1].trim());
        }
        if (jsonBlocks.length > 0) {
          // Convert each JSON block to CSV
          return jsonBlocks.map(jsonStr => {
            try {
              const json = JSON.parse(jsonStr);
              if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
                const headers = Object.keys(json[0]);
                const csvRows = [headers.join(',')];
                for (const row of json) {
                  csvRows.push(headers.map(h => {
                    let val = row[h];
                    if (typeof val === 'string') {
                      // Escape quotes and commas
                      val = '"' + val.replace(/"/g, '""') + '"';
                    } else if (val == null) {
                      val = '';
                    }
                    return val;
                  }).join(','));
                }
                return csvRows.join('\n');
              }
            } catch {}
            return '';
          }).filter(Boolean);
        }
        // Fallback to previous logic if no JSON blocks found
      }
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

    console.log('📝 [GEMINI] Extracted CSV(s):');
    csvDataArray.forEach((item, idx) => {
      if (item.startsWith('```csv Sheet:')) {
        console.log(`--- CSV #${idx + 1} ---\n${item}\n`);
      } else {
        console.log(`--- CSV #${idx + 1} ---\n${item}\n`);
      }
    });

    console.log('✅ [GEMINI] Processing completed successfully:', {
      outputDataArrayLength: csvDataArray.length,
      outputDataArrayTypes: csvDataArray.map(item => item.startsWith('```csv Sheet:') ? 'csv' : 'text')
    });

    // Return the array of CSV data for the next node
    return NextResponse.json({
      success: true,
      data: csvDataArray
    });

  } catch (error) {
    console.error('❌ [GEMINI] Error processing files:', error);
    return NextResponse.json({ error: 'Failed to process files' }, { status: 500 });
  }
}

// Helper function to upload files to Gemini
async function uploadFileToGeminiResumable(file: File, mimeType: string): Promise<string> {
  console.log(`📤 [GEMINI] Starting file upload to Gemini:`, {
    fileName: file.name,
    fileSize: file.size,
    mimeType
  });

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

  console.log(`📤 [GEMINI] Upload URL received for ${file.name}`);

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
    console.error("❌ [GEMINI] File upload error:", errorText);
    throw new Error("Failed to upload file bytes to Gemini");
  }
  const data = await bytesRes.json();
  console.log('✅ [GEMINI] File uploaded successfully:', {
    fileName: file.name,
    fileUri: data.file.uri
  });
  return data.file.uri;
} 