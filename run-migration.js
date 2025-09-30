import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'GYMPULSE_BD',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Step 1: Verify current data
        console.log('\n🔍 Step 1: Checking current subscription data...');
        const checkResult = await client.query(`
            SELECT 
                s.id,
                s.plan as current_plan_text,
                s.plan_id as current_plan_id,
                p.name as plan_name_from_id
            FROM subscriptions s
            LEFT JOIN plans p ON s.plan_id = p.id
            LIMIT 5
        `);

        console.log('Current subscriptions:', checkResult.rows);

        // Step 2: Update plan_id based on plan text (if needed)
        console.log('\n🔧 Step 2: Updating plan_id based on plan text...');
        const updateResult = await client.query(`
            UPDATE subscriptions 
            SET plan_id = (
                SELECT p.id 
                FROM plans p 
                WHERE LOWER(p.name) = LOWER(subscriptions.plan)
                LIMIT 1
            )
            WHERE plan_id IS NULL
        `);

        console.log(`Updated ${updateResult.rowCount} subscriptions with missing plan_id`);

        // Step 3: Remove the plan TEXT column
        console.log('\n🗑️ Step 3: Removing plan TEXT column...');
        await client.query('ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan');
        console.log('✅ Column "plan" removed successfully');

        // Step 4: Verify the fix
        console.log('\n✅ Step 4: Verifying the fix...');
        const verifyResult = await client.query(`
            SELECT 
                s.id,
                s.plan_id,
                p.name as plan_name,
                p.price_brl,
                c.name as client_name
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            JOIN clients c ON s.client_id = c.id
            LIMIT 5
        `);

        console.log('Fixed subscriptions:', verifyResult.rows);
        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.end();
    }
}

runMigration();
