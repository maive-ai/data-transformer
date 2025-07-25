#!/usr/bin/env tsx

import { searchPartByMPN } from '../lib/nexar-demo';

async function quickTest() {
  console.log('🔍 Quick Nexar Test');
  console.log('Searching for CRG0603F10K...\n');
  
  await searchPartByMPN('CRG0603F10K');
}

quickTest().catch(console.error); 