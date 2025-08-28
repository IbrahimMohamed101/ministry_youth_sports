require('colors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');


// Load env vars
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

// Log environment loading status
console.log(`Loading environment from: ${envPath}`);
console.log('Environment variables loaded:', Object.keys(process.env).filter(key => key.includes('CLOUDINARY') || key === 'NODE_ENV'));

// Only require .env file in development
if (result.error && process.env.NODE_ENV !== 'production') {
  console.error('❌ Error loading .env file:'.red.bold, result.error);
  process.exit(1);
}


// Import routes
const newsRoutes = require('./routes/news.routes');
const authRoutes = require('./routes/auth.routes');
const activityRoutes = require('./routes/activity.routes');
const centerRoutes = require('./routes/center.Routes');
const activityTypeRoutes = require('./routes/activityTypes.Routes');
const techClubRoutes = require('./routes/techClub.Routes');
const playgroundRoutes = require('./routes/playground.routes');
const swimmingPoolRoutes = require('./routes/swimmingPool.routes');

// Import middleware and utilities
const errorHandler = require('./middleware/error');
const logger = require('./middleware/logger');
const ErrorResponse = require('./utils/errorResponse');

// Import database connection
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply to all API routes
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

// Compress all responses
app.use(compression());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/centers', centerRoutes);
app.use('/api/v1/activity-types', activityTypeRoutes);
app.use('/api/v1/tech-clubs', techClubRoutes);
app.use('/api/v1/playgrounds', playgroundRoutes);
app.use('/api/v1/swimming-pools', swimmingPoolRoutes);

// Handle 404 - Not Found
// app.all('*', (req, res, next) => {
//   next(new ErrorResponse(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
  console.log(`📱 Health check: http://localhost:${PORT}/health`.cyan.underline);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Error: ${err.message}`.red.bold);
  // Close server & exit process
  server.close(() => process.exit(1));
});