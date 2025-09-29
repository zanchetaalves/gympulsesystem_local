import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthRoutes, authenticateToken, requireRole } from './server/auth.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;

console.log(`🌐 Frontend rodará na porta: ${FRONTEND_PORT}`);
console.log(`📊 Backend rodará na porta: ${BACKEND_PORT}`);

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Proxy para o backend na porta 3001
app.use('/api', createProxyMiddleware({
    target: `http://localhost:${BACKEND_PORT}`,
    changeOrigin: true,
    logLevel: 'info',
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(502).json({
            error: 'Backend não disponível',
            message: `Verifique se o backend está rodando na porta ${BACKEND_PORT}`
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying: ${req.method} ${req.url} → http://localhost:${BACKEND_PORT}${req.url}`);
    }
}));

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - catch all non-API routes
app.use('/', (req, res, next) => {
    // Skip if it's an API route (already handled by proxy)
    if (req.path.startsWith('/api/')) {
        return next();
    }

    // Skip if it's a static file (has extension)
    if (req.path.includes('.')) {
        return next();
    }

    // For all other routes, serve the React app
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const startServer = async () => {
    try {
        app.listen(FRONTEND_PORT, '0.0.0.0', () => {
            console.log('🚀 ===============================================');
            console.log(`🌟 GYM PULSE SYSTEM - PROXY SERVER`);
            console.log('🚀 ===============================================');
            console.log(`🌐 Frontend: http://localhost:${FRONTEND_PORT}`);
            console.log(`📊 Proxy API: http://localhost:${FRONTEND_PORT}/api → Backend:${BACKEND_PORT}`);
            console.log(`🔐 Health Check: http://localhost:${FRONTEND_PORT}/api/health`);
            console.log(`⚡ Environment: PRODUCTION WITH PROXY`);
            console.log('🚀 ===============================================');
            console.log('');
            console.log('📋 Certificar-se de que:');
            console.log(`   ✅ Backend está rodando na porta ${BACKEND_PORT}`);
            console.log(`   ✅ Frontend build está na pasta dist/`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start proxy server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Gracefully shutting down proxy server...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Gracefully shutting down proxy server...');
    process.exit(0);
});

startServer().catch(error => {
    console.error('Failed to start proxy server:', error);
    process.exit(1);
});
