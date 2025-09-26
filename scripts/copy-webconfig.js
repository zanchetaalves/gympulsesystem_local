/**
 * Script para copiar automaticamente o web.config correto para a pasta dist durante o build
 * Evita o erro HTTP 500.19 de mimeMap duplicado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourceWebConfig = path.join(projectRoot, 'web.config');
const targetWebConfig = path.join(projectRoot, 'dist', 'web.config');
const distPath = path.join(projectRoot, 'dist');

console.log('📁 Copiando web.config para a pasta dist...');

try {
    // Verificar se a pasta dist existe
    if (!fs.existsSync(distPath)) {
        console.error('❌ Pasta dist não encontrada! Execute o build primeiro.');
        process.exit(1);
    }

    // Verificar se o web.config de origem existe
    if (!fs.existsSync(sourceWebConfig)) {
        console.error('❌ web.config de origem não encontrado na raiz do projeto!');
        process.exit(1);
    }

    // Copiar o arquivo
    fs.copyFileSync(sourceWebConfig, targetWebConfig);

    console.log('✅ web.config copiado com sucesso!');
    console.log(`📂 Origem: ${sourceWebConfig}`);
    console.log(`📂 Destino: ${targetWebConfig}`);

    // Verificar o conteúdo para confirmar que não tem mimeMap duplicado
    const content = fs.readFileSync(targetWebConfig, 'utf8');

    if (content.includes('<staticContent>')) {
        console.warn('⚠️  ATENÇÃO: web.config ainda contém seção <staticContent>');
        console.warn('   Isso pode causar erro HTTP 500.19 em servidores com IIS moderno');
    } else {
        console.log('✅ web.config limpo - sem mimeMaps duplicados');
    }

    console.log('🚀 Build concluído com sucesso!');

} catch (error) {
    console.error('❌ Erro ao copiar web.config:', error.message);
    process.exit(1);
}

