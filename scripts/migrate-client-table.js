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

async function migrateClientTable() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the migration SQL script
        const migrationPath = join(__dirname, 'migrate-client-nullable.sql');
        const migrationScript = readFileSync(migrationPath, 'utf8');

        console.log('🔄 Applying client table migration...');

        // Execute the migration script
        await client.query(migrationScript);

        console.log('✅ Client table migration completed successfully!');

        // Verify the changes
        console.log('🔍 Verifying table structure...');

        const result = await client.query(`
            SELECT 
                column_name, 
                is_nullable, 
                data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clients' 
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Updated client table structure:');
        result.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
            console.log(`   - ${row.column_name}: ${row.data_type} ${nullable}`);
        });

        // Check constraints
        const constraintResult = await client.query(`
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = 'clients'::regclass
        `);

        console.log('\n🔒 Table constraints:');
        constraintResult.rows.forEach(row => {
            const type = {
                'p': 'PRIMARY KEY',
                'u': 'UNIQUE',
                'f': 'FOREIGN KEY',
                'c': 'CHECK'
            }[row.contype] || row.contype;
            console.log(`   - ${row.conname}: ${type}`);
        });

        // Test inserting a minimal record
        console.log('\n🧪 Testing minimal client insertion...');

        try {
            const testResult = await client.query(`
                INSERT INTO clients (name, phone) 
                VALUES ('Teste Cliente', '11999999999') 
                RETURNING id, name, phone
            `);

            console.log('✅ Minimal client insertion successful:', testResult.rows[0]);

            // Clean up test record
            await client.query('DELETE FROM clients WHERE name = $1', ['Teste Cliente']);
            console.log('✅ Test record cleaned up');

        } catch (testError) {
            console.error('❌ Test insertion failed:', testError.message);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrateClientTable().catch(error => {
    console.error('Failed to run migration:', error);
    process.exit(1);
});


