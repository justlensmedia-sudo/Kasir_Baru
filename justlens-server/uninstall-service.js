const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('🗑️ Uninstalling Justlens POS Server Service (Windows Service)');
console.log('==================================================');

const dir = __dirname;
const exePath = path.join(dir, 'justlens-server.exe');
const serverScript = path.join(dir, 'server.js');

const isExe = fs.existsSync(exePath);
const targetScript = isExe ? exePath : serverScript;

const svc = new Service({
  name: 'JustlensServerService',
  displayName: 'Justlens POS Server Service',
  description: 'Backend Service REST API & Database untuk Justlens System POS.',
  script: targetScript
});

svc.on('uninstall', function () {
  console.log('✓ Windows Service JustlensServerService successfully uninstalled!');
});

try {
  console.log('🛑 Stopping service if running...');
  execSync('sc.exe stop JustlensServerService', { stdio: 'ignore' });
  execSync('sc.exe delete JustlensServerService', { stdio: 'ignore' });
  console.log('✓ Service stopped and removed via sc.exe');
} catch (e) {}

try {
  console.log('🛡️ Removing Windows Firewall Port 5000 Rule...');
  execSync('netsh advfirewall firewall delete rule name="Justlens Server (Port 5000)"', { stdio: 'ignore' });
  console.log('✓ Firewall rule cleaned up.');
} catch (e) {}

try {
  svc.uninstall();
} catch (err) {
  console.warn('⚠️ Service uninstall warning:', err.message);
}

console.log('==================================================');
console.log('🎉 Uninstall Complete!');
console.log('==================================================');
