#!/usr/bin/env tsx

import { searchPartByMPN, startInteractiveSearch, searchBomComponents } from '../lib/nexar-demo';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🔍 Testing Nexar Client...\n');

  // Test 1: Search for a specific part
//   console.log('Test 1: Searching for CRG0603F10K');
//   await searchPartByMPN('CRG0603F10K');
  
//   console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Process BOM CSV file
  console.log('Test 2: Processing BOM-nice.csv');
  try {
    const bomCsvPath = join(__dirname, '../public/artifacts/BOM-nice.csv');
    const bomCsvContent = readFileSync(bomCsvPath, 'utf-8');
    
    console.log('Original BOM CSV:');
    console.log(bomCsvContent);
    console.log('\n' + '-'.repeat(30) + '\n');
    
    const enrichedBom = await searchBomComponents(bomCsvContent);
    
    console.log('Enriched BOM (JSON):');
    console.log(JSON.stringify(enrichedBom, null, 2));
    
  } catch (error) {
    console.error('Error processing BOM:', error);
  }
  
  console.log('\n✅ All tests completed!');
}

main().catch(console.error); 