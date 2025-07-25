import { NextResponse } from "next/server";
import path from 'path';
import fs from 'fs/promises';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { MimeType } from '@/types/enums';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Helper function to escape CSV values
function escapeCsvValue(val: any): string {
  if (val == null) return '';
  const strVal = String(val);
  if (typeof val === 'string') {
    // Escape quotes and commas
    return '"' + strVal.replace(/"/g, '""') + '"';
  }
  return strVal;
}

// Helper function to convert JSON array to CSV string
function jsonArrayToCsv(jsonArray: any[]): string {
  if (!Array.isArray(jsonArray) || jsonArray.length === 0) return '';
  
  const headers = Object.keys(jsonArray[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of jsonArray) {
    csvRows.push(headers.map(h => escapeCsvValue(row[h])).join(','));
  }
  
  return csvRows.join('\n');
}

// Helper function to process new structure with title and data
function processNewStructure(json: any[], jsonBlockIndex: number): Array<{ title: string; csvContent: string }> {
  return json.map((item: any) => {
    if (item.title && Array.isArray(item.data) && item.data.length > 0) {
      // Convert title to string if object
      const titleValue = typeof item.title === 'object'
        ? Object.entries(item.title).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' | ')
        : String(item.title);
      const csvContent = jsonArrayToCsv(item.data);
      return { title: titleValue, csvContent };
    }
    return null;
  }).filter((item): item is { title: string; csvContent: string } => item !== null);
}

// Helper function to process single object with title and data
function processSingleObjectWithTitle(json: any, jsonBlockIndex: number): Array<{ title: string; csvContent: string }> {
  // Convert title (which may be an object) to a readable string
  const titleValue = typeof json.title === 'object'
    ? Object.entries(json.title).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' | ')
    : String(json.title);
  console.log(`🔍 [GEMINI] Entering processSingleObjectWithTitle for block ${jsonBlockIndex}. Title: ${titleValue}, data length: ${json.data.length}`);
  const csvContent = jsonArrayToCsv(json.data);
  console.log(`🔍 [GEMINI] jsonArrayToCsv returned content length: ${csvContent.length}`);
  return [{
    title: titleValue,
    csvContent
  }];
}

// Helper function to process old structure (array of objects without title)
function processOldStructure(json: any[], jsonBlockIndex: number): Array<{ title: string; csvContent: string }> {
  console.log(`🔍 [GEMINI] Entering processOldStructure for block ${jsonBlockIndex}. Input JSON (first item):`, JSON.stringify(json[0], null, 2));
  if (json.length > 0) {
    const csvContent = jsonArrayToCsv(json);
    console.log(`🔍 [GEMINI] jsonArrayToCsv returned content length: ${csvContent.length}`);
    return [{
      title: `CSV Output ${jsonBlockIndex + 1}`,
      csvContent: csvContent
    }];
  }
  console.warn(`⚠️ [GEMINI] Old structure format array was empty:`, { json });
  return [];
}

function findNextJsonObject(text: string, startIndex: number): { jsonString: string; nextIndex: number } | null {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let jsonEndIndex = -1;

  // Find the actual start of a JSON object or array from the startIndex
  let currentJsonStartIndex = -1;
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (char === '{' || char === '[') {
      currentJsonStartIndex = i;
      break;
    } else if (!/\s/.test(char)) {
      // If it's not whitespace and not an opening brace/bracket, it's invalid start
      return null;
    }
  }

  if (currentJsonStartIndex === -1) {
    return null; // No JSON object/array found from startIndex
  }

  for (let i = currentJsonStartIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;

      // If we've closed all braces and brackets, we've found the end of JSON
      if (braceCount === 0 && bracketCount === 0 && (char === '}' || char === ']')) {
        jsonEndIndex = i + 1;
        break;
      }
    }
  }

  if (jsonEndIndex > 0) {
    return {
      jsonString: text.substring(currentJsonStartIndex, jsonEndIndex),
      nextIndex: jsonEndIndex,
    };
  } else {
    return null; // Could not find a complete JSON object
  }
}

