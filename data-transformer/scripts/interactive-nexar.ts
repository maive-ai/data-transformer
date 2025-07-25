#!/usr/bin/env tsx

import { startInteractiveSearch } from '../lib/nexar-demo';

console.log('🔍 Nexar Interactive Search');
console.log('Enter MPN to search (or empty to exit):\n');

startInteractiveSearch().catch(console.error); 