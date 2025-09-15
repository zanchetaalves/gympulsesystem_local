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

async function testClientDeletion() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // First, create a test client
        console.log('🔄 Creating test client...');
        const insertResult = await client.query(`
            INSERT INTO clients (name, phone, email, cpf, address) 
            VALUES ('Cliente Teste Exclusão', '11999999999', 'teste@exclusao.com', '12345678901', 'Endereço Teste') 
            RETURNING id, name
        `);

        const testClientId = insertResult.rows[0].id;
        console.log('✅ Test client created:', insertResult.rows[0]);

        // Check for any related records before deletion
        console.log('🔍 Checking for related records...');

        const appointmentsCheck = await client.query(`
            SELECT COUNT(*) as count FROM appointments WHERE client_id = $1
        `, [testClientId]);
        console.log(`   - Appointments: ${appointmentsCheck.rows[0].count}`);

        const subscriptionsCheck = await client.query(`
            SELECT COUNT(*) as count FROM subscriptions WHERE client_id = $1
        `, [testClientId]);
        console.log(`   - Subscriptions: ${subscriptionsCheck.rows[0].count}`);

        // Try to delete the client
        console.log('🔄 Attempting to delete test client...');
        const deleteResult = await client.query(`
            DELETE FROM clients WHERE id = $1 RETURNING id, name
        `, [testClientId]);

        if (deleteResult.rows.length > 0) {
            console.log('✅ Client deleted successfully:', deleteResult.rows[0]);
        } else {
            console.log('❌ No client was deleted - may not exist or deletion was blocked');
        }

        // Verify deletion
        const verifyResult = await client.query(`
            SELECT id, name FROM clients WHERE id = $1
        `, [testClientId]);

        if (verifyResult.rows.length === 0) {
            console.log('✅ Deletion confirmed - client no longer exists');
        } else {
            console.log('❌ Client still exists after deletion attempt:', verifyResult.rows[0]);
        }

        // Check constraints that might prevent deletion
        console.log('🔍 Checking foreign key constraints...');
        const constraintsResult = await client.query(`
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu 
                ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.referential_constraints AS rc 
                ON tc.constraint_name = rc.constraint_name
            WHERE ccu.table_name = 'clients'
        `);

        console.log('📋 Foreign key constraints referencing clients:');
        constraintsResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}.${row.column_name} -> clients.${row.foreign_column_name} (${row.delete_rule})`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await client.end();
    }
}

testClientDeletion().catch(error => {
    console.error('Failed to run test:', error);
    process.exit(1);
});
