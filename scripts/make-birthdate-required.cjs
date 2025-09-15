const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'GYMPULSE_BD',
  password: 'postgres',
  port: 5432,
});

async function makeBirthdateRequired() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Fazendo backup e alterando coluna birth_date...');
    
    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'make-birthdate-required.sql'), 
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✅ Coluna birth_date agora é obrigatória!');
    console.log('⚠️  Registros com birth_date NULL foram definidos como 1900-01-01');
    
    // Test with a simple query
    const result = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'birth_date'
    `);
    
    console.log('📋 Estrutura da coluna birth_date:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the migration
makeBirthdateRequired()
  .then(() => {
    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  });
