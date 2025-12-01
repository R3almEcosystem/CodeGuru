#!/usr/bin/env node

/**
 * Setup Demo Account Script
 * 
 * This script creates a demo admin account in Supabase and populates it with sample data.
 * 
 * Usage:
 *   npm run setup:demo
 * 
 * Demo credentials:
 *   Email: demo@codeguru.ai
 *   Password: Demo@12345
 */

const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Please ensure .env.local has:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const DEMO_EMAIL = 'demo@codeguru.ai';
const DEMO_PASSWORD = 'Demo@12345';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('🚀 Setting up demo account...\n');

  try {
    // Step 1: Create admin user
    console.log(`📝 Creating demo account: ${DEMO_EMAIL}`);
    const createUserRes = await makeRequest('POST', '/auth/v1/admin/users', {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Demo Admin',
      },
    });

    if (createUserRes.status !== 200 && createUserRes.status !== 201) {
      if (createUserRes.body?.msg?.includes('already exists')) {
        console.log('✓ Account already exists');
      } else {
        console.error('❌ Failed to create user:', createUserRes.body);
        process.exit(1);
      }
    } else {
      console.log('✓ Account created successfully');
    }

    const userId = createUserRes.body?.id;

    if (userId) {
      // Step 2: Create sample project
      console.log('\n📁 Creating sample project...');
      const projectRes = await makeRequest('POST', '/rest/v1/projects', {
        user_id: userId,
        title: 'React Learning',
        description: 'A sample project for React learning',
      });

      if (projectRes.status === 201) {
        console.log('✓ Sample project created');
        const projectId = projectRes.body?.[0]?.id;

        if (projectId) {
          // Step 3: Create sample conversation
          console.log('💬 Creating sample conversation...');
          const convRes = await makeRequest('POST', '/rest/v1/conversations', {
            user_id: userId,
            project_id: projectId,
            title: 'Getting Started with React Hooks',
          });

          if (convRes.status === 201) {
            console.log('✓ Sample conversation created');
          }
        }
      }
    }

    console.log('\n✅ Demo setup complete!\n');
    console.log('📧 Email:    ' + DEMO_EMAIL);
    console.log('🔐 Password: ' + DEMO_PASSWORD);
    console.log('\n💡 Use these credentials to sign in at http://localhost:5173/auth\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
