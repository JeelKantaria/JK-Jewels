import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/index.js';
import prisma from './lib/prisma.js';
import { getRedis, closeRedis } from './lib/redis.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

// Validate environment
validateConfig();

const app = express();

// Trust proxy (for rate limiting behind nginx/load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected');

        // Initialize Redis (optional - app works without it)
        try {
            const redis = getRedis();
            await redis.connect();
        } catch (redisError) {
            console.warn('⚠️ Redis not available - caching disabled');
        }

        // Start listening
        app.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏆 J.K. JEWELS API SERVER                               ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(41)}║
║   Port: ${config.port.toString().padEnd(49)}║
║   Frontend: ${config.frontendUrl.padEnd(45)}║
║                                                           ║
║   API: http://localhost:${config.port}/api                       ║
║   Health: http://localhost:${config.port}/api/health             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    await closeRedis();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | unknown, promise: Promise<unknown>) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Don't exit in production, but log for monitoring
    if (config.isDev) {
        // In development, exit to make the error obvious
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    // Always exit on uncaught exceptions as the app may be in an unstable state
    process.exit(1);
});

startServer();

export default app;
