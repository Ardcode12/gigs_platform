require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// ---- Route imports ----
const authRoutes         = require('./routes/auth.routes');
const workerRoutes       = require('./routes/workers.routes');
const workerPortalRoutes = require('./routes/workerPortal.routes');
const gpsRoutes          = require('./routes/gps.routes');
const bookingRoutes      = require('./routes/bookings.routes');
const paymentRoutes      = require('./routes/payments.routes');
const rateRoutes         = require('./routes/rates.routes');
const welfareRoutes      = require('./routes/welfare.routes');
const complaintRoutes    = require('./routes/complaints.routes');
const dashboardRoutes    = require('./routes/dashboard.routes');

const app = express();

// ---- Middleware ----
app.use(helmet());
app.use(cors({
  origin: true, // Allow any origin in development (localhost:3000, 3001, 5173, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Health Check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GigMat Platform Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ---- API Routes ----
// Auth (3 portals)
app.use('/api/auth',                   authRoutes);
// Backwards compat: old society auth path
app.use('/api/society/auth',           authRoutes);

// Society admin routes
app.use('/api/society/workers',        workerRoutes);
app.use('/api/society/bookings',       bookingRoutes);
app.use('/api/society/payments',       paymentRoutes);
app.use('/api/society/rates',          rateRoutes);
app.use('/api/society/welfare',        welfareRoutes);
app.use('/api/society/complaints',     complaintRoutes);
app.use('/api/society/dashboard',      dashboardRoutes);

// Worker portal routes
app.use('/api/worker',                 workerPortalRoutes);

// GPS & service request routes (public)
app.use('/api/gps',                    gpsRoutes);
app.use('/api/services',               gpsRoutes); // alias

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// ---- Global Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 GigMat Platform Backend v2.0 running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS allowed: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
