import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../server/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'GYMPULSE_BD',
    user: 'postgres',
    password: 'postgres',
    ssl: false
};

async function setupAuth() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the auth SQL script
        const sqlScriptPath = join(__dirname, 'auth-tables.sql');
        let sqlScript = readFileSync(sqlScriptPath, 'utf8');

        console.log('🔄 Creating authentication tables...');

        // Generate real password hashes
        const adminPasswordHash = await hashPassword('admin123');
        const staffPasswordHash = await hashPassword('recepcao123');

        // Replace placeholder hashes with real ones
        sqlScript = sqlScript.replace(
            /'\$2b\$10\$rOQyQ8X8X8X8X8X8X8X8XOMf\.QrOQyQ8X8X8X8X8X8X8XOMf\.QrOQ'/g,
            (match, offset) => {
                // First occurrence gets admin hash, second gets staff hash
                const isFirstOccurrence = sqlScript.indexOf(match) === offset;
                return `'${isFirstOccurrence ? adminPasswordHash : staffPasswordHash}'`;
            }
        );

        try {
            // Execute the script
            await client.query(sqlScript);
            console.log('✅ Authentication tables created successfully!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Authentication tables already exist');
            } else {
                throw error;
            }
        }

        // Verify tables were created
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'auth_%'
      ORDER BY table_name
    `);

        console.log('\n📋 Authentication tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Check users
        const usersResult = await client.query('SELECT email, name, role FROM auth_users');

        console.log('\n👥 Default users:');
        usersResult.rows.forEach(user => {
            console.log(`   - ${user.email} (${user.name}) - ${user.role}`);
        });

        console.log('\n🎉 Authentication setup completed!');
        console.log('\n🔑 Default credentials:');
        console.log('   Admin: admin@gympulse.com / admin123');
        console.log('   Staff: recepcao@gympulse.com / recepcao123');

    } catch (error) {
        console.error('❌ Authentication setup failed:');
        console.error(error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting tips:');
            console.log('   1. Make sure PostgreSQL is running');
            console.log('   2. Check if the database "GYMPULSE_BD" exists');
            console.log('   3. Verify the connection credentials in the script');
        }

        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔐 Database connection closed.');
    }
}

// Run the setup
setupAuth().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 