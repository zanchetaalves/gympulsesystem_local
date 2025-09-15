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

async function createMissingTables() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Check if subscriptions table exists
        const subscriptionsCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'subscriptions'
    `);

        if (subscriptionsCheck.rows.length === 0) {
            console.log('🔄 Creating subscriptions table...');
            await client.query(`
        CREATE TABLE subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `);

            await client.query('CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON subscriptions(client_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id)');

            console.log('✅ Subscriptions table created successfully!');
        } else {
            console.log('✅ Subscriptions table already exists');
        }

        // List all tables to verify
        const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('\n📋 All tables in database:');
        allTables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n🎉 Database verification completed!');

    } catch (error) {
        console.error('❌ Operation failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔐 Database connection closed.');
    }
}

// Run the check/creation
createMissingTables().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 