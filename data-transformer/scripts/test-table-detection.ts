#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { imageSize } from 'image-size';
import sharp from 'sharp';

interface TableDetectionResult {
  table_id?: string; // Optional for segmentation results
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] on a 0-1000 scale
  confidence?: number; // Optional for segmentation results
  box_2d_pixels?: [number, number, number, number]; // [x1, y1, x2, y2] in pixels
  label: string; // Added for segmentation
  mask: string; // Base64 encoded PNG probability map
}

interface GeminiResponsePart {
  text: string;
}

interface GeminiResponseContent {
  parts: GeminiResponsePart[];
}

interface GeminiCandidate {
  content: GeminiResponseContent;
}

interface RawGeminiResponse {
  candidates: GeminiCandidate[];
}

// Helper function to find the next complete JSON object in a string
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
    }

    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      } else if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
      }
    }

    // If both counts are zero and we're not in a string, we've found the end of a top-level JSON object/array
    if (!inString && braceCount === 0 && bracketCount === 0 && (char === '}' || char === ']')) {
      jsonEndIndex = i;
      break;
    }
  }

  if (jsonEndIndex !== -1) {
    const jsonString = text.substring(currentJsonStartIndex, jsonEndIndex + 1);
    return { jsonString, nextIndex: jsonEndIndex + 1 };
  }

  return null;
}

// Helper function to get image dimensions
async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
  const { width, height } = imageSize(imageBuffer);
  if (!width || !height) {
    throw new Error('Could not determine image dimensions.');
  }
  return { width, height };
}

// Helper function to convert normalized bounding box coordinates to pixels
function convertNormalizedBoxToPixels(
  boundingBox: [number, number, number, number], // [ymin, xmin, ymax, xmax] on a 0-1000 scale
  imageWidth: number,
  imageHeight: number
): [number, number, number, number] { // [x1, y1, x2, y2] in pixels
  const [ymin, xmin, ymax, xmax] = boundingBox;

  let x1 = Math.round((xmin / 1000) * imageWidth);
  let y1 = Math.round((ymin / 1000) * imageHeight);
  let x2 = Math.round((xmax / 1000) * imageWidth);
  let y2 = Math.round((ymax / 1000) * imageHeight);

  // Clamp all coordinates to be within image boundaries [0, dimension]
  x1 = Math.max(0, x1);
  y1 = Math.max(0, y1);
  x2 = Math.min(imageWidth, x2);
  y2 = Math.min(imageHeight, y2);

  // Calculate width and height from clamped coordinates
  let width = x2 - x1;
  let height = y2 - y1;

  // Ensure width and height are at least 1 pixel
  if (width <= 0) width = 1;
  if (height <= 0) height = 1;

  // Ensure x2 and y2 are updated based on potentially adjusted width/height
  // but still within image bounds.
  x2 = Math.min(x1 + width, imageWidth);
  y2 = Math.min(y1 + height, imageHeight);
  
  return [x1, y1, x2, y2];
}

const PROMPT = `
  Give the segmentation masks for all tables in the image.
  Output a JSON list of segmentation masks where each entry contains the 2D
  bounding box in the key "box_2d", the segmentation mask in key "mask", and
  the text label in the key "label". Use descriptive labels.
  `;

