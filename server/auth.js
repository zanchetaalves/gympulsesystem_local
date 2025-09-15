import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Generate password hash
export const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (userId, email, role) => {
    return jwt.sign(
        {
            userId,
            email,
            role,
            type: 'access_token'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verify JWT token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Authentication middleware
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

// Role-based authorization middleware
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Auth routes
export const createAuthRoutes = (app, pgClient) => {
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

    // Register new user
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, name, role = 'user' } = req.body;

            // Validate input
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Email, password, and name are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' });
            }

            // Check if user already exists
            const existingUser = await query('SELECT id FROM auth_users WHERE email = $1', [email]);
            if (existingUser.data && existingUser.data.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            // Hash password
            const passwordHash = await hashPassword(password);

            // Create user
            const result = await query(
                'INSERT INTO auth_users (email, password_hash, name, role, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, created_at',
                [email, passwordHash, name, role, true]
            );

            if (result.error) {
                return res.status(500).json({ error: 'Failed to create user' });
            }

            const user = result.data[0];
            const token = generateToken(user.id, user.email, user.role);

            // Create session
            const sessionToken = uuidv4();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await query(
                'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, sessionToken, expiresAt]
            );

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                access_token: token,
                session_token: sessionToken
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Login user
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Find user
            const result = await query(
                'SELECT id, email, password_hash, name, role FROM auth_users WHERE email = $1',
                [email]
            );

            if (result.error || !result.data || result.data.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = result.data[0];

            // Verify password
            const isPasswordValid = await verifyPassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate tokens
            const token = generateToken(user.id, user.email, user.role);
            const sessionToken = uuidv4();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            // Clean old sessions
            await query('DELETE FROM auth_sessions WHERE user_id = $1', [user.id]);

            // Create new session
            await query(
                'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, sessionToken, expiresAt]
            );

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                access_token: token,
                session_token: sessionToken
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Logout user
    app.post('/api/auth/logout', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.user;

            // Delete all sessions for this user
            await query('DELETE FROM auth_sessions WHERE user_id = $1', [userId]);

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get current user
    app.get('/api/auth/me', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.user;

            const result = await query(
                'SELECT id, email, name, role, created_at FROM auth_users WHERE id = $1',
                [userId]
            );

            if (result.error || !result.data || result.data.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user: result.data[0] });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Refresh token
    app.post('/api/auth/refresh', async (req, res) => {
        try {
            const { session_token } = req.body;

            if (!session_token) {
                return res.status(400).json({ error: 'Session token required' });
            }

            // Find session
            const sessionResult = await query(
                `SELECT s.user_id, s.expires_at, u.email, u.name, u.role 
         FROM auth_sessions s 
         JOIN auth_users u ON s.user_id = u.id 
         WHERE s.token = $1`,
                [session_token]
            );

            if (sessionResult.error || !sessionResult.data || sessionResult.data.length === 0) {
                return res.status(401).json({ error: 'Invalid session token' });
            }

            const session = sessionResult.data[0];

            // Check if session is expired
            if (new Date() > new Date(session.expires_at)) {
                await query('DELETE FROM auth_sessions WHERE token = $1', [session_token]);
                return res.status(401).json({ error: 'Session expired' });
            }

            // Generate new access token
            const token = generateToken(session.user_id, session.email, session.role);

            res.json({
                user: {
                    id: session.user_id,
                    email: session.email,
                    name: session.name,
                    role: session.role
                },
                access_token: token
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}; 