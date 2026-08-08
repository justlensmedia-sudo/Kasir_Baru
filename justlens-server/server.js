const app = require('./src/app');
const dotenv = require('dotenv');
const autoInitDb = require('./src/database/autoInitDb');

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all interfaces for LAN access

(async () => {
  // Initialize SQLite database (migration & initial seed)
  await autoInitDb();

  app.listen(PORT, HOST, () => {
    console.log(`==================================================`);
    console.log(`🚀 Justlens Server (LAN Enabled) is running!`);
    console.log(`📡 Local Access   : http://localhost:${PORT}`);
    console.log(`🌐 Network Access : http://${HOST}:${PORT}`);
    console.log(`==================================================`);
  });
})();
