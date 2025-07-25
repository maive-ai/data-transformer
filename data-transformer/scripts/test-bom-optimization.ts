#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { writeFileSync } from 'fs';
import { parseCsvToJson } from '../lib/nexar-demo';

const PROMPT = "Please analyze the passed BOM components and their potential substitutions. Please output a CSV file with the recommended substitution. Substitutions should optimize for the following, in this order:\n\n1. Availability\n2. Price\n3. Lead time"

async function main() {
  console.log('🔬 Testing BOM Optimization Node (Gemini API)...\n');

  // 1. Read the enriched BOM JSON
  const enrichedBomPath = join(__dirname, '../data/enriched_bom_HUGE.json');
  const enrichedBomContent = readFileSync(enrichedBomPath, 'utf-8');

  // 2. Read the output template CSV
  const templatePath = join(__dirname, '../public/artifacts/BOM-final-template.csv');
  const templateContent = readFileSync(templatePath, 'utf-8');

  // 3. Prepare FormData for Gemini API
  const formData = new FormData();
  formData.append('inputFile', Buffer.from(enrichedBomContent), {
    filename: 'enriched_bom.json',
    contentType: 'application/json',
  });
  formData.append('prompt', PROMPT);
  formData.append('outputType', 'csv');
  formData.append('outputTemplate', Buffer.from(templateContent), {
    filename: 'BOM-final-template.csv',
    contentType: 'text/csv',
  });
  formData.append('useOutputTemplate', 'true');

  // 4. Call the Gemini API endpoint
  const response = await fetch('http://localhost:3001/api/gemini', {
    method: 'POST',
    body: formData as any,
    headers: (formData as any).getHeaders(),
  });

  // 5. Log the output
  const result: any = await response.json();
  // Convert the result from csv to json
  if (result.data) {
    // If it's an array, join all CSVs into one string (or process each separately)
    const csvs = Array.isArray(result.data) ? result.data : [result.data];
    for (const [i, csv] of csvs.entries()) {
      if (typeof csv === 'string') {
        const json = await parseCsvToJson(csv);
        console.log(`CSV #${i + 1} as JSON:`, JSON.stringify(json, null, 2));
        // Optionally, write each to a separate file:
        const outputPath = join(__dirname, `../data/bom_optimization_output_${i + 1}.json`);
        writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');
        console.log(`Result written to ${outputPath}`);
      }
    }
  }
console.log('\n✅ BOM Optimization test completed!');
}

main().catch(err => {
  console.error('Test failed:', err);
}); 