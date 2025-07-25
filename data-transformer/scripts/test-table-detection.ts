#!/usr/bin/env tsx

import { readFileSync, promises as fsPromises } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Removed: dotenv is now loaded via NODE_OPTIONS in package.json script
// import dotenv from 'dotenv';

// Import the upload function from the Gemini API route
import { uploadFileToGeminiResumable, callGeminiAndExtractResults } from '../app/api/gemini/route';
import { MimeType } from '../types/enums';

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('🔬 Starting Gemini API Request Test with Image Chunks...');

  const args = process.argv.slice(2);
  const topDir = args[0]; // Expecting the absolute top_dir from Flask

  if (!topDir) {
    console.error('❌ Error: Please provide the absolute path to the Flask top_dir (e.g., /path/to/image-server/segmentation_outputs/...). ');
    console.error('Usage: npm run test-gemini-upload-chunks -- <absolute/path/to/top_dir>');
    process.exit(1);
  }

  console.log(`🔍 Processing output from Flask top_dir: ${topDir}`);

  const originalPdfPath = join(topDir, 'og_image');
  let originalPdfUrl: string | null = null;
  type ChunkInfo = { uri: string; mimeType: string };
  let allChunkImageInfos: ChunkInfo[] = [];

  try {
    // 1. Find and upload the original PDF
    const ogImageFiles = await fsPromises.readdir(originalPdfPath);
    const pdfFile = ogImageFiles.find(f => f.endsWith('.pdf'));

    if (pdfFile) {
      console.log(`📄 Found original PDF: ${pdfFile}. Uploading to Gemini...`);
      const pdfFilePath = join(originalPdfPath, pdfFile);
      const pdfBuffer = await fsPromises.readFile(pdfFilePath);
      const pdfMimeType = MimeType.APPLICATION_PDF;
      const pdfFileObj = new File([pdfBuffer], pdfFile, { type: pdfMimeType });
      originalPdfUrl = await uploadFileToGeminiResumable(pdfFileObj, pdfMimeType);
      console.log(`✅ Original PDF uploaded. URI: ${originalPdfUrl}`);
    } else {
      console.warn('⚠️ No original PDF found in og_image directory.');
    }

    // 2. Read and upload image chunks from all_table_chunks
    const allTableChunksPath = join(topDir, 'chunk_outputs', 'all_table_chunks');
    console.log(`🔍 Reading image chunks from: ${allTableChunksPath}`);

    const chunkFiles = await fsPromises.readdir(allTableChunksPath);
    const imageFiles = chunkFiles.filter(fileName => 
      fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
    );

    if (imageFiles.length === 0) {
      console.warn('⚠️ No image chunks found in the specified directory.');
    }

    console.log(`🖼️ Found ${imageFiles.length} image chunks to upload.`);

    // Upload all chunks to Gemini, preserving mimeType
    const uploadPromises: Promise<ChunkInfo | null>[] = imageFiles.map(async (fileName) => {
      const filePath = join(allTableChunksPath, fileName);
      const fileBuffer = await fsPromises.readFile(filePath);
      const mimeType = fileName.endsWith('.png') ? MimeType.IMAGE_PNG : MimeType.IMAGE_JPEG;
      const imageFile = new File([fileBuffer], fileName, { type: mimeType });
      console.log(`📤 Uploading chunk ${fileName}...`);
      try {
        const uri = await uploadFileToGeminiResumable(imageFile, mimeType);
        return { uri, mimeType };
      } catch (uploadError) {
        console.error(`❌ Failed to upload chunk ${fileName}:`, uploadError);
        return null;
      }
    });
    allChunkImageInfos = (await Promise.all(uploadPromises)).filter(Boolean) as ChunkInfo[];
    console.log(`✅ Successfully uploaded ${allChunkImageInfos.length} image chunks. Total URIs:`, allChunkImageInfos.length);

    // 3. Construct parts for generateContent API call
    const testPrompt = "Extract all data from the tables found in the images. Provide the data in JSON format, ensuring each table is a separate JSON object with a 'title' and 'data' key.";
    
    // Start with the text prompt
    const parts: any[] = [{ text: testPrompt }];

    // Add original PDF if uploaded
    if (originalPdfUrl) {
      parts.push({ file_data: { file_uri: originalPdfUrl, mime_type: MimeType.APPLICATION_PDF } });
    }

    // Add a subset of image chunks, using their original MIME types
    const numChunksToInclude = 5;
    const chunksToTest = allChunkImageInfos.slice(0, numChunksToInclude);
    chunksToTest.forEach(({ uri, mimeType }) => {
      parts.push({ file_data: { file_uri: uri, mime_type: mimeType } });
    });

    console.log(`
📡 [TEST SCRIPT] Calling Gemini API generateContent with:`);
    console.log(`  Text parts: 1`);
    console.log(`  Original PDF part: ${originalPdfUrl ? '1' : '0'}`);
    console.log(`  Image chunk parts: ${chunksToTest.length}`);
    console.log(`  TOTAL PARTS: ${parts.length}`);

    // Call the Gemini API generateContent function directly
    console.log(`
📡 [TEST SCRIPT] Sending generateContent request...`);
    const { outputContent, debugInfo, rawResponse } = await callGeminiAndExtractResults(parts);

    console.log('\n✅ Gemini API generateContent call completed!');
    console.log('Output Content (preview):', outputContent.substring(0, 500) + (outputContent.length > 500 ? '...' : ''));
    if (debugInfo) {
      console.log('Debug Info:', debugInfo);
    }
    // console.log('Full Raw Response:', JSON.stringify(rawResponse, null, 2));

  } catch (error) {
    console.error('❌ Error during test execution:', error);
  }

  console.log('\n✅ Gemini API Test completed!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
}); 