const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middlewares/errorHandler');

// Routers
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const leadRoutes = require('./routes/lead.routes');
const authRoutes = require('./routes/auth.routes');
const adminProductRoutes = require('./routes/admin/product.admin.routes');
const adminCategoryRoutes = require('./routes/admin/category.admin.routes');
const adminOrderRoutes = require('./routes/admin/order.admin.routes');
const adminLeadRoutes = require('./routes/admin/lead.admin.routes');
const adminStatRoutes = require('./routes/admin/stat.admin.routes');

const app = express();

/* ----------------------------- Global middleware ---------------------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* --------------------------------- Static --------------------------------- */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/* ------------------------------- Health check ----------------------------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'paw-world-api', time: new Date().toISOString() });
});

/* ----------------------------- Public API routes -------------------------- */
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);

/* ------------------------------ Admin API --------------------------------- */
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/leads', adminLeadRoutes);
app.use('/api/admin/stats', adminStatRoutes);

/* -------------------------------- 404 + Err ------------------------------- */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler);

module.exports = app;
