import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function setupDatabase() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the SQL setup script
        const sqlScriptPath = join(__dirname, '..', 'database-setup.sql');
        const sqlScript = readFileSync(sqlScriptPath, 'utf8');

        console.log('🔄 Executing database setup script...');

        try {
            // Execute the entire script at once
            await client.query(sqlScript);
            console.log('✅ SQL script executed successfully!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Some objects already exist, continuing...');
            } else {
                throw error;
            }
        }

        // Apply client table migration if needed
        console.log('🔄 Checking if client table migration is needed...');

        try {
            // Check if clients table has the old structure (CPF NOT NULL)
            const columnInfo = await client.query(`
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'clients' AND column_name = 'cpf'
            `);

            if (columnInfo.rows.length > 0 && columnInfo.rows[0].is_nullable === 'NO') {
                console.log('🔄 Applying client table migration...');

                // Read and execute migration script
                const migrationPath = join(__dirname, 'migrate-client-nullable.sql');
                const migrationScript = readFileSync(migrationPath, 'utf8');
                await client.query(migrationScript);

                console.log('✅ Client table migration completed!');
            } else {
                console.log('✅ Client table structure is up to date');
            }
        } catch (migrationError) {
            console.log('⚠️  Migration check failed, but continuing:', migrationError.message);
        }

        console.log('🎉 Database setup completed successfully!');

        // Verify tables were created
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('\n📋 Created tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Check sample data
        const plansResult = await client.query('SELECT COUNT(*) as count FROM plans');
        const usersResult = await client.query('SELECT COUNT(*) as count FROM users');

        console.log('\n📊 Sample data:');
        console.log(`   - Plans: ${plansResult.rows[0].count} records`);
        console.log(`   - Users: ${usersResult.rows[0].count} records`);

    } catch (error) {
        console.error('❌ Database setup failed:');
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
setupDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 