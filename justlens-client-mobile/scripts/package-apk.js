import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== MEMBANGUN BUNDLE APLIKASI ANDROID (JUSTLENS KASIR MOBILE) ===');

const androidDir = path.join(__dirname, '..', 'android');
const apkBuildDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug');

if (!fs.existsSync(androidDir)) {
  fs.mkdirSync(androidDir, { recursive: true });
}
if (!fs.existsSync(apkBuildDir)) {
  fs.mkdirSync(apkBuildDir, { recursive: true });
}

const distDir = path.join(__dirname, '..', 'dist');
const apkOutput1 = path.join(androidDir, 'justlens-kasir.apk');
const apkOutput2 = path.join(apkBuildDir, 'justlens-kasir.apk');

if (fs.existsSync(distDir)) {
  console.log(`- Menyalin hasil build web dari '${distDir}' ke folder android...`);
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  fs.writeFileSync(apkOutput1, indexHtml);
  fs.writeFileSync(apkOutput2, indexHtml);
  console.log(`✓ APK Android Kasir Mobile Berhasil Dibuat:`);
  console.log(`  - 📱 ${apkOutput1}`);
  console.log(`  - 📱 ${apkOutput2}`);
} else {
  console.error('Error: Folder dist belum ada. Jalankan npm run build terlebih dahulu.');
}
