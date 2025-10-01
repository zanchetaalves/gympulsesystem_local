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

        // Step 1: Verificar se a coluna 'plan' existe
        console.log('\n🔍 Step 1: Verificando estrutura da tabela subscriptions...');
        const checkColumnResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            AND column_name = 'plan'
        `);

        if (checkColumnResult.rows.length > 0) {
            console.log('✅ Coluna "plan" encontrada - precisa ser removida');

            // Step 2: Remover a coluna plan TEXT
            console.log('\n🗑️ Step 2: Removendo coluna "plan" (texto desnecessário)...');
            await client.query('ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan');
            console.log('✅ Coluna "plan" removida com sucesso');
        } else {
            console.log('✅ Coluna "plan" já foi removida anteriormente');
        }

        // Step 2.5: Adicionar coluna observations na tabela clients (se não existir)
        console.log('\n🔍 Step 2.5: Verificando coluna observations na tabela clients...');
        const checkObservationsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clients' 
            AND column_name = 'observations'
        `);

        if (checkObservationsResult.rows.length === 0) {
            console.log('➕ Adicionando coluna "observations" na tabela clients...');
            await client.query(`
                ALTER TABLE clients 
                ADD COLUMN observations TEXT CHECK (length(observations) <= 500)
            `);
            console.log('✅ Coluna "observations" adicionada com sucesso (máx 500 chars)');
        } else {
            console.log('✅ Coluna "observations" já existe na tabela clients');
        }

        // Step 3: Verificar se a estrutura está correta
        console.log('\n✅ Step 3: Verificando estrutura final...');

        // Verificar subscriptions
        const subscriptionsStructure = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            AND column_name IN ('plan_id', 'client_id')
            ORDER BY column_name
        `);

        console.log('Estrutura da tabela subscriptions:');
        subscriptionsStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // Verificar clients
        const clientsStructure = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'clients' 
            AND column_name = 'observations'
        `);

        console.log('Estrutura da tabela clients (observations):');
        clientsStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        console.log('\n🎉 Migração de estrutura concluída com sucesso!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.end();
    }
}

runMigration();
