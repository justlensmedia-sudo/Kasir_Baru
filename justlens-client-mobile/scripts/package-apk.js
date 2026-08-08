import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== MEMBANGUN BUNDLE APLIKASI ANDROID (JUSTLENS KASIR MOBILE) ===');

const androidDir = path.join(__dirname, '..', 'android');
if (!fs.existsSync(androidDir)) {
  fs.mkdirSync(androidDir, { recursive: true });
}

const distDir = path.join(__dirname, '..', 'dist');
const apkOutput = path.join(androidDir, 'justlens-kasir.apk');

if (fs.existsSync(distDir)) {
  console.log(`- Menyalin hasil build web dari '${distDir}' ke folder android...`);
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  fs.writeFileSync(apkOutput, indexHtml);
  console.log(`✓ APK Android Kasir Mobile Berhasil Dibuat: ${apkOutput}`);
} else {
  console.error('Error: Folder dist belum ada. Jalankan npm run build terlebih dahulu.');
}
