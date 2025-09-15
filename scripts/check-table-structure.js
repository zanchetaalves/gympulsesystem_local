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

async function checkTableStructure() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Check all tables
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('\n📋 All tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Check payments table structure
        const paymentsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'payments'
      ORDER BY ordinal_position
    `);

        console.log('\n💰 Payments table structure:');
        if (paymentsResult.rows.length === 0) {
            console.log('   ❌ Payments table does not exist!');
        } else {
            paymentsResult.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
            });
        }

        // Check if payments table exists and has data
        try {
            const countResult = await client.query('SELECT COUNT(*) FROM payments');
            console.log(`\n📊 Payments table has ${countResult.rows[0].count} records`);
        } catch (error) {
            console.log('\n❌ Error accessing payments table:', error.message);
        }

    } catch (error) {
        console.error('❌ Database check failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔐 Database connection closed.');
    }
}

// Run the check
checkTableStructure().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 