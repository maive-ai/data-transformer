#!/usr/bin/env tsx

import { searchPartByMPN, startInteractiveSearch } from '../lib/nexar-demo';

async function main() {
  console.log('🔍 Testing Nexar Client...\n');

  // Test 1: Search for a specific part
  console.log('Test 1: Searching for CRG0603F10K');
  await searchPartByMPN('CRG0603F10K');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
//   // Test 2: Search for another part
//   console.log('Test 2: Searching for 1N4148');
//   await searchPartByMPN('1N4148');
  
//   console.log('\n' + '='.repeat(50) + '\n');
  
//   // Test 3: Search for a non-existent part
//   console.log('Test 3: Searching for NONEXISTENTPART123');
//   await searchPartByMPN('NONEXISTENTPART123');
  
//   console.log('\n✅ All tests completed!');
// }

// // Check if environment variables are set
// if (!process.env.NEXAR_CLIENT_ID || !process.env.NEXAR_CLIENT_SECRET) {
//   console.error('❌ Error: Please set NEXAR_CLIENT_ID and NEXAR_CLIENT_SECRET environment variables');
//   console.log('\nExample:');
//   console.log('export NEXAR_CLIENT_ID="your_client_id"');
//   console.log('export NEXAR_CLIENT_SECRET="your_client_secret"');
//   console.log('npm run test-nexar');
//   process.exit(1);

}

main().catch(console.error); 