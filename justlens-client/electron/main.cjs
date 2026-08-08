const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

// Single Instance Lock (Ensures POS running only once at a time)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Justlens Kasir POS System',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allow local network requests to cashier server
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Auto-start setting on Windows login for POS Computer
  try {
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe'),
        args: ['--autostart']
      });
    }
  } catch (err) {
    console.error('Gagal mengonfigurasi Auto-Start Login:', err);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Thermal/LAN Silent Printing
ipcMain.handle('get-printers', async () => {
  try {
    if (mainWindow && mainWindow.webContents) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      return printers;
    }
    return [];
  } catch (err) {
    console.error('Error fetching printers:', err);
    return [];
  }
});

ipcMain.handle('silent-print', async (event, options = {}) => {
  const { htmlContent, printerName, silent = true } = options;

  try {
    if (htmlContent) {
      // Create offscreen/hidden window to render HTML content for thermal silent print
      let printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body { 
              margin: 0; 
              padding: 8px; 
              font-family: monospace, 'Courier New', sans-serif; 
              font-size: 11px;
              color: #000;
              background: #fff;
            }
            .print-area { width: 100%; }
            table { width: 100%; border-collapse: collapse; }
            .no-print { display: none !important; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .border-b { border-bottom: 1px dashed #000; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="print-area">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;

      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

      return new Promise((resolve) => {
        printWindow.webContents.print(
          {
            silent: silent,
            printBackground: true,
            deviceName: printerName || '',
            margins: { marginType: 'none' },
          },
          (success, failureReason) => {
            try {
              if (!printWindow.isDestroyed()) printWindow.close();
            } catch (e) {
              console.error('Error closing printWindow:', e);
            }
            if (success) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: failureReason });
            }
          }
        );
      });
    } else if (mainWindow) {
      // Fallback: print current webContents directly
      return new Promise((resolve) => {
        mainWindow.webContents.print(
          {
            silent: silent,
            printBackground: true,
            deviceName: printerName || '',
            margins: { marginType: 'none' },
          },
          (success, failureReason) => {
            if (success) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: failureReason });
            }
          }
        );
      });
    }

    return { success: false, error: 'Window tidak tersedia' };
  } catch (err) {
    console.error('Silent print failed:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
