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

async function addSubscriptionLockFields() {
    const client = new Client(dbConfig);

    try {
        console.log('🔄 Conectando ao banco PostgreSQL...');
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL com sucesso!');

        console.log('\n🔍 Verificando estrutura atual da tabela subscriptions...');

        // Verificar estrutura atual
        const currentStructure = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);

        console.log('📋 Colunas atuais:');
        currentStructure.rows.forEach(row => {
            console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });

        // Verificar se os campos já existem
        const hasLocked = currentStructure.rows.some(row => row.column_name === 'locked');
        const hasLockDays = currentStructure.rows.some(row => row.column_name === 'lock_days');

        console.log('\n🔧 Aplicando migração...');

        // Adicionar campo 'locked' se não existir
        if (!hasLocked) {
            await client.query(`
                ALTER TABLE subscriptions 
                ADD COLUMN locked BOOLEAN DEFAULT false
            `);
            console.log('✅ Campo "locked" adicionado com sucesso');
        } else {
            console.log('ℹ️  Campo "locked" já existe');
        }

        // Adicionar campo 'lock_days' se não existir
        if (!hasLockDays) {
            await client.query(`
                ALTER TABLE subscriptions 
                ADD COLUMN lock_days INTEGER NULL
            `);
            console.log('✅ Campo "lock_days" adicionado com sucesso');
        } else {
            console.log('ℹ️  Campo "lock_days" já existe');
        }

        // Adicionar comentários nos campos
        if (!hasLocked) {
            await client.query(`
                COMMENT ON COLUMN subscriptions.locked 
                IS 'Indica se a matrícula está trancada temporariamente'
            `);
        }

        if (!hasLockDays) {
            await client.query(`
                COMMENT ON COLUMN subscriptions.lock_days 
                IS 'Quantidade de dias de trancamento a ser adicionada na data de término'
            `);
        }

        // Criar índice para performance (apenas se campo foi adicionado)
        if (!hasLocked) {
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_subscriptions_locked 
                ON subscriptions(locked) 
                WHERE locked = true
            `);
            console.log('✅ Índice para campo "locked" criado');
        }

        // Atualizar registros existentes com valores padrão
        const updateResult = await client.query(`
            UPDATE subscriptions 
            SET locked = false 
            WHERE locked IS NULL
        `);

        if (updateResult.rowCount > 0) {
            console.log(`✅ ${updateResult.rowCount} registros atualizados com locked = false`);
        }

        // Limpar lock_days onde locked = false
        const cleanupResult = await client.query(`
            UPDATE subscriptions 
            SET lock_days = NULL 
            WHERE lock_days IS NOT NULL AND locked = false
        `);

        if (cleanupResult.rowCount > 0) {
            console.log(`✅ ${cleanupResult.rowCount} registros com lock_days limpos`);
        }

        console.log('\n🔍 Verificando estrutura final...');

        // Verificar estrutura final
        const finalStructure = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                col_description(pgc.oid, ordinal_position) as column_comment
            FROM information_schema.columns isc
            LEFT JOIN pg_class pgc ON pgc.relname = isc.table_name
            WHERE table_name = 'subscriptions' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);

        console.log('📋 Estrutura final da tabela subscriptions:');
        finalStructure.rows.forEach(row => {
            const comment = row.column_comment ? ` // ${row.column_comment}` : '';
            console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default || 'null'})${comment}`);
        });

        // Verificar quantidade de registros
        const countResult = await client.query('SELECT COUNT(*) as total FROM subscriptions');
        const total = countResult.rows[0].total;
        console.log(`\n📊 Total de matrículas na tabela: ${total}`);

        if (total > 0) {
            // Mostrar estatísticas dos campos novos
            const statsResult = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN locked = true THEN 1 END) as locked_count,
                    COUNT(CASE WHEN lock_days IS NOT NULL THEN 1 END) as with_lock_days
                FROM subscriptions
            `);

            const stats = statsResult.rows[0];
            console.log(`   - Matrículas trancadas: ${stats.locked_count}`);
            console.log(`   - Matrículas com dias de trancamento: ${stats.with_lock_days}`);
        }

        console.log('\n🎉 Migração concluída com sucesso!');
        console.log('\n💡 Agora você pode:');
        console.log('   1. Editar matrículas existentes');
        console.log('   2. Marcar o checkbox "Trancar"');
        console.log('   3. Informar quantidade de dias');
        console.log('   4. Ver a data de término atualizada automaticamente');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error.message);
        console.error('\n🔧 Possíveis soluções:');
        console.error('   1. Verificar se o PostgreSQL está rodando');
        console.error('   2. Verificar credenciais do banco');
        console.error('   3. Verificar se o banco GYMPULSE_BD existe');
        console.error('   4. Verificar permissões do usuário postgres');
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Conexão com banco encerrada');
    }
}

// Executar migração
addSubscriptionLockFields();