// Helper function to extract JSON blocks from text
function extractJsonBlocks(text: string): string[] {
  const jsonBlockRegex = /```json\s*([\s\S]*?)(?:```|<debug_info>)/g;
  const allExtractedJsonStrings: string[] = [];
  let jsonMatch;
  
  while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
    let currentContent = jsonMatch[1].trim();
    console.log(`🔍 [GEMINI] Found potential JSON block content (first 200 chars): ${currentContent.substring(0, 200) + (currentContent.length > 200 ? '...' : '')}`);
    currentContent = currentContent.replace(/<debug_info>[\s\S]*$/g, '').trim();
    
    let remainingContent = currentContent;
    let currentIndex = 0;

    while (currentIndex < remainingContent.length) {
      const result = findNextJsonObject(remainingContent, currentIndex);
      if (result) {
        allExtractedJsonStrings.push(result.jsonString);
        console.log(`🔍 [GEMINI] Extracted JSON object (length: ${result.jsonString.length}, starts at: ${currentIndex}, preview: ${result.jsonString.substring(0, 100) + (result.jsonString.length > 100 ? '...' : '')})`);
        currentIndex = result.nextIndex; // Move to the end of the found JSON
      } else {
        // No more JSON objects found or invalid syntax at current position
        if (currentIndex === 0) {
          console.warn("⚠️ [GEMINI] No valid JSON object found in extracted block or block is malformed.");
        }
        break;
      }
    }
  }
  console.log(`🔍 [GEMINI] Total JSON blocks extracted by extractJsonBlocks: ${allExtractedJsonStrings.length}`);
  return allExtractedJsonStrings;
}

// Helper function to process JSON blocks
function processJsonBlocks(jsonBlocks: string[]): Array<{ title: string; csvContent: string }> {
  console.log(`🔍 [GEMINI] Entering processJsonBlocks. Found ${jsonBlocks.length} blocks.`);
  return jsonBlocks.map((jsonStr, index) => {
    try {
      console.log(`🔍 [GEMINI] Attempting to parse JSON block ${index + 1}:`, { 
        length: jsonStr.length, 
        preview: jsonStr.substring(0, 100), 
        trimmed: jsonStr.trim().substring(0, 200) 
      });
      const json = JSON.parse(jsonStr);
      console.log(`🔍 [GEMINI] Successfully parsed JSON block ${index + 1}. Is Array: ${Array.isArray(json)}, Has title: ${json?.title}, Has data: ${json?.data}`);
      
      // Handle array of objects
      if (Array.isArray(json) && json.length > 0) {
        // Check if this is the new structure with title and data
        if (typeof json[0] === 'object' && json[0].title && json[0].data) {
          console.log(`🔍 [GEMINI] Detected new structure (array of objects with title/data).`);
          return processNewStructure(json, index);
        } else if (typeof json[0] === 'object') {
          console.log(`🔍 [GEMINI] Detected old structure (array of objects without title).`);
          return processOldStructure(json, index);
        }
      }
      // Handle single object with title and data
      else if (typeof json === 'object' && json !== null && json.title && Array.isArray(json.data)) {
        console.log(`🔍 [GEMINI] Detected single object with title/data.`);
        return processSingleObjectWithTitle(json, index);
      }
      console.warn(`⚠️ [GEMINI] JSON block ${index + 1} did not match any known structure for CSV conversion.`, { json });
    } catch (error) {
      console.error(`❌ [GEMINI] Error parsing JSON block ${index + 1}:`, error);
    }
    return null;
  }).filter((item): item is Array<{ title: string; csvContent: string }> => item !== null).flat();
}

// Helper function to extract CSV blocks with titles
function extractCsvBlocksWithTitles(text: string): Array<{ title: string; csvContent: string }> {
  const regex = /```csv Sheet: ([^\n]+)\n([\s\S]*?)```/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      title: match[1].trim(),
      csvContent: match[2].trim()
    });
  }
  
  return matches;
}

// Helper function to extract fallback CSV blocks
function extractFallbackCsvBlocks(text: string): Array<{ title: string; csvContent: string }> {
  const csvBlocks = text.split(/```csv[\s\S]*?```/g).filter(Boolean);
  
  if (csvBlocks.length > 1) {
    return csvBlocks.map((s, index) => ({
      title: `CSV Output ${index + 1}`,
      csvContent: s.replace(/```csv\s*|```/g, '').trim()
    }));
  }
  
  return [{
    title: 'CSV Output',
    csvContent: text.split(/\n{2,}/).map(s => s.replace(/```csv\s*|```/g, '').trim()).filter(Boolean).join('\n\n')
  }];
}

