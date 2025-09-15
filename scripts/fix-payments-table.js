import { Client } from 'pg';

// Database configuration
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'GYMPULSE_BD',
    user: 'postgres',
    password: 'postgres',
    ssl: false
};

async function fixPaymentsTable() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // First, check current structure
        console.log('🔍 Checking current payments table structure...');
        const currentStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'payments'
      ORDER BY ordinal_position
    `);

        console.log('Current columns:');
        currentStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });

        // Drop and recreate the payments table with correct structure
        console.log('\n🔄 Recreating payments table with correct structure...');

        await client.query('DROP TABLE IF EXISTS payments CASCADE');

        await client.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
        payment_date DATE NOT NULL,
        amount NUMERIC NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'paid',
        confirmed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_confirmed ON payments(confirmed)');

        console.log('✅ Payments table recreated successfully!');

        // Verify new structure
        const newStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'payments'
      ORDER BY ordinal_position
    `);

        console.log('\n💰 New payments table structure:');
        newStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
        });

        console.log('\n🎉 Payments table fix completed!');

    } catch (error) {
        console.error('❌ Fix failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔐 Database connection closed.');
    }
}

// Run the fix
fixPaymentsTable().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 