async function main() {
  console.log('🔬 Testing Table Segmentation with Gemini API...\n');

  // 1. Read the image file
  const imagePath = join(__dirname, '../public/artifacts/58225revB_page1_3072w.png'); // Update this path
  const imageBuffer = readFileSync(imagePath);

  // 2. Prepare FormData for Gemini API
  const formData = new FormData();
  formData.append('inputFile', imageBuffer, {
    filename: 'table_image.png',
    contentType: 'image/png', // Update based on your image type
  });
  formData.append('prompt', PROMPT);
  formData.append('outputType', 'json'); // Request JSON output

  console.log('📤 Uploading image to Gemini API...');
  console.log(`Image path: ${imagePath}`);
  console.log(`Image size: ${imageBuffer.length} bytes`);

  // 3. Call the Gemini API endpoint
  const response = await fetch('http://localhost:3001/api/gemini', {
    method: 'POST',
    body: formData as any,
    headers: (formData as any).getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API request failed:', response.status, errorText);
    return;
  }

  // 4. Process the response
  const result = await response.json() as { success: boolean; data?: TableDetectionResult[]; debugInfo?: string; rawGeminiResponse?: RawGeminiResponse };
  // console.log('\n📄 Raw API Response:', JSON.stringify(result, null, 2));

  let parsedSegmentationData: TableDetectionResult[] = [];

  // Access the raw Gemini response if available and parse it
  if (result.success && Array.isArray(result.data)) {
    parsedSegmentationData = result.data;
  } else if (result.rawGeminiResponse) {
    const candidate = result.rawGeminiResponse.candidates?.[0];
    if (candidate && candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const textContent = candidate.content.parts[0].text;

      // Extract JSON block from the text content
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)(?:```|<debug_info>)/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          // Attempt to parse multiple JSON objects if concatenated
          const rawJsonString = jsonMatch[1].trim();
          let remainingContent = rawJsonString;
          while (remainingContent.length > 0) {
            const found = findNextJsonObject(remainingContent, 0);
            if (found) {
              parsedSegmentationData.push(JSON.parse(found.jsonString));
              remainingContent = remainingContent.substring(found.nextIndex).trim();
            } else {
              break; // No more valid JSON objects found
            }
          }
        } catch (error) {
          console.error('❌ [TEST] Error parsing raw Gemini response JSON:', error);
        }
      }
    }
  }

  // Flatten the array if it contains a single array of results (Gemini often wraps all results in one outer array)
  if (parsedSegmentationData.length === 1 && Array.isArray(parsedSegmentationData[0])) {
    console.log("🔍 [TEST] Flattening single nested array of segmentation results.");
    parsedSegmentationData = parsedSegmentationData[0];
  }
  
  console.log(`
🔍 [TEST] Number of segmentation results to process: ${parsedSegmentationData.length}`);
  if (parsedSegmentationData.length === 0) {
    console.warn('⚠️ [TEST] No segmentation data parsed. Please check Gemini API response and parsing logic.');
  }

  if (parsedSegmentationData.length > 0) {
    console.log('\n✅ Segmentation Results:');
    
    const { width: imageWidth, height: imageHeight } = await getImageDimensions(imageBuffer);
    console.log(`Original image dimensions: Width = ${imageWidth}, Height = ${imageHeight}`);

    // Load the original image with sharp
    let image = sharp(imageBuffer);

    for (const segmentationResult of parsedSegmentationData) {
      console.log(`
🔍 [TEST] Processing segmentation result for label: ${segmentationResult.label || '[No Label]'}`);
      console.log(`🔍 [TEST] Segmentation Result Object:`, JSON.stringify(segmentationResult, null, 2));
      if (segmentationResult.box_2d && segmentationResult.mask) {
        const [x1, y1, x2, y2] = convertNormalizedBoxToPixels(segmentationResult.box_2d, imageWidth, imageHeight);
        const maskWidth = x2 - x1;
        const maskHeight = y2 - y1;
        
        // Create a solid red overlay with the calculated alpha based on the mask
        // We will directly composite this colored rectangle
        const redOverlayImage = await sharp({
          create: {
            width: maskWidth,
            height: maskHeight,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 255 } // Start with fully opaque red
          }
        })
        .composite([
          {
            input: await sharp(Buffer.from(segmentationResult.mask.replace(/^data:image\/png;base64,/, ''), 'base64'))
              .resize(maskWidth, maskHeight)
              .greyscale()
              .threshold(127, { grayscale: true }) // Binarize mask: >127 becomes 255, <=127 becomes 0
              .raw()
              .toBuffer(),
            raw: { width: maskWidth, height: maskHeight, channels: 1 }, // Mask is 1 channel
            blend: 'dest-in' // Use mask as alpha channel
          }
        ])
        .png()
        .toBuffer();

        // Composite the red overlay onto the original image
        console.log(`🔍 [SHARP] Compositing overlay for ${segmentationResult.label}:`, {
          left: x1, top: y1, width: maskWidth, height: maskHeight,
          channels: 4, inputBufferLength: redOverlayImage.length
        });
        image = image.composite([
          {
            input: redOverlayImage,
            // No raw property needed here as it's a PNG buffer
            left: x1,
            top: y1,
          },
        ]);

        // Draw red bounding box
        const lineWidth = 5; // Increased line width
        const redColor = { r: 255, g: 0, b: 0, alpha: 255 }; // Solid red

        // Top line
        image = image.composite([
          {
            input: await sharp({
              create: {
                width: x2 - x1, 
                height: lineWidth, 
                channels: 4, 
                background: redColor
              }
            }).png().toBuffer(),
            left: x1,
            top: y1,
          },
        ]);

        // Bottom line
        image = image.composite([
          {
            input: await sharp({
              create: {
                width: x2 - x1, 
                height: lineWidth, 
                channels: 4, 
                background: redColor
              }
            }).png().toBuffer(),
            left: x1,
            top: y2 - lineWidth,
          },
        ]);

        // Left line
        image = image.composite([
          {
            input: await sharp({
              create: {
                width: lineWidth,
                height: y2 - y1,
                channels: 4,
                background: redColor
              }
            }).png().toBuffer(),
            left: x1,
            top: y1,
          },
        ]);

        // Right line
        image = image.composite([
          {
            input: await sharp({
              create: {
                width: lineWidth,
                height: y2 - y1,
                channels: 4,
                background: redColor
              }
            }).png().toBuffer(),
            left: x2 - lineWidth,
            top: y1,
          },
        ]);
      } else {
        console.warn(`⚠️ [TEST] Skipping segmentation result due to missing box_2d or mask for label: ${segmentationResult.label || '[No Label]'}`);
      }
    }

    // Save the final image with overlays
    const outputImagePath = join(__dirname, `../data/segmented_table_overlay.png`);
    const finalImageMetadata = await image.metadata();
    console.log(`
🔍 [SHARP-DEBUG] Final image metadata before saving:`, {
      width: finalImageMetadata.width,
      height: finalImageMetadata.height,
      channels: finalImageMetadata.channels,
      format: finalImageMetadata.format
    });

    await image.toFile(outputImagePath);
    console.log(`\n✅ Image with segmentation overlay saved to: ${outputImagePath}`);

  } else {
    console.error('❌ No valid data in response or could not parse raw Gemini response.');
    console.log('Response:', result);
  }

  // 6. Display debug info if available
  if (result.debugInfo) {
    console.log('\n🔍 Debug Information:');
    console.log(result.debugInfo);
  }

  console.log('\n✅ Table Segmentation test completed!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
}); 