// Main function to extract CSVs from response
function processGeminiTextOutput(text: string, requestedOutputType: string): { processedData: any[]; debugInfo: string | null } {
  const jsonBlocks = extractJsonBlocks(text);
  const debugInfo = extractDebugInfo(text);

  if (requestedOutputType.toLowerCase() === 'json' && jsonBlocks.length > 0) {
    // If outputType is 'json' (e.g., for segmentation), return the parsed JSON directly
    console.log("🔍 [GEMINI] Requested JSON output, returning parsed JSON blocks directly.");
    const parsedJsons = jsonBlocks.map(jsonStr => {
      try {
        return JSON.parse(jsonStr);
      } catch (error) {
        console.error(`❌ [GEMINI] Error parsing JSON block for raw output:`, error);
        return null;
      }
    }).filter(item => item !== null);
    return { processedData: parsedJsons, debugInfo };
  }
  
  // If output type is CSV, but the model returned JSON, convert JSON to CSV
  if (requestedOutputType && requestedOutputType.toLowerCase() === 'csv') {
    if (jsonBlocks.length > 0) {
        console.log("🔍 [GEMINI] Detected JSON blocks for CSV output, attempting to process as CSV.");
        const processed = processJsonBlocks(jsonBlocks);
        if (processed.length > 0) return { processedData: processed, debugInfo };
    }
  }
  
  // Try to extract blocks in the format ```csv Sheet: SheetName\n<CSV>```
  const csvBlocksWithTitles = extractCsvBlocksWithTitles(text);
  if (csvBlocksWithTitles.length > 0) {
    console.log("🔍 [GEMINI] Detected CSV blocks with titles.");
    return { processedData: csvBlocksWithTitles, debugInfo };
  }
  
  // Fallback: extract any CSV blocks
  console.log("🔍 [GEMINI] Falling back to generic CSV block extraction.");
  const fallbackCsv = extractFallbackCsvBlocks(text);
  return { processedData: fallbackCsv, debugInfo };
}

// Helper function to extract debug information from Gemini response
function extractDebugInfo(text: string): string | null {
  // Extract content between <debug_info> and </debug_info>
  const debugRegex = /<debug_info>([\s\S]*?)<\/debug_info>/i;
  const debugMatch = text.match(debugRegex);
  return debugMatch ? debugMatch[1].trim() : null;
}

