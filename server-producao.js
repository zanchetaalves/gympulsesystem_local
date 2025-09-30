import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthRoutes, authenticateToken, requireRole } from './server/auth.js';

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'GYMPULSE_BD',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
};

let client;

// Database connection
const connectToDatabase = async () => {
    try {
        client = new Client(dbConfig);
        await client.connect();
        console.log('✅ Connected to PostgreSQL database successfully');
        console.log(`🗄️ Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error);
        throw error;
    }
};

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

// API Routes Setup
const setupAPIRoutes = () => {
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: 'production',
            database: 'connected',
            port: PORT
        });
    });

    // Auth routes
    createAuthRoutes(app, client);

    // Plans routes
    app.get('/api/plans', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT p.*, pt.name as plan_type_name 
                FROM plans p 
                LEFT JOIN plan_types pt ON p.plan_type_id = pt.id 
                ORDER BY p.id
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching plans:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/plans', authenticateToken, async (req, res) => {
        try {
            const { name, type, price_brl, description, duration_months, active = true, plan_type_id } = req.body;

            // Validações
            if (!name || !type || !price_brl || !duration_months) {
                return res.status(400).json({
                    error: 'Name, type, price_brl and duration_months are required'
                });
            }

            const result = await client.query(
                'INSERT INTO plans (name, type, price_brl, description, duration_months, active, plan_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [name, type, price_brl, description, duration_months, active, plan_type_id]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating plan:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/plans/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, type, price_brl, description, duration_months, active, plan_type_id } = req.body;

            const result = await client.query(
                'UPDATE plans SET name = $1, type = $2, price_brl = $3, description = $4, duration_months = $5, active = $6, plan_type_id = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
                [name, type, price_brl, description, duration_months, active, plan_type_id, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Plan not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating plan:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/plans/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await client.query('DELETE FROM plans WHERE id = $1', [id]);
            res.json({ message: 'Plan deleted successfully' });
        } catch (error) {
            console.error('Error deleting plan:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Plan Types routes
    app.get('/api/plan-types', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM plan_types ORDER BY id');
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching plan types:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/plan-types', authenticateToken, async (req, res) => {
        try {
            const { name, description } = req.body;
            const result = await client.query(
                'INSERT INTO plan_types (name, description) VALUES ($1, $2) RETURNING *',
                [name, description]
            );
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error creating plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/plan-types/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const result = await client.query(
                'UPDATE plan_types SET name = $1, description = $2 WHERE id = $3 RETURNING *',
                [name, description, id]
            );
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/plan-types/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await client.query('DELETE FROM plan_types WHERE id = $1', [id]);
            res.json({ message: 'Plan type deleted successfully' });
        } catch (error) {
            console.error('Error deleting plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Clients routes
    app.get('/api/clients', async (req, res) => {
        try {
            const { search } = req.query;
            let query = 'SELECT * FROM clients';
            let params = [];

            if (search) {
                query += ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1';
                params = [`%${search}%`];
            }

            query += ' ORDER BY id DESC';

            const result = await client.query(query, params);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/clients', authenticateToken, async (req, res) => {
        try {
            const { name, cpf, email, phone, address, birth_date, photo_url } = req.body;

            // Validações
            if (!name || !phone || !birth_date) {
                return res.status(400).json({
                    error: 'Name, phone and birth_date are required'
                });
            }

            const result = await client.query(
                'INSERT INTO clients (name, cpf, email, phone, address, birth_date, photo_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [name, cpf, email, phone, address, birth_date, photo_url]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/clients/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, cpf, email, phone, address, birth_date, photo_url } = req.body;

            const result = await client.query(
                'UPDATE clients SET name = $1, cpf = $2, email = $3, phone = $4, address = $5, birth_date = $6, photo_url = $7 WHERE id = $8 RETURNING *',
                [name, cpf, email, phone, address, birth_date, photo_url, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await client.query('DELETE FROM clients WHERE id = $1', [id]);
            res.json({ message: 'Client deleted successfully' });
        } catch (error) {
            console.error('Error deleting client:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Payments routes (CORRIGIDO - payments -> subscriptions -> clients)
    app.get('/api/payments', async (req, res) => {
        try {
            const { client_id } = req.query;
            let query = `
                SELECT 
                    p.*,
                    COALESCE(c.name, 'Cliente não encontrado') as client_name,
                    COALESCE(pl.name, 'Plano não encontrado') as plan_name,
                    s.id as subscription_id,
                    s.plan as subscription_plan,
                    c.id as client_id_real
                FROM payments p 
                LEFT JOIN subscriptions s ON p.subscription_id = s.id
                LEFT JOIN clients c ON s.client_id = c.id 
                LEFT JOIN plans pl ON s.plan_id = pl.id
            `;
            let params = [];

            if (client_id) {
                query += ' WHERE s.client_id = $1';
                params = [client_id];
            }

            query += ' ORDER BY p.payment_date DESC, p.created_at DESC';

            const result = await client.query(query, params);

            // Debug: Log para identificar problemas
            console.log(`[DEBUG] Payments query returned ${result.rows.length} rows`);
            if (result.rows.length > 0) {
                const firstRow = result.rows[0];
                console.log(`[DEBUG] First payment: subscription_id=${firstRow.subscription_id}, client_name=${firstRow.client_name}`);
            }

            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching payments:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/payments', authenticateToken, async (req, res) => {
        try {
            const { subscription_id, payment_date, amount, payment_method, status = 'paid' } = req.body;

            // Validações
            if (!subscription_id || !payment_date || !amount || !payment_method) {
                return res.status(400).json({
                    error: 'subscription_id, payment_date, amount and payment_method are required'
                });
            }

            const result = await client.query(
                'INSERT INTO payments (subscription_id, payment_date, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [subscription_id, payment_date, amount, payment_method, status]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Subscriptions routes
    app.get('/api/subscriptions', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT s.*, c.name as client_name, p.name as plan_name
                FROM subscriptions s
                LEFT JOIN clients c ON s.client_id = c.id
                LEFT JOIN plans p ON s.plan_id = p.id
                ORDER BY s.created_at DESC
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/subscriptions', authenticateToken, async (req, res) => {
        try {
            const { client_id, plan_id, plan, start_date, end_date, active = true, locked = false, lock_days } = req.body;

            // Validações
            if (!client_id || !plan_id || !plan || !start_date || !end_date) {
                return res.status(400).json({
                    error: 'client_id, plan_id, plan, start_date and end_date are required'
                });
            }

            const result = await client.query(
                'INSERT INTO subscriptions (client_id, plan_id, plan, start_date, end_date, active, locked, lock_days) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [client_id, plan_id, plan, start_date, end_date, active, locked, lock_days]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating subscription:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Appointments routes
    app.get('/api/appointments', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT a.*, c.name as client_name 
                FROM appointments a 
                LEFT JOIN clients c ON a.client_id = c.id 
                ORDER BY a.appointment_date DESC
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/appointments/upcoming', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT a.*, c.name as client_name 
                FROM appointments a 
                LEFT JOIN clients c ON a.client_id = c.id 
                WHERE a.appointment_date >= CURRENT_DATE
                ORDER BY a.appointment_date ASC
                LIMIT 10
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/appointments', authenticateToken, async (req, res) => {
        try {
            const {
                title,
                description,
                appointment_date,
                appointment_time,
                duration_minutes = 60,
                client_id,
                user_id,
                status = 'scheduled',
                reminder_sent = false
            } = req.body;

            // Validações
            if (!title || !appointment_date || !appointment_time || !user_id) {
                return res.status(400).json({
                    error: 'title, appointment_date, appointment_time and user_id are required'
                });
            }

            const result = await client.query(
                'INSERT INTO appointments (title, description, appointment_date, appointment_time, duration_minutes, client_id, user_id, status, reminder_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                [title, description, appointment_date, appointment_time, duration_minutes, client_id, user_id, status, reminder_sent]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT e DELETE para subscriptions
    app.put('/api/subscriptions/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { client_id, plan_id, plan, start_date, end_date, active, locked, lock_days } = req.body;

            const result = await client.query(
                'UPDATE subscriptions SET client_id = $1, plan_id = $2, plan = $3, start_date = $4, end_date = $5, active = $6, locked = $7, lock_days = $8 WHERE id = $9 RETURNING *',
                [client_id, plan_id, plan, start_date, end_date, active, locked, lock_days, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating subscription:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/subscriptions/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await client.query('DELETE FROM subscriptions WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            res.json({ message: 'Subscription deleted successfully' });
        } catch (error) {
            console.error('Error deleting subscription:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT e DELETE para payments
    app.put('/api/payments/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { subscription_id, payment_date, amount, payment_method, status } = req.body;

            const result = await client.query(
                'UPDATE payments SET subscription_id = $1, payment_date = $2, amount = $3, payment_method = $4, status = $5 WHERE id = $6 RETURNING *',
                [subscription_id, payment_date, amount, payment_method, status, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating payment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await client.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            res.json({ message: 'Payment deleted successfully' });
        } catch (error) {
            console.error('Error deleting payment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT e DELETE para appointments
    app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, appointment_date, appointment_time, duration_minutes, client_id, user_id, status, reminder_sent } = req.body;

            const result = await client.query(
                'UPDATE appointments SET title = $1, description = $2, appointment_date = $3, appointment_time = $4, duration_minutes = $5, client_id = $6, user_id = $7, status = $8, reminder_sent = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *',
                [title, description, appointment_date, appointment_time, duration_minutes, client_id, user_id, status, reminder_sent, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating appointment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await client.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.json({ message: 'Appointment deleted successfully' });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Plan Types routes
    app.get('/api/plan_types', async (req, res) => {
        try {
            const { orderBy = 'name', ascending = 'true' } = req.query;
            const order = ascending === 'true' ? 'ASC' : 'DESC';

            // Validar campo de ordenação
            const validOrderFields = ['name', 'created_at', 'updated_at'];
            const orderField = validOrderFields.includes(orderBy) ? orderBy : 'name';

            const result = await client.query(
                `SELECT * FROM plan_types ORDER BY ${orderField} ${order}`
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching plan types:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/plan_types/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await client.query('SELECT * FROM plan_types WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Plan type not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/plan_types', authenticateToken, async (req, res) => {
        try {
            const { name, description, active = true } = req.body;

            // Validações
            if (!name) {
                return res.status(400).json({
                    error: 'Name is required'
                });
            }

            const result = await client.query(
                'INSERT INTO plan_types (name, description, active) VALUES ($1, $2, $3) RETURNING *',
                [name, description, active]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/plan_types/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, active } = req.body;

            const result = await client.query(
                'UPDATE plan_types SET name = $1, description = $2, active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
                [name, description, active, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Plan type not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/plan_types/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const result = await client.query('DELETE FROM plan_types WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Plan type not found' });
            }

            res.json({ message: 'Plan type deleted successfully' });
        } catch (error) {
            console.error('Error deleting plan type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Users routes (admin only)
    app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
        try {
            const result = await client.query('SELECT id, username, email, role, created_at FROM users ORDER BY id');
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Serve static files from dist folder
    app.use(express.static(path.join(__dirname, 'dist')));

    // Handle React Router - catch all non-API routes
    app.use('/', (req, res, next) => {
        // Skip if it's an API route
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

    // 404 handler for API routes
    app.use('/api/', (req, res) => {
        res.status(404).json({ error: 'API endpoint not found' });
    });
};

// Start server
const startServer = async () => {
    try {
        await connectToDatabase();
        setupAPIRoutes();

        app.listen(PORT, '0.0.0.0', () => {
            console.log('🚀 ===============================================');
            console.log(`🌟 GYM PULSE SYSTEM - PRODUCTION SERVER`);
            console.log('🚀 ===============================================');
            console.log(`🌐 Application: http://localhost:${PORT}`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
            console.log(`🔐 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`⚡ Environment: PRODUCTION`);
            console.log(`🗄️ Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
            console.log('🚀 ===============================================');
            console.log('');
            console.log('✅ VANTAGENS DESTA SOLUÇÃO:');
            console.log('   - Frontend mantém URLs originais (localhost:3001)');
            console.log('   - Nunca mais alterar URLs manualmente');
            console.log('   - Atualizações sem problemas');
            console.log('   - Estrutura correta: payments -> subscriptions -> clients');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Gracefully shutting down server...');
    if (client) {
        await client.end();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Gracefully shutting down server...');
    if (client) {
        await client.end();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});