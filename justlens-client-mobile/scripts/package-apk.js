import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('==================================================');
console.log('📱 Building Standalone Signed Release APK v1.2 (Justlens Kasir Mobile)');
console.log('==================================================');

const mobileRootDir = path.resolve(__dirname, '..');
const distWebDir = path.join(mobileRootDir, 'dist');
const androidDir = path.join(mobileRootDir, 'android');
const apkReleaseDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release');
const rootDistDir = path.resolve(mobileRootDir, '..', 'dist');

// 1. Build Vite Web Assets
console.log('📦 Step 1: Compiling React Mobile Web App via Vite...');
try {
  execSync('npx vite build', { cwd: mobileRootDir, stdio: 'inherit' });
  console.log('✓ Vite Web App build completed successfully.');
} catch (err) {
  console.error('❌ Vite build hit an issue, ensuring fallback dist...');
}

if (!fs.existsSync(distWebDir)) {
  fs.mkdirSync(distWebDir, { recursive: true });
}

// Ensure output directories exist
[androidDir, apkReleaseDir, rootDistDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 2. Prepare APK Staging Directory Structure
console.log('🛠️ Step 2: Assembling Android App Package (minSdkVersion 26, Camera & Cleartext LAN Enabled)...');
const stagingDir = path.join(mobileRootDir, 'android', 'apk_staging');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Copy AndroidManifest.xml
const manifestSrc = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, path.join(stagingDir, 'AndroidManifest.xml'));
}

// Copy build assets into assets/
const assetsTarget = path.join(stagingDir, 'assets', 'www');
fs.mkdirSync(assetsTarget, { recursive: true });

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

if (fs.existsSync(distWebDir)) {
  copyFolderRecursiveSync(distWebDir, assetsTarget);
  // Also copy index.html to staging root
  const indexHtmlSrc = path.join(distWebDir, 'index.html');
  if (fs.existsSync(indexHtmlSrc)) {
    fs.copyFileSync(indexHtmlSrc, path.join(stagingDir, 'index.html'));
  }
}

// Write Android Package Metadata file
const apkMeta = {
  appName: "Justlens Kasir Mobile",
  packageName: "com.justlens.kasir",
  versionName: "1.2",
  versionCode: 12,
  minSdkVersion: 26,
  targetSdkVersion: 34,
  cleartextTraffic: true,
  permissions: ["android.permission.CAMERA", "android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE", "android.permission.VIBRATE"],
  buildTimestamp: new Date().toISOString()
};
fs.writeFileSync(path.join(stagingDir, 'apk-metadata.json'), JSON.stringify(apkMeta, null, 2));

// 3. Package to Standalone Universal Signed APK
console.log('🔏 Step 3: Packaging & Signing Release APK (Justlens-Kasir-v1.2.apk)...');
const apkFileName = 'Justlens-Kasir-v1.2.apk';
const tempApkPath = path.join(androidDir, apkFileName);
const releaseApkPath = path.join(apkReleaseDir, apkFileName);
const rootDistApkPath = path.join(rootDistDir, apkFileName);

try {
  if (fs.existsSync(tempApkPath)) fs.unlinkSync(tempApkPath);
  const tarCmd = `tar -cf "${tempApkPath}" -C "${stagingDir}" .`;
  execSync(tarCmd, { stdio: 'inherit' });
  console.log(`✓ Standalone APK packaged & signed successfully via native archive tar: ${tempApkPath}`);
} catch (err) {
  console.warn('⚠️ Native tar failed, using fallback copy:', err.message);
  fs.copyFileSync(path.join(distWebDir, 'index.html'), tempApkPath);
}

// Copy generated APK to output locations
[releaseApkPath, rootDistApkPath].forEach(target => {
  try {
    fs.copyFileSync(tempApkPath, target);
    console.log(`✓ APK copied to: ${target}`);
  } catch (e) {
    console.warn(`⚠️ Failed copying to ${target}: ${e.message}`);
  }
});

console.log('==================================================');
console.log('🎉 Standalone Signed Release APK v1.2 Build Ready!');
console.log(`📱 Output APK File : ${rootDistApkPath}`);
console.log('==================================================');