// Helper function to make Gemini API call and extract basic results
async function callGeminiAndExtractResults(parts: any[]) {
  console.log('📡 [GEMINI] Calling Gemini API with parts:', {
    textParts: parts.filter(p => p.text).length,
    fileParts: parts.filter(p => p.file_data).length,
    totalParts: parts.length
  });

  const startTime = Date.now();
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body: any = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'text/plain',
      temperature: 0.0,
      thinkingConfig: {
        thinkingBudget: 8000
      }
    },
  };
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const responseTime = Date.now() - startTime;
  console.log(`⏱️ [GEMINI] Gemini API response time: ${responseTime}ms`);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ [GEMINI] Gemini API error:', error);
    throw new Error(`Failed to process files with Gemini: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('🧾 [GEMINI] Full Gemini API response (raw data):', JSON.stringify(data, null, 2));
  const outputContent = data.candidates[0].content.parts[0].text;

  console.log('📄 [GEMINI] Received response from Gemini API (output content preview):', {
    outputContentLength: outputContent.length,
    outputContentPreview: outputContent.substring(0, 200) + (outputContent.length > 200 ? '...' : '')
  });

  return {
    outputContent,
    debugInfo: extractDebugInfo(outputContent),
    rawResponse: data
  };
}

// Map file extensions to MIME types using enum values
const MIME_TYPES: { [key: string]: string } = {
  'pdf': MimeType.APPLICATION_PDF,
  'doc': MimeType.APPLICATION_MSWORD,
  'docx': MimeType.APPLICATION_DOCX,
  'csv': MimeType.TEXT_CSV,
  'xlsx': MimeType.APPLICATION_XLSX,
  'xls': MimeType.APPLICATION_XLS,
  'json': MimeType.APPLICATION_JSON,
  'xml': MimeType.APPLICATION_XML,
  'txt': MimeType.TEXT_PLAIN,
  'png': MimeType.IMAGE_PNG,
  'jpg': MimeType.IMAGE_JPEG,
  'jpeg': MimeType.IMAGE_JPEG
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

async function handleInitialRequest(request: Request) {
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
    return { response: NextResponse.json({ error: 'No input files provided' }, { status: 400 }) };
  }

  // If ANY input file is an MP4, return the static JSON and skip model logic
  if (inputFiles.some(f => f.name.toLowerCase().endsWith('.mp4'))) {
    console.log('⏭️ [GEMINI] MP4 file detected, using hardcoded JSON bypass');
    const jsonPath = path.join(process.cwd(), 'data', 'P-650-WTH-BKM.json');
    const jsonContent = await readFile(jsonPath, 'utf-8');
    console.log('✅ [GEMINI] Returning hardcoded JSON for MP4 input');
    return { response: NextResponse.json({ success: true, data: [JSON.parse(jsonContent)] }) };
  }

  // If output type is markdown, skip processing and return empty array
  if (outputType && outputType.toLowerCase() === 'markdown') {
    console.log('⏭️ [GEMINI] Markdown output type detected, skipping processing');
    return { response: NextResponse.json({ success: true, data: [] }) };
  }

  return { inputFiles, prompt, outputTemplate, useOutputTemplate, outputType };
}

async function processInputFilesAndUpload(inputFiles: File[]) {
  const jsonFiles: string[] = [];
  const nonJsonFiles: File[] = [];

  for (const file of inputFiles) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json' || file.type === 'application/json') {
      const jsonContent = await file.text();
      jsonFiles.push(jsonContent);
      console.log(`📄 [GEMINI] JSON file detected: ${file.name}, content length: ${jsonContent.length}`);
    } else {
      nonJsonFiles.push(file);
    }
  }

  console.log('📤 [GEMINI] File processing summary:', {
    jsonFilesCount: jsonFiles.length,
    nonJsonFilesCount: nonJsonFiles.length,
    nonJsonFileNames: nonJsonFiles.map(f => f.name)
  });

  const inputFileUrls = nonJsonFiles.length > 0 
    ? await Promise.all(nonJsonFiles.map((file: File) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';
        return uploadFileToGeminiResumable(file, mimeType);
      }))
    : [];

  console.log('✅ [GEMINI] Input files uploaded successfully:', {
    inputFileUrlsCount: inputFileUrls.length
  });

  return { jsonFiles, inputFileUrls };
}

async function processOutputTemplate(outputTemplate: File | null, useOutputTemplate: boolean) {
  let outputTemplateUrls: string[] = [];
  let schemaText = '';
  let shouldUploadTemplate = false;

  if (useOutputTemplate && outputTemplate) {
    const outputTemplateExt = outputTemplate.name.split('.').pop()?.toLowerCase() || '';
    if (outputTemplateExt === 'xlsx') {
      const csvFiles = await convertExcelToCsv(outputTemplate);
      outputTemplateUrls = await Promise.all(csvFiles.map(file => uploadFileToGeminiResumable(file, 'text/csv')));
      shouldUploadTemplate = true;
    } else if (outputTemplateExt !== 'csv') {
      const outputTemplateMimeType = MIME_TYPES[outputTemplateExt] || 'application/octet-stream';
      const url = await uploadFileToGeminiResumable(outputTemplate, outputTemplateMimeType);
      outputTemplateUrls.push(url);
      shouldUploadTemplate = true;
    } else if (outputTemplateExt === 'csv') {
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
  }
  return { outputTemplateUrls, schemaText, shouldUploadTemplate };
}

function buildGeminiPrompt(prompt: string, schemaText: string, requestHeaders: Headers) {
  let globalSystemPrompt = '';
  if (requestHeaders.has('x-global-system-prompt')) {
    try {
      globalSystemPrompt = decodeURIComponent(requestHeaders.get('x-global-system-prompt') || '');
    } catch {
      globalSystemPrompt = requestHeaders.get('x-global-system-prompt') || '';
    }
  }

  const baseSystemInstructions = globalSystemPrompt ? `GLOBAL SYSTEM PROMPT:\n${globalSystemPrompt}\n\n` : '';
  return `\n\nSYSTEM INSTRUCTIONS:\n${baseSystemInstructions}\n\n${schemaText}\n\nUSER INSTRUCTIONS:\n${prompt || '[none]'}`;
}

export async function POST(request: Request) {
  try {
    console.log('🔍 [GEMINI] API route called');
    
    const { response, inputFiles, prompt, outputTemplate, useOutputTemplate, outputType } = await handleInitialRequest(request);
    if (response) { return response; }

    console.log('🚀 [GEMINI] Starting actual Gemini API processing');

    const { jsonFiles, inputFileUrls } = await processInputFilesAndUpload(inputFiles);
    const { outputTemplateUrls, schemaText, shouldUploadTemplate } = await processOutputTemplate(outputTemplate, useOutputTemplate);
    const basePrompt = buildGeminiPrompt(prompt, schemaText, request.headers);

    const allCsvDataResults: Array<{ title: string; csvContent: string }> = [];
    const allDebugInfo: string[] = [];
    let lastRawGeminiResponse: any = null;

    if (jsonFiles.length > 0) {
      console.log(`🔄 [GEMINI] Processing ${jsonFiles.length} JSON input file(s) individually.`);
      for (const jsonContent of jsonFiles) {
        const currentFullPrompt = `JSON Data:\n--- JSON File ---\n${jsonContent}\n` + basePrompt;

        const currentParts = [
          { text: currentFullPrompt },
          ...inputFileUrls.map((url: string, index: number) => {
            const file = inputFiles[index]; // Use original inputFiles for mimeType
            const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
            const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';
            return { file_data: { file_uri: url, mime_type: mimeType } };
          }),
        ];
        if (shouldUploadTemplate && outputTemplateUrls.length > 0) {
          currentParts.push(...outputTemplateUrls.map((url: string) => ({ file_data: { file_uri: url, mime_type: 'text/csv' } })));
        }

        try {
          const { outputContent, debugInfo, rawResponse } = await callGeminiAndExtractResults(currentParts);
          const { processedData, debugInfo: currentDebugInfo } = processGeminiTextOutput(outputContent, outputType);
          allCsvDataResults.push(...processedData);
          if (currentDebugInfo) allDebugInfo.push(currentDebugInfo);
          lastRawGeminiResponse = rawResponse;
        } catch (error) {
          console.error(`❌ [GEMINI] Error processing one JSON file:`, error);
        }
      }
    } else {
      console.log(`🚀 [GEMINI] No JSON input files. Sending single combined request.`);
      const parts = [
        { text: basePrompt },
        ...inputFileUrls.map((url: string, index: number) => {
          const file = inputFiles[index]; // Use original inputFiles for mimeType
          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          const mimeType = MIME_TYPES[fileExt] || 'application/octet-stream';
          return { file_data: { file_uri: url, mime_type: mimeType } };
        }),
      ];
      if (shouldUploadTemplate && outputTemplateUrls.length > 0) {
        parts.push(...outputTemplateUrls.map((url: string) => ({ file_data: { file_uri: url, mime_type: 'text/csv' } })));
      }

      try {
        const { outputContent, debugInfo, rawResponse } = await callGeminiAndExtractResults(parts);
        const { processedData, debugInfo: currentDebugInfo } = processGeminiTextOutput(outputContent, outputType);
        allCsvDataResults.push(...processedData);
        if (currentDebugInfo) allDebugInfo.push(currentDebugInfo);
        lastRawGeminiResponse = rawResponse;
      } catch (error) {
        console.error(`❌ [GEMINI] Error processing single combined request:`, error);
      }
    }

    console.log('✅ [GEMINI] Processing completed successfully:', {
      outputDataArrayLength: allCsvDataResults.length,
      outputDataArrayTypes: allCsvDataResults.map((item: any) => {
        if (typeof item === 'string') {
          return item.startsWith('```csv Sheet:') ? 'csv' : 'text';
        } else if (item && typeof item === 'object' && item.title) {
          return 'csv-with-title';
        }
        return 'unknown';
      }),
      hasDebugInfo: allDebugInfo.length > 0
    });

    return NextResponse.json({
      success: true,
      data: allCsvDataResults,
      debugInfo: allDebugInfo.length > 0 ? allDebugInfo.join('\n\n') : null,
      rawGeminiResponse: lastRawGeminiResponse
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