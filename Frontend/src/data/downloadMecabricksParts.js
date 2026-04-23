// scripts/downloadMecabricksParts.js
// Usage: node scripts/downloadMecabricksParts.js [part1,part2,part3...]

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../public/models/mecabricks');

// Create directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`📁 Created directory: ${MODELS_DIR}`);
}

// Parts to download (from command line or defaults)
const argsStr = process.argv[2];
const parts = argsStr 
  ? argsStr.split(',').map(p => p.trim())
  : [
      // Default parts to download
      '3001',    // Brick 2×4
      '3004',    // Brick 1×2
      '3022',    // Plate 2×2
      '3023',    // Plate 1×2
      '3010',    // Brick 1×4
      '3009',    // Brick 1×6
      '45',      // Slope 45°
      '3024',    // Plate 1×1
      '37494',   // Angel ear (Angel set)
      '2780',    // Technic pin
    ];

console.log(`\n🚀 Downloading Mecabricks models: ${parts.join(', ')}\n`);

// Download function
const downloadPart = async (partNum) => {
  const filename = `${partNum}.glb`;
  const filepath = path.join(MODELS_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    const size = (fs.statSync(filepath).size / 1024).toFixed(1);
    console.log(`✅ ${filename} (${size}KB) - Already exists`);
    return true;
  }

  try {
    console.log(`⏳ Downloading ${filename}...`);
    
    // Try Mecabricks API
    const url = `https://www.mecabricks.com/api/parts/${partNum}/export/gltf`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`⚠️  ${filename} - HTTP ${response.status} (model may not exist in Mecabricks)`);
      return false;
    }

    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    
    const size = (buffer.length / 1024).toFixed(1);
    console.log(`✅ ${filename} (${size}KB) - Downloaded`);
    return true;
  } catch (error) {
    console.log(`❌ ${filename} - Error: ${error.message}`);
    return false;
  }
};

// Download all parts
(async () => {
  let success = 0;
  let failed = 0;

  for (const part of parts) {
    const result = await downloadPart(part);
    if (result) success++;
    else failed++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Downloaded: ${success}`);
  console.log(`   ⚠️  Failed/Skipped: ${failed}`);
  console.log(`   📁 Location: ${MODELS_DIR}\n`);
})();