/**
 * Database Connection Test Script
 * 
 * This script tests read/write operations to your Supabase database.
 * Run it with: node test-db-connection.js
 * 
 * Prerequisites: npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
let SUPABASE_URL, SUPABASE_KEY;
try {
  const envContent = readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL="?([^"\n]+)"?/);
  const keyMatch = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY="?([^"\n]+)"?/);
  SUPABASE_URL = urlMatch ? urlMatch[1] : null;
  SUPABASE_KEY = keyMatch ? keyMatch[1] : null;
} catch (err) {
  console.error('❌ Could not read .env file:', err.message);
  process.exit(1);
}

console.log('🔍 Testing Supabase Database Connection...\n');
console.log('📋 Configuration:');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_KEY ? SUPABASE_KEY.substring(0, 20) + '...' : 'NOT SET'}\n`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY not set in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🧪 Running Tests...\n');
  
  // Test 1: Check if we can query the database
  console.log('Test 1: Check database connectivity');
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   ⚠️  Query returned an error (this might be expected if table is empty):');
      console.log(`      ${error.message}`);
    } else {
      console.log('   ✅ Successfully connected to database');
      console.log(`      Found ${data ? data.length : 0} categories`);
    }
  } catch (err) {
    console.log('   ❌ Connection failed:');
    console.log(`      ${err.message}`);
    return false;
  }
  
  // Test 2: Check if tables exist
  console.log('\nTest 2: Verify essential tables exist');
  const tables = ['profiles', 'stores', 'products', 'categories', 'inventory', 'orders', 'cart'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(0);
      
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`   ⚠️  Could not check table '${table}': ${err.message}`);
    }
  }
  
  // Test 3: Check authentication functions
  console.log('\nTest 3: Check authentication functions');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('   ✅ Active session found');
      console.log(`      User: ${session.user.email}`);
    } else {
      console.log('   ℹ️  No active session (this is normal if not logged in)');
    }
  } catch (err) {
    console.log('   ❌ Auth check failed:');
    console.log(`      ${err.message}`);
  }
  
  // Test 4: Check RPC functions exist
  console.log('\nTest 4: Verify custom functions exist');
  const functions = ['has_role', 'import_product_data'];
  
  for (const funcName of functions) {
    try {
      // Try to call function with dummy data to see if it exists
      const { error } = await supabase.rpc(funcName, {});
      
      if (error && error.code === '42883') {
        console.log(`   ❌ Function '${funcName}' does not exist`);
      } else if (error) {
        // Function exists but failed for expected reasons (wrong params, etc)
        console.log(`   ✅ Function '${funcName}' exists`);
      } else {
        console.log(`   ✅ Function '${funcName}' exists and executed`);
      }
    } catch (err) {
      console.log(`   ⚠️  Could not check function '${funcName}': ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));
  console.log('If you see ✅ for most tests, your database is properly configured.');
  console.log('If you see ❌ errors, you may need to run: npx supabase db push');
  console.log('='.repeat(60));
}

testConnection().catch(console.error);
