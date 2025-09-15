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

async function setupAppointments() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Read the appointments SQL script
        const sqlScriptPath = join(__dirname, 'appointments-table.sql');
        const sqlScript = readFileSync(sqlScriptPath, 'utf8');

        console.log('🔄 Creating appointments table...');

        try {
            // Execute the script
            await client.query(sqlScript);
            console.log('✅ Appointments table created successfully!');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Appointments table already exists');
            } else {
                throw error;
            }
        }

        // Verify table was created
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'appointments'
      ORDER BY table_name
    `);

        console.log('\n📋 Appointments table:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Check appointments
        const appointmentsResult = await client.query(`
      SELECT title, appointment_date, appointment_time, status 
      FROM appointments 
      ORDER BY appointment_date, appointment_time
    `);

        console.log('\n📅 Sample appointments:');
        appointmentsResult.rows.forEach(appointment => {
            console.log(`   - ${appointment.title} - ${appointment.appointment_date} ${appointment.appointment_time} (${appointment.status})`);
        });

        console.log('\n🎉 Appointments setup completed!');

    } catch (error) {
        console.error('❌ Appointments setup failed:');
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
setupAppointments().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 