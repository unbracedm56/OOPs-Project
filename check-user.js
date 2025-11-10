/**
 * User Diagnostic Script
 * 
 * This script checks if a user exists and their confirmation status.
 * Run it with: node check-user.js your-email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
let SUPABASE_URL, SUPABASE_KEY;
try {
  const envContent = readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL="?([^"\n]+)"?/);
  const keyMatch = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY="?([^"\n]+)"?/);
  SUPABASE_URL = urlMatch ? urlMatch[1] : null;
  SUPABASE_KEY = keyMatch ? keyMatch[1] : null;
} catch (err) {
  console.error('❌ Could not read .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = process.argv[2];

if (!email) {
  console.log('Usage: node check-user.js your-email@example.com');
  process.exit(1);
}

async function checkUser() {
  console.log(`🔍 Checking user: ${email}\n`);
  
  // Try to sign in to see the actual error
  console.log('Attempting sign-in with a test password...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: 'test-password-123'
  });
  
  if (error) {
    console.log('\n📋 Sign-in Error Analysis:');
    console.log('   Error Code:', error.status || 'N/A');
    console.log('   Error Message:', error.message);
    console.log('\n💡 What this means:');
    
    if (error.message.includes('Invalid login credentials')) {
      console.log('   ✅ User EXISTS in database');
      console.log('   ❌ Password is incorrect OR email not confirmed');
      console.log('\n🔧 Solutions:');
      console.log('   1. Try the correct password');
      console.log('   2. Check if email confirmation is required (see below)');
      console.log('   3. Reset password if forgotten');
    } else if (error.message.includes('Email not confirmed')) {
      console.log('   ✅ User EXISTS in database');
      console.log('   ❌ Email has NOT been confirmed');
      console.log('\n🔧 Solution:');
      console.log('   Check your email inbox for confirmation link');
    } else {
      console.log('   ⚠️  Unexpected error - see message above');
    }
  } else {
    console.log('   ✅ Sign-in successful! (unlikely with test password)');
  }
  
  // Check email confirmation settings
  console.log('\n📧 Checking Email Confirmation Settings:');
  console.log('   Go to Supabase Dashboard → Authentication → Providers → Email');
  console.log('   If "Confirm email" is enabled, users MUST click the link in their email');
  console.log('   You can disable it for development/testing');
}

checkUser().catch(console.error);
