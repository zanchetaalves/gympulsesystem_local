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

async function setupPlanTypes() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the plan types SQL script
        const sqlScriptPath = join(__dirname, 'plan-types-table.sql');
        const sqlScript = readFileSync(sqlScriptPath, 'utf8');

        console.log('🔄 Creating plan types table...');

        try {
            // Execute the script
            await client.query(sqlScript);
            console.log('✅ Plan types table created successfully!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Plan types table already exists');
            } else {
                throw error;
            }
        }

        // Verify tables were created
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'plan_types'
      ORDER BY table_name
    `);

        console.log('\n📋 Plan types table:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Check plan types
        const planTypesResult = await client.query('SELECT name, description FROM plan_types ORDER BY name');

        console.log('\n📊 Available plan types:');
        planTypesResult.rows.forEach(type => {
            console.log(`   - ${type.name}: ${type.description}`);
        });

        console.log('\n🎉 Plan types setup completed!');

    } catch (error) {
        console.error('❌ Plan types setup failed:');
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
setupPlanTypes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 