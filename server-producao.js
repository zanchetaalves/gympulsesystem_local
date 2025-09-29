import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthRoutes, authenticateToken, requireRole } from './server/auth.js';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Porta 3000 para produção unificada

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Em produção, allow any origin ou configure domínios específicos
        callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'GYMPULSE_BD',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: false
};

// Create PostgreSQL client
const pgClient = new Client(dbConfig);

// Connect to database
const connectToDatabase = async () => {
    try {
        await pgClient.connect();
        console.log('✅ Connected to PostgreSQL database successfully');
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL database:', error);
        process.exit(1);
    }
};

// Helper function to execute queries
const query = async (text, params) => {
    try {
        const result = await pgClient.query(text, params);
        return { data: result.rows, error: null };
    } catch (error) {
        console.error('Database query error:', error);
        return { data: null, error: error.message };
    }
};

// Serve static files from React build (ANTES das rotas da API)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
    maxAge: '1y', // Cache estático por 1 ano
    etag: true,
    lastModified: true
}));

// API Routes
const setupAPIRoutes = () => {
    // Health check (unprotected)
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'OK',
            message: 'Gym Pulse Server is running',
            timestamp: new Date().toISOString(),
            environment: 'production'
        });
    });

    // Setup auth routes
    createAuthRoutes(app, pgClient);

    // Auth users management (admin only)
    app.get('/api/auth-users', authenticateToken, requireRole(['admin']), async (req, res) => {
        const { orderBy = 'created_at', ascending = 'false' } = req.query;

        try {
            const result = await query(`SELECT id, email, name, role, created_at FROM auth_users ORDER BY ${orderBy} ${ascending === 'true' ? 'ASC' : 'DESC'}`);
            res.json({ data: result.data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/auth-users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
        const { id } = req.params;
        const data = req.body;

        try {
            const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = [...Object.values(data), id];
            const result = await query(`UPDATE auth_users SET ${setClause} WHERE id = $${values.length} RETURNING id, email, name, role, created_at`, values);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/auth-users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
        const { id } = req.params;

        try {
            const result = await query(`DELETE FROM auth_users WHERE id = $1 RETURNING id, email, name, role`, [id]);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Plan types management (authenticated users)
    app.get('/api/plan_types', authenticateToken, async (req, res) => {
        const { orderBy = 'name', ascending = 'true' } = req.query;

        try {
            const result = await query(`SELECT * FROM plan_types ORDER BY ${orderBy} ${ascending === 'true' ? 'ASC' : 'DESC'}`);
            res.json({ data: result.data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/plan_types', authenticateToken, async (req, res) => {
        const data = req.body;

        try {
            const columns = Object.keys(data).join(', ');
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const result = await query(`INSERT INTO plan_types (${columns}) VALUES (${placeholders}) RETURNING *`, values);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/plan_types/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const data = req.body;

        try {
            const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = [...Object.values(data), id];
            const result = await query(`UPDATE plan_types SET ${setClause}, updated_at = now() WHERE id = $${values.length} RETURNING *`, values);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/plan_types/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const result = await query(`DELETE FROM plan_types WHERE id = $1 RETURNING *`, [id]);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Appointments management
    app.get('/api/appointments', authenticateToken, async (req, res) => {
        const { orderBy = 'appointment_date,appointment_time', ascending = 'true' } = req.query;

        try {
            const result = await query(`
        SELECT a.*, c.name as client_name, u.name as user_name 
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN auth_users u ON a.user_id = u.id
        ORDER BY ${orderBy} ${ascending === 'true' ? 'ASC' : 'DESC'}
      `);
            res.json({ data: result.data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get upcoming appointments (next 5 days)
    app.get('/api/appointments/upcoming', authenticateToken, async (req, res) => {
        try {
            const result = await query(`
        SELECT a.*, c.name as client_name, u.name as user_name 
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN auth_users u ON a.user_id = u.id
        WHERE a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '5 days'
          AND a.status IN ('scheduled', 'confirmed')
        ORDER BY a.appointment_date, a.appointment_time
      `);
            res.json({ data: result.data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/appointments', authenticateToken, async (req, res) => {
        const data = req.body;

        try {
            const columns = Object.keys(data).join(', ');
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const result = await query(`INSERT INTO appointments (${columns}) VALUES (${placeholders}) RETURNING *`, values);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const data = req.body;

        try {
            const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = [...Object.values(data), id];
            const result = await query(`UPDATE appointments SET ${setClause}, updated_at = now() WHERE id = $${values.length} RETURNING *`, values);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
        const { id } = req.params;

        try {
            const result = await query(`DELETE FROM appointments WHERE id = $1 RETURNING *`, [id]);
            res.json({ data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Generic table operations (protected)
    app.get('/api/:table', authenticateToken, async (req, res) => {
        const { table } = req.params;
        const { orderBy = 'created_at', ascending = 'false' } = req.query;

        let sql = `SELECT * FROM ${table}`;
        let joinClause = '';

        // Handle joins for related data
        if (table === 'subscriptions') {
            joinClause = ' LEFT JOIN clients ON subscriptions.client_id = clients.id';
            sql = `SELECT subscriptions.*, 
           clients.id as clients_id, clients.name as clients_name, clients.cpf as clients_cpf, 
           clients.email as clients_email, clients.phone as clients_phone, clients.address as clients_address, 
           clients.birth_date as clients_birth_date, clients.created_at as clients_created_at
           FROM subscriptions${joinClause}`;
        } else if (table === 'payments') {
            joinClause = ` LEFT JOIN subscriptions ON payments.subscription_id = subscriptions.id
                   LEFT JOIN clients ON subscriptions.client_id = clients.id`;
            sql = `SELECT payments.*, 
           subscriptions.id as subscriptions_id, subscriptions.client_id as subscriptions_client_id, 
           subscriptions.plan as subscriptions_plan, subscriptions.start_date as subscriptions_start_date, 
           subscriptions.end_date as subscriptions_end_date, subscriptions.active as subscriptions_active,
           clients.id as clients_id, clients.name as clients_name, clients.cpf as clients_cpf, 
           clients.email as clients_email, clients.phone as clients_phone, clients.address as clients_address, 
           clients.birth_date as clients_birth_date, clients.created_at as clients_created_at
           FROM payments${joinClause}`;
        }

        sql += ` ORDER BY ${table}.${orderBy} ${ascending === 'true' ? 'ASC' : 'DESC'}`;

        const result = await query(sql);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        // Transform joined data back to nested structure
        const transformedData = result.data.map(row => {
            if (table === 'subscriptions' && row.clients_id) {
                return {
                    ...row,
                    clients: {
                        id: row.clients_id,
                        name: row.clients_name,
                        cpf: row.clients_cpf,
                        email: row.clients_email,
                        phone: row.clients_phone,
                        address: row.clients_address,
                        birth_date: row.clients_birth_date,
                        created_at: row.clients_created_at
                    }
                };
            } else if (table === 'payments' && row.subscriptions_id) {
                const result = {
                    ...row,
                    subscriptions: {
                        id: row.subscriptions_id,
                        client_id: row.subscriptions_client_id,
                        plan: row.subscriptions_plan,
                        start_date: row.subscriptions_start_date,
                        end_date: row.subscriptions_end_date,
                        active: row.subscriptions_active
                    }
                };

                if (row.clients_id) {
                    result.subscriptions.clients = {
                        id: row.clients_id,
                        name: row.clients_name,
                        cpf: row.clients_cpf,
                        email: row.clients_email,
                        phone: row.clients_phone,
                        address: row.clients_address,
                        birth_date: row.clients_birth_date,
                        created_at: row.clients_created_at
                    };
                }

                return result;
            }

            return row;
        });

        res.json({ data: transformedData });
    });

    // Get single record (protected)
    app.get('/api/:table/:id', authenticateToken, async (req, res) => {
        const { table, id } = req.params;

        const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ data: result.data[0] || null });
    });

    // Create record (protected)
    app.post('/api/:table', authenticateToken, async (req, res) => {
        const { table } = req.params;
        const data = req.body;

        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ data: result.data[0] });
    });

    // Update record (protected)
    app.put('/api/:table/:id', authenticateToken, async (req, res) => {
        const { table, id } = req.params;
        const data = req.body;

        const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = [...Object.values(data), id];

        const result = await query(
            `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ data: result.data[0] });
    });

    // Delete record (protected)
    app.delete('/api/:table/:id', authenticateToken, async (req, res) => {
        const { table, id } = req.params;

        // Special handling for plans - check for related subscriptions
        if (table === 'plans') {
            const subscriptionCheck = await query(
                `SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = $1`,
                [id]
            );

            if (subscriptionCheck.error) {
                return res.status(500).json({ error: subscriptionCheck.error });
            }

            const subscriptionCount = parseInt(subscriptionCheck.data[0].count);
            if (subscriptionCount > 0) {
                return res.status(400).json({
                    error: `Não é possível excluir este plano pois existem ${subscriptionCount} matrícula(s) associada(s) a ele.`
                });
            }
        }

        const result = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        if (!result.data || result.data.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ data: result.data[0] });
    });

    // RPC endpoints for specific functions
    app.post('/api/rpc/:functionName', async (req, res) => {
        const { functionName } = req.params;

        if (functionName === 'allow_all_ips_db_access') {
            res.json({ data: 'success' });
        } else {
            res.status(404).json({ error: `Function ${functionName} not implemented` });
        }
    });
};

// SPA fallback - DEVE SER A ÚLTIMA ROTA
// Todas as rotas que não são da API devem retornar o index.html para o React Router
app.get('*', (req, res) => {
    // Não aplicar fallback para rotas da API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Para todas as outras rotas, servir o index.html (SPA routing)
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
const startServer = async () => {
    try {
        await connectToDatabase();
        setupAPIRoutes();

        app.listen(PORT, '0.0.0.0', () => {
            console.log('🚀 ===============================================');
            console.log(`🌟 GYM PULSE SYSTEM - PRODUCTION SERVER`);
            console.log('🚀 ===============================================');
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
            console.log(`🔐 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`⚡ Environment: PRODUCTION`);
            console.log(`🗄️ Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
            console.log('🚀 ===============================================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    try {
        await pgClient.end();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error closing database:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    try {
        await pgClient.end();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error closing database:', error);
    }
    process.exit(0);
});

startServer();


