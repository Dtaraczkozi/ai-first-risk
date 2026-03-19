#!/usr/bin/env node

/**
 * VibeSharing Deploy Script
 * 
 * Usage: npm run deploy
 * 
 * Configuration (checked in order):
 * 
 * 1. Environment variables:
 *    VIBESHARING_PROTOTYPE_ID
 *    VIBESHARING_DEPLOY_TOKEN
 * 
 * 2. Project config (vibesharing.json):
 *    { "prototypeId": "...", "deployToken": "..." }
 * 
 * 3. Global config (~/.vibesharing/config.json):
 *    { "deployToken": "..." }
 *    (Token only - prototype ID must be in project config)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const VIBESHARING_URL = process.env.VIBESHARING_URL || 'https://vibesharing.app';
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.vibesharing');
const GLOBAL_CONFIG_PATH = path.join(GLOBAL_CONFIG_DIR, 'config.json');

// Files/folders to exclude from the zip
const EXCLUDE_PATTERNS = [
  'node_modules/*',
  '.git/*',
  '.next/*',
  '.vercel/*',
  '__MACOSX/*',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
  '*.log',
  'deploy.zip'
];

function loadGlobalConfig() {
  if (fs.existsSync(GLOBAL_CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf-8'));
    } catch (e) {
      // Silently ignore invalid global config
    }
  }
  return {};
}

function main() {
  console.log('\n🚀 VibeSharing Deploy\n');

  // Load global config first
  const globalConfig = loadGlobalConfig();
  if (globalConfig.deployToken) {
    console.log('✓ Found global config (~/.vibesharing/config.json)');
  }

  // Load project config
  let projectConfig = {};
  const configPath = path.join(process.cwd(), 'vibesharing.json');
  
  if (fs.existsSync(configPath)) {
    try {
      projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log('✓ Found vibesharing.json');
    } catch (e) {
      console.error('✗ Error reading vibesharing.json:', e.message);
      process.exit(1);
    }
  }

  // Get prototype ID (project-specific, no global fallback)
  const prototypeId = projectConfig.prototypeId || process.env.VIBESHARING_PROTOTYPE_ID;
  if (!prototypeId) {
    console.error('\n✗ No prototype ID found!');
    console.error('\nCreate a vibesharing.json file with:');
    console.error(JSON.stringify({ prototypeId: "paste-your-prototype-id-here" }, null, 2));
    console.error('\nGet the ID from your prototype page on vibesharing.app');
    process.exit(1);
  }

  // Get deploy token (check project, then global, then env)
  const deployToken = projectConfig.deployToken || globalConfig.deployToken || process.env.VIBESHARING_DEPLOY_TOKEN;
  if (!deployToken) {
    console.error('\n✗ No deploy token found!');
    console.error('\nOption 1: Add to ~/.vibesharing/config.json (recommended):');
    console.error(JSON.stringify({ deployToken: "vs_your_token_here" }, null, 2));
    console.error('\nOption 2: Add to this project\'s vibesharing.json:');
    console.error(JSON.stringify({ prototypeId: prototypeId, deployToken: "vs_your_token_here" }, null, 2));
    console.error('\nGet your token at vibesharing.app/dashboard/account');
    process.exit(1);
  }

  // Get project name from package.json or directory
  let projectName = path.basename(process.cwd());
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      projectName = pkg.name || projectName;
    } catch (e) {}
  }

  console.log(`✓ Prototype ID: ${prototypeId.substring(0, 8)}...`);
  console.log(`✓ Deploy token: ${deployToken.substring(0, 8)}...`);
  console.log(`✓ Project: ${projectName}`);

  // Create zip file
  console.log('\n📦 Creating deployment package...');
  
  const zipPath = path.join(process.cwd(), 'deploy.zip');
  
  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Build exclude arguments for zip command
  const excludeArgs = EXCLUDE_PATTERNS.map(p => `-x "${p}"`).join(' ');
  
  try {
    // Use zip command (available on Mac/Linux)
    execSync(`zip -r deploy.zip . ${excludeArgs}`, { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    const stats = fs.statSync(zipPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✓ Created deploy.zip (${sizeMB} MB)`);
  } catch (e) {
    console.error('✗ Failed to create zip:', e.message);
    console.error('\nMake sure you have the "zip" command installed.');
    process.exit(1);
  }

  // Upload to VibeSharing using curl
  console.log('\n☁️  Uploading to VibeSharing...');

  try {
    // Include response headers for debugging
    const curlCmd = `curl -s -w "\\n---HTTP_CODE:%{http_code}---" -X POST "${VIBESHARING_URL}/api/deploy/zip" \
      -H "Authorization: Bearer ${deployToken}" \
      -F "file=@deploy.zip" \
      -F "prototypeId=${prototypeId}" \
      -F "projectName=${projectName}"`;
    
    const rawResponse = execSync(curlCmd, { 
      cwd: process.cwd(),
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });

    // Clean up zip
    fs.unlinkSync(zipPath);

    // Parse HTTP status code from curl output
    const httpCodeMatch = rawResponse.match(/---HTTP_CODE:(\d+)---$/);
    const httpCode = httpCodeMatch ? parseInt(httpCodeMatch[1]) : 0;
    const response = rawResponse.replace(/\n---HTTP_CODE:\d+---$/, '').trim();

    if (!response) {
      console.error('\n✗ Empty response from server');
      console.error(`HTTP Status: ${httpCode}`);
      if (httpCode === 0) {
        console.error('Could not connect to server. Check your internet connection.');
      } else if (httpCode === 413) {
        console.error('File too large. Try reducing the project size.');
      } else if (httpCode >= 500) {
        console.error('Server error. Try again later.');
      }
      process.exit(1);
    }

    let result;
    try {
      result = JSON.parse(response);
    } catch (e) {
      console.error('\n✗ Unexpected response from server');
      console.error(`HTTP Status: ${httpCode}`);
      console.error('Response:', response.substring(0, 500));
      if (response.includes('<!DOCTYPE') || response.includes('<html')) {
        console.error('\nServer returned HTML instead of JSON. This usually means:');
        console.error('- The deploy token is invalid');
        console.error('- The server is down or misconfigured');
      }
      process.exit(1);
    }

    if (result.error) {
      console.error('\n✗ Deployment failed:', result.error);
      process.exit(1);
    }

    console.log('\n✅ Deployed successfully!\n');
    console.log(`🔗 Live URL: ${result.deployedUrl}`);
    
    if (result.contextImported) {
      console.log('📝 CLAUDE.md imported as context');
    }
    
    console.log(`\n📊 View on VibeSharing:`);
    console.log(`   ${VIBESHARING_URL}/dashboard/projects/${prototypeId}\n`);

  } catch (e) {
    // Clean up zip on error
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    console.error('\n✗ Deployment failed:', e.message);
    process.exit(1);
  }
}

main();
