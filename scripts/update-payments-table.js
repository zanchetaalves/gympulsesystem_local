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

async function updatePaymentsTable() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the SQL script
        const sqlScriptPath = join(__dirname, 'add-confirmed-column.sql');
        const sqlScript = readFileSync(sqlScriptPath, 'utf8');

        console.log('🔄 Updating payments table...');

        try {
            // Execute the script
            await client.query(sqlScript);
            console.log('✅ Payments table updated successfully!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Confirmed column already exists in payments table');
            } else {
                throw error;
            }
        }

        // Verify the column was added
        const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'payments'
      ORDER BY ordinal_position
    `);

        console.log('\n📋 Payments table columns:');
        columnsResult.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
        });

        console.log('\n🎉 Payments table update completed!');

    } catch (error) {
        console.error('❌ Payments table update failed:');
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

// Run the update
updatePaymentsTable().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 