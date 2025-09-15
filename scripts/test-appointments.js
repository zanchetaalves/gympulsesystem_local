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

async function testAppointments() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Check if appointments table exists and has data
        const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'appointments'
    `);

        if (tableCheck.rows.length === 0) {
            console.log('❌ Appointments table does not exist!');
            return;
        }

        console.log('✅ Appointments table exists');

        // Get all appointments
        const appointmentsResult = await client.query(`
      SELECT a.*, c.name as client_name, u.name as user_name 
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN auth_users u ON a.user_id = u.id
      ORDER BY a.appointment_date, a.appointment_time
    `);

        console.log(`\n📅 Found ${appointmentsResult.rows.length} appointments:`);
        appointmentsResult.rows.forEach((appointment, index) => {
            console.log(`\n${index + 1}. ${appointment.title}`);
            console.log(`   Date: ${appointment.appointment_date}`);
            console.log(`   Time: ${appointment.appointment_time}`);
            console.log(`   Duration: ${appointment.duration_minutes} minutes`);
            console.log(`   Status: ${appointment.status}`);
            console.log(`   Client: ${appointment.client_name || 'No client'}`);
            console.log(`   User: ${appointment.user_name || 'No user'}`);
            console.log(`   Raw appointment:`, JSON.stringify(appointment, null, 2));
        });

        console.log('\n🎉 Appointments test completed!');

    } catch (error) {
        console.error('❌ Test failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔐 Database connection closed.');
    }
}

// Run the test
testAppointments().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 