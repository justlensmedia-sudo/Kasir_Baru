const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('⚙️ Installing Justlens POS Server Service (Windows Service)');
console.log('==================================================');

const dir = __dirname;
const exePath = path.join(dir, 'justlens-server.exe');
const serverScript = path.join(dir, 'server.js');
const dbPath = path.join(dir, 'database.sqlite');

const isExe = fs.existsSync(exePath);
const targetScript = isExe ? exePath : serverScript;

const svc = new Service({
  name: 'JustlensServerService',
  displayName: 'Justlens POS Server Service',
  description: 'Backend Service REST API & Database untuk Justlens System POS.',
  script: targetScript,
  env: [
    { name: 'PORT', value: '5000' },
    { name: 'NODE_ENV', value: 'production' },
    { name: 'DB_PATH', value: dbPath },
    { name: 'IS_SERVICE', value: 'true' }
  ]
});

svc.on('install', function () {
  console.log('✓ JustlensServerService successfully registered with Windows Service Manager!');

  // 1. Configure Auto Recovery Options (Restart after 5 seconds on crash)
  try {
    console.log('⚙️ Configuring Recovery Settings (Restart service after 5000ms)...');
    execSync('sc.exe failure JustlensServerService reset= 86400 actions= restart/5000/restart/5000/restart/5000', { stdio: 'inherit' });
    execSync('sc.exe config JustlensServerService start= auto', { stdio: 'inherit' });
    console.log('✓ Service Failure Recovery set to auto-restart in 5s.');
  } catch (err) {
    console.warn('⚠️ Could not configure sc failure:', err.message);
  }

  // 2. Open Windows Firewall Port 5000
  try {
    console.log('🛡️ Opening Port 5000 in Windows Firewall...');
    execSync('netsh advfirewall firewall delete rule name="Justlens Server (Port 5000)"', { stdio: 'ignore' });
    execSync('netsh advfirewall firewall add rule name="Justlens Server (Port 5000)" dir=in action=allow protocol=TCP localport=5000 profile=any', { stdio: 'ignore' });
    console.log('✓ Firewall Port 5000 configured for LAN access.');
  } catch (err) {
    console.warn('⚠️ Firewall rule warning:', err.message);
  }

  // 3. Start Service
  try {
    console.log('🚀 Starting Justlens POS Server Service...');
    svc.start();
    console.log('✓ Service started successfully on Port 5000!');
  } catch (startErr) {
    console.warn('⚠️ Service start warning:', startErr.message);
  }

  console.log('==================================================');
  console.log('🎉 Setup Complete! Justlens POS Server Service is active.');
  console.log('==================================================');
});

svc.on('alreadyinstalled', function () {
  console.log('ℹ️ Service JustlensServerService is already installed. Restarting service...');
  try {
    execSync('sc.exe start JustlensServerService', { stdio: 'inherit' });
  } catch (e) {}
});

svc.on('error', function (err) {
  console.error('❌ Service installation error:', err);
});

svc.install();
