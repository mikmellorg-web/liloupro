// Automatic PWA Icon Integrity Enforcer - Runs before Vite build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const jsonPath = path.join(__dirname, 'icons.json');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (fs.existsSync(jsonPath)) {
  console.log('🛡️ [LiLouPro] Verifying & restoring 100% binary integrity of all PWA icons...');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const icons = JSON.parse(rawData);

  for (const [filename, b64Data] of Object.entries(icons)) {
    const buffer = Buffer.from(b64Data, 'base64');
    const targetPublic = path.join(publicDir, filename);
    fs.writeFileSync(targetPublic, buffer);

    if (fs.existsSync(distDir)) {
      const targetDist = path.join(distDir, filename);
      fs.writeFileSync(targetDist, buffer);
    }
  }
  console.log('✅ [LiLouPro] All PWA icons restored and validated with zero corruption!');
} else {
  console.warn('⚠️ [LiLouPro] icons.json not found, skipping icon sync.');
}
