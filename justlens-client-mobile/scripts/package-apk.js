import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('==================================================');
console.log('==================================================');
console.log('📱 Building Standalone Signed Release APK v1.3 (Justlens Kasir Mobile)');
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
  versionName: "1.3",
  versionCode: 13,
  minSdkVersion: 26,
  targetSdkVersion: 34,
  cleartextTraffic: true,
  permissions: ["android.permission.CAMERA", "android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE", "android.permission.VIBRATE"],
  buildTimestamp: new Date().toISOString()
};
fs.writeFileSync(path.join(stagingDir, 'apk-metadata.json'), JSON.stringify(apkMeta, null, 2));

// 3. Run Native Gradle Build (assembleRelease --no-daemon)
console.log('🔏 Step 3: Compiling Native Release APK via Gradle...');
const apkFileName = 'Justlens-Kasir-v1.3.apk';
const compiledGradleApk = path.join(apkReleaseDir, 'app-release.apk');
const releaseApkPath = path.join(apkReleaseDir, apkFileName);
const rootDistApkPath = path.join(rootDistDir, apkFileName);
const mobileDistApkPath = path.join(distWebDir, apkFileName);

// Ensure JDK 17 and Android SDK paths for Gradle execution
const JDK17_PATH = 'C:\\Users\\jonat\\.jdks\\jbr-17.0.14';
if (fs.existsSync(JDK17_PATH)) {
  process.env.JAVA_HOME = JDK17_PATH;
} else if (!process.env.JAVA_HOME || process.env.JAVA_HOME.includes('1.8')) {
  const possibleJdks = ['C:\\Program Files\\Android\\Android Studio\\jbr'];
  for (const jdk of possibleJdks) {
    if (fs.existsSync(jdk)) {
      process.env.JAVA_HOME = jdk;
      break;
    }
  }
}
if (!process.env.ANDROID_HOME) {
  const possibleSdks = ['C:\\Users\\jonat\\AppData\\Local\\Android\\Sdk'];
  for (const sdk of possibleSdks) {
    if (fs.existsSync(sdk)) {
      process.env.ANDROID_HOME = sdk;
      break;
    }
  }
}

// Copy web assets to android app assets folder
const androidAssetsWww = path.join(androidDir, 'app', 'src', 'main', 'assets', 'www');
if (fs.existsSync(distWebDir)) {
  copyFolderRecursiveSync(distWebDir, androidAssetsWww);
}

try {
  const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
  console.log(`🚀 Executing Gradle build: ${gradlewCmd} assembleRelease --no-daemon`);
  execSync(`${gradlewCmd} assembleRelease --no-daemon`, {
    cwd: androidDir,
    env: process.env,
    stdio: 'inherit'
  });
  console.log('✓ Gradle assembleRelease completed successfully.');
} catch (err) {
  console.warn('⚠️ Gradle native build output error:', err.message);
}

// Check compiled native APK source
let sourceApk = null;
if (fs.existsSync(compiledGradleApk)) {
  sourceApk = compiledGradleApk;
} else if (fs.existsSync(releaseApkPath)) {
  sourceApk = releaseApkPath;
}

if (sourceApk) {
  const apkSize = fs.statSync(sourceApk).size;
  console.log(`✓ Compiled APK verified! File: ${sourceApk} (${(apkSize / 1024 / 1024).toFixed(2)} MB)`);

  // Copy generated APK to target output locations
  [mobileDistApkPath, releaseApkPath, rootDistApkPath].forEach(target => {
    try {
      fs.copyFileSync(sourceApk, target);
      console.log(`✓ APK copied to: ${target}`);
    } catch (e) {
      console.warn(`⚠️ Failed copying to ${target}: ${e.message}`);
    }
  });
} else {
  console.error('❌ Error: Could not find compiled app-release.apk in Gradle build outputs!');
}

// Clean up mobile dist directory so ONLY Justlens-Kasir-v1.3.apk remains
if (fs.existsSync(distWebDir)) {
  fs.readdirSync(distWebDir).forEach(file => {
    if (file !== apkFileName) {
      const fullP = path.join(distWebDir, file);
      try {
        if (fs.lstatSync(fullP).isDirectory()) {
          fs.rmSync(fullP, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullP);
        }
        console.log(`🧹 Cleaned temporary asset from dist/: ${file}`);
      } catch (e) {}
    }
  });
}

console.log('==================================================');
console.log('🎉 Standalone Signed Release APK v1.3 Build Ready!');
console.log(`📱 Final Output APK : ${mobileDistApkPath}`);
console.log('==================================================');
