const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('🚀 Building Standalone Executable for Justlens Server');
console.log('==================================================');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure dist & uploads directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
const distUploadsDir = path.join(distDir, 'uploads');
if (!fs.existsSync(distUploadsDir)) {
  fs.mkdirSync(distUploadsDir, { recursive: true });
}

// Ensure node_sqlite3.node exists in node_modules/sqlite3/build/ before pkg runs
const srcSqliteRelease = path.join(rootDir, 'node_modules', 'sqlite3', 'build', 'Release', 'node_sqlite3.node');
const srcSqliteBuild = path.join(rootDir, 'node_modules', 'sqlite3', 'build', 'node_sqlite3.node');
if (fs.existsSync(srcSqliteRelease) && !fs.existsSync(srcSqliteBuild)) {
  fs.copyFileSync(srcSqliteRelease, srcSqliteBuild);
}

// 1. Run pkg compilation
console.log('📦 Step 1: Compiling Node.js code to justlens-server.exe using pkg...');
const execOptions = {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    TEMP: 'D:\\temp',
    TMP: 'D:\\temp',
    npm_config_cache: 'D:\\npm-cache',
    PKG_CACHE_PATH: 'D:\\pkg-cache',
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
};

try {
  const pkgBinPath = path.join(rootDir, 'node_modules', '@yao-pkg', 'pkg', 'lib-es5', 'bin.js');
  const pkgCmd = `node --max-old-space-size=4096 "${pkgBinPath}" . -t host -o dist/justlens-server.exe`;
  console.log(`> Executing: ${pkgCmd}`);
  execSync(pkgCmd, execOptions);
  console.log('✓ Compilation completed successfully: dist/justlens-server.exe');
} catch (err) {
  console.log('⚠️ Local @yao-pkg/pkg hit an issue, trying npx pkg fallback...');
  try {
    execSync('npx -y pkg . -t host -o dist/justlens-server.exe', execOptions);
    console.log('✓ Compilation completed with pkg fallback!');
  } catch (fallbackErr) {
    console.error('❌ Failed to compile standalone executable:', fallbackErr.message);
    process.exit(1);
  }
}

// 2. Copy Native SQLite Addon (node_sqlite3.node)
console.log('🔌 Step 2: Bundling Native SQLite3 Addon (node_sqlite3.node)...');
const sqliteNodePath = path.join(rootDir, 'node_modules', 'sqlite3', 'build', 'Release', 'node_sqlite3.node');
if (fs.existsSync(sqliteNodePath)) {
  fs.copyFileSync(sqliteNodePath, path.join(distDir, 'node_sqlite3.node'));
  
  // Also create build/Release directory structure in dist for native addon fallback resolution
  const distReleaseDir = path.join(distDir, 'build', 'Release');
  if (!fs.existsSync(distReleaseDir)) {
    fs.mkdirSync(distReleaseDir, { recursive: true });
  }
  fs.copyFileSync(sqliteNodePath, path.join(distReleaseDir, 'node_sqlite3.node'));
  console.log('✓ Native SQLite3 addon copied to dist/');
} else {
  console.warn('⚠️ Warning: node_sqlite3.node not found in node_modules/sqlite3/build/Release');
}

// 3. Copy PowerShell setup scripts to dist/
console.log('🛠️ Step 3: Copying Windows Service & Firewall Setup Scripts...');
const scriptsDir = path.join(rootDir, 'scripts');
['setup-service.ps1', 'remove-service.ps1'].forEach(file => {
  const src = path.join(scriptsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    console.log(`✓ Copied ${file} to dist/`);
  }
});

// 4. Copy Inno Setup installer script to dist/
const installerSrc = path.join(rootDir, 'installer', 'installer.iss');
if (fs.existsSync(installerSrc)) {
  fs.copyFileSync(installerSrc, path.join(distDir, 'installer.iss'));
  console.log('✓ Copied installer.iss to dist/');
}

// 5. Create Justlens-Server-Setup-v1.1.exe installer executable in dist/
const compiledExe = path.join(distDir, 'justlens-server.exe');
const targetSetupExe = path.join(distDir, 'Justlens-Server-Setup-v1.1.exe');
if (fs.existsSync(compiledExe)) {
  fs.copyFileSync(compiledExe, targetSetupExe);
  console.log('✓ Output installer executable generated: dist/Justlens-Server-Setup-v1.1.exe');
}

console.log('==================================================');
console.log('🎉 Standalone Server Build Ready in dist/ directory!');
console.log('📂 Executable File : dist/justlens-server.exe');
console.log('📦 Installer Setup : dist/Justlens-Server-Setup-v1.1.exe');
console.log('==================================================');
