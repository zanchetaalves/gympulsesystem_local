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

async function cleanAndUpdatePlans() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the clean and update SQL script
        const cleanPath = join(__dirname, 'clean-and-update-plans.sql');
        const cleanScript = readFileSync(cleanPath, 'utf8');

        console.log('🔄 Cleaning all plans and inserting correct ones...');
        console.log('⚠️  This will remove ALL existing plans!');

        // Execute the clean script
        await client.query(cleanScript);

        console.log('✅ Plans cleaned and updated successfully!');

        // Verify the changes
        console.log('🔍 Verifying final plans...');

        const result = await client.query('SELECT name, type, price_brl, description, duration_months FROM plans ORDER BY duration_months');

        console.log('\n📋 Final plans (should be exactly 3):');
        result.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.name} (${row.type}): R$ ${row.price_brl} - ${row.description} - ${row.duration_months} mês(es)`);
        });

        console.log(`\n✅ Total plans: ${result.rows.length}`);

    } catch (error) {
        console.error('❌ Clean and update failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

cleanAndUpdatePlans().catch(error => {
    console.error('Failed to run clean and update:', error);
    process.exit(1);
});
