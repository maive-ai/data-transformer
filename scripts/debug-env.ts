#!/usr/bin/env tsx

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Environment Debug Script');
console.log('========================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log('1. Checking .env file:');
console.log(`   Path: ${envPath}`);
console.log(`   Exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  console.log('   Contents:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent.split('\n').map(line => `   ${line}`).join('\n'));
} else {
  console.log('   ❌ .env file not found!');
}

console.log('\n2. Environment variables:');
console.log(`   NEXAR_CLIENT_ID: ${process.env.NEXAR_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`   NEXAR_CLIENT_SECRET: ${process.env.NEXAR_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);

console.log('\n3. All environment variables starting with NEXAR:');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXAR'))
  .forEach(key => {
    console.log(`   ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  });

console.log('\n4. Current working directory:');
console.log(`   ${process.cwd()}`);

console.log('\n5. Files in current directory:');
fs.readdirSync(process.cwd())
  .filter(file => file.includes('env') || file.startsWith('.'))
  .forEach(file => {
    console.log(`   ${file}`);
  }); 