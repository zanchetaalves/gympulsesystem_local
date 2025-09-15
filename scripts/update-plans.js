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

async function updatePlans() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the update SQL script
        const updatePath = join(__dirname, 'update-plans-to-portuguese.sql');
        const updateScript = readFileSync(updatePath, 'utf8');

        console.log('🔄 Updating plans to Portuguese...');

        // Execute the update script
        await client.query(updateScript);

        console.log('✅ Plans updated successfully!');

        // Verify the changes
        console.log('🔍 Verifying updated plans...');

        const result = await client.query('SELECT name, type, price_brl, description, duration_months FROM plans ORDER BY duration_months');

        console.log('\n📋 Current plans:');
        result.rows.forEach(row => {
            console.log(`   - ${row.name} (${row.type}): R$ ${row.price_brl} - ${row.description} - ${row.duration_months} mês(es)`);
        });

    } catch (error) {
        console.error('❌ Update failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

updatePlans().catch(error => {
    console.error('Failed to run update:', error);
    process.exit(1);
});
