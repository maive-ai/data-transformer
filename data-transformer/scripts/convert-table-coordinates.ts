#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TableDetection {
  table_id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  confidence: number;
}

interface ConvertedTableDetection {
  table_id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in pixels
  confidence: number;
  box_2d_pixels: [number, number, number, number]; // [x1, y1, x2, y2] in pixels
}

function convertCoordinates(
  tableDetections: TableDetection[],
  imageWidth: number,
  imageHeight: number
): ConvertedTableDetection[] {
  return tableDetections.map(detection => {
    const [ymin, xmin, ymax, xmax] = detection.box_2d;
    
    // Convert from 0-1000 scale to absolute pixels
    const absY1 = Math.round((ymin / 1000) * imageHeight);
    const absX1 = Math.round((xmin / 1000) * imageWidth);
    const absY2 = Math.round((ymax / 1000) * imageHeight);
    const absX2 = Math.round((xmax / 1000) * imageWidth);
    
    return {
      ...detection,
      box_2d: [absY1, absX1, absY2, absX2], // Keep original format but in pixels
      box_2d_pixels: [absX1, absY1, absX2, absY2] // [x1, y1, x2, y2] format
    };
  });
}

async function main() {
  console.log('🔄 Converting Table Detection Coordinates...\n');

  // Configuration - update these values
  const imageWidth = 1920; // Your image width in pixels
  const imageHeight = 1080; // Your image height in pixels
  const inputPath = join(__dirname, '../data/table_detection_result.json'); // Update path

  try {
    // Read the table detection results
    const inputContent = readFileSync(inputPath, 'utf-8');
    const tableDetections: TableDetection[] = JSON.parse(inputContent);

    console.log(`📏 Image dimensions: ${imageWidth}x${imageHeight} pixels`);
    console.log(`📊 Found ${tableDetections.length} tables`);

    // Convert coordinates
    const convertedDetections = convertCoordinates(tableDetections, imageWidth, imageHeight);

    // Display results
    console.log('\n✅ Converted Table Coordinates:');
    convertedDetections.forEach((detection, index) => {
      console.log(`\n--- Table ${index + 1} (${detection.table_id}) ---`);
      console.log(`Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
      console.log(`Original box_2d [ymin, xmin, ymax, xmax]: [${detection.box_2d.join(', ')}]`);
      console.log(`Pixel coordinates [x1, y1, x2, y2]: [${detection.box_2d_pixels.join(', ')}]`);
      
      // Calculate table dimensions
      const [x1, y1, x2, y2] = detection.box_2d_pixels;
      const width = x2 - x1;
      const height = y2 - y1;
      console.log(`Table dimensions: ${width}x${height} pixels`);
    });

    // Save converted results
    const outputPath = join(__dirname, '../data/table_detection_converted.json');
    writeFileSync(outputPath, JSON.stringify(convertedDetections, null, 2), 'utf-8');
    console.log(`\n💾 Converted results saved to: ${outputPath}`);

    // Generate a summary
    const summary = {
      image_dimensions: { width: imageWidth, height: imageHeight },
      tables_found: convertedDetections.length,
      tables: convertedDetections.map(d => ({
        id: d.table_id,
        confidence: d.confidence,
        coordinates: d.box_2d_pixels,
        dimensions: {
          width: d.box_2d_pixels[2] - d.box_2d_pixels[0],
          height: d.box_2d_pixels[3] - d.box_2d_pixels[1]
        }
      }))
    };

    const summaryPath = join(__dirname, '../data/table_detection_summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`📋 Summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Error converting coordinates:', error);
    process.exit(1);
  }

  console.log('\n✅ Coordinate conversion completed!');
}

main().catch(err => {
  console.error('❌ Conversion failed:', err);
  process.exit(1);
}); 