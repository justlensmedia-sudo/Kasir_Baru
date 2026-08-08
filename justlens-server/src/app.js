const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const path = require('path');

const authRoutes = require('./routes/authRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const materialRoutes = require('./routes/materialRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const productRoutes = require('./routes/productRoutes');
const finishingRoutes = require('./routes/finishingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();

// Middlewares - Enable CORS for LAN access (local network client access)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');

const isPkg = typeof process.pkg !== 'undefined';
const publicDir = path.join(__dirname, '../public');
const uploadsDir = isPkg 
  ? path.join(path.dirname(process.execPath), 'uploads')
  : path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
}

// Serve static web app (Backoffice Dashboard) & Uploaded files (Logos)
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// Root route serves Admin Dashboard web app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Root Info & Health Check
app.get('/api/info', (req, res) => {
  res.json({
    app: 'Justlens Server (Backoffice & REST API)',
    version: '1.1.0',
    lan_enabled: true,
    status: 'Running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/finishing-options', finishingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.originalUrl}' tidak ditemukan.`
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
