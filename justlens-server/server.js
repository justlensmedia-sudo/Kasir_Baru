const app = require('./src/app');
const dotenv = require('dotenv');
const autoInitDb = require('./src/database/autoInitDb');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all interfaces for LAN access
const isPkg = typeof process.pkg !== 'undefined';

(async () => {
  try {
    // Initialize SQLite database (migration & initial seed)
    await autoInitDb();

    app.listen(PORT, HOST, () => {
      console.log(`==================================================`);
      console.log(`🚀 Justlens Server (LAN Enabled) is running!`);
      console.log(`📡 Local Access   : http://localhost:${PORT}`);
      console.log(`🌐 Network Access : http://${HOST}:${PORT}`);
      console.log(`==================================================`);
      console.log(`💡 Petunjuk: Biarkan jendela terminal ini tetap terbuka.`);
      console.log(`💡 Untuk menginstal sebagai Windows Service (Auto-Start Background):`);
      console.log(`   Jalankan file setup-service.ps1 dengan PowerShell (Run as Administrator).`);
      console.log(`==================================================`);

      // Auto open browser in Windows when launched directly
      if (process.platform === 'win32') {
        exec(`start http://localhost:${PORT}`, (err) => {
          if (err) console.log('Silakan buka http://localhost:5000 di browser Anda.');
        });
      }
    });
  } catch (err) {
    console.error('❌ Gagal menjalankan Justlens Server:', err);
    
    // Log error to disk for troubleshooting
    const logPath = isPkg 
      ? path.join(path.dirname(process.execPath), 'server-error.log')
      : path.join(__dirname, 'server-error.log');
    
    fs.writeFileSync(logPath, `[${new Date().toISOString()}] ${err.stack || err.message}\n`, { flag: 'a' });
    console.error(`Catatan error telah ditulis ke: ${logPath}`);

    // Pause window on error so user can see why it failed
    console.log('\nTekan ENTER untuk keluar...');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', () => process.exit(1));
  }
})();
