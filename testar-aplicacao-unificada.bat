@echo off
chcp 65001 >nul
echo.
echo 🧪 TESTE COMPLETO - APLICAÇÃO UNIFICADA
echo ========================================
echo.

echo 📋 1. VERIFICANDO SERVIÇO WINDOWS...
echo.

echo 🔍 Status do serviço:
sc query GymPulseUnified 2>nul | findstr STATE
if %errorlevel% neq 0 (
    echo ❌ Serviço GymPulseUnified não encontrado
    echo 💡 Execute: .\migrar-para-node-unificado.bat
    pause
    exit /b 1
)

echo.
echo 📋 2. TESTANDO CONECTIVIDADE...
echo.

echo 🌐 Porta 3000 (Aplicação Unificada):
netstat -an | findstr :3000
if %errorlevel% neq 0 (
    echo ❌ Porta 3000 não está ativa
    echo 💡 Iniciando serviço...
    sc start GymPulseUnified
    echo ⏱️ Aguardando 20 segundos...
    timeout /t 20 /nobreak
) else (
    echo ✅ Porta 3000 ativa
)

echo.
echo 📋 3. TESTANDO ENDPOINTS...
echo.

echo 🔊 Testando Health Check:
curl -s http://localhost:3000/api/health
if %errorlevel% equ 0 (
    echo.
    echo ✅ API Health Check funcionando
) else (
    echo ❌ API não responde
)

echo.
echo 🌐 Testando Frontend (index.html):
curl -s -I http://localhost:3000/ | findstr "200 OK"
if %errorlevel% equ 0 (
    echo ✅ Frontend carregando
) else (
    echo ❌ Frontend não responde
)

echo.
echo 🔐 Testando rota de login:
curl -s -I http://localhost:3000/login | findstr "200 OK"
if %errorlevel% equ 0 (
    echo ✅ Rota /login funcionando (SPA routing)
) else (
    echo ❌ SPA routing com problema
)

echo.
echo 📊 Testando rota de clientes:
curl -s -I http://localhost:3000/clientes | findstr "200 OK"
if %errorlevel% equ 0 (
    echo ✅ Rota /clientes funcionando
) else (
    echo ❌ Rota /clientes com problema
)

echo.
echo 📋 4. VERIFICANDO ARQUIVOS...
echo.

echo 📁 Estrutura de produção:
if exist "C:\gym-pulse-production\server-producao.js" (
    echo ✅ server-producao.js
) else (
    echo ❌ server-producao.js ausente
)

if exist "C:\gym-pulse-production\dist\index.html" (
    echo ✅ Frontend (dist/index.html)
) else (
    echo ❌ Frontend ausente
)

if exist "C:\gym-pulse-production\server\auth.js" (
    echo ✅ Módulo de autenticação
) else (
    echo ❌ auth.js ausente
)

if exist "C:\gym-pulse-production\.env" (
    echo ✅ Configurações (.env)
) else (
    echo ❌ .env ausente
)

echo.
echo 📋 5. TESTANDO BANCO DE DADOS...
echo.

echo 🗄️ Testando conexão PostgreSQL:
cd /d "C:\gym-pulse-production"
node -e "
const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'GYMPULSE_BD',
    user: 'postgres',
    password: 'postgres'
});

client.connect()
    .then(() => {
        console.log('✅ PostgreSQL conectado');
        return client.query('SELECT COUNT(*) FROM clients');
    })
    .then(result => {
        console.log('✅ Tabelas acessíveis (' + result.rows[0].count + ' clientes)');
        return client.end();
    })
    .catch(err => {
        console.log('❌ Erro banco:', err.message);
        process.exit(1);
    });
"

if %errorlevel% neq 0 (
    echo.
    echo ❌ PROBLEMA NO BANCO DE DADOS
    echo 💡 Soluções:
    echo    1. Inicie PostgreSQL
    echo    2. Execute: npm run setup:db
    echo    3. Verifique credenciais no .env
)

echo.
echo 📋 6. LOGS DO SISTEMA...
echo.

if exist "C:\gym-pulse-production\logs\production.log" (
    echo 📊 Últimas 5 linhas do log:
    powershell "Get-Content 'C:\gym-pulse-production\logs\production.log' | Select-Object -Last 5"
) else (
    echo ⚠️ Log de produção não encontrado
)

echo.
echo 📋 RESULTADO DO TESTE:
echo ======================
echo.

set /a score=0

sc query GymPulseUnified >nul 2>&1 && set /a score+=20
netstat -an | findstr :3000 >nul && set /a score+=20
curl -s http://localhost:3000/api/health >nul 2>&1 && set /a score+=20
curl -s http://localhost:3000/ >nul 2>&1 && set /a score+=20
if exist "C:\gym-pulse-production\dist\index.html" set /a score+=20

if %score% equ 100 (
    echo 🎉 PERFEITO! Aplicação 100%% funcional
    echo.
    echo ✅ ACESSE AGORA:
    echo    🌐 http://localhost:3000/
    echo.
    echo 🚀 A aplicação está rodando completamente em Node.js!
) else if %score% geq 80 (
    echo ⚠️ QUASE LÁ! %score%%%% funcional - pequenos ajustes necessários
) else if %score% geq 60 (
    echo 🔧 PROBLEMAS MODERADOS - %score%%%% funcional
) else (
    echo ❌ PROBLEMAS CRÍTICOS - %score%%%% funcional
    echo.
    echo 💡 SOLUÇÕES:
    echo    1. Execute: .\migrar-para-node-unificado.bat
    echo    2. Verifique se PostgreSQL está rodando
    echo    3. Execute: npm run build (no projeto principal)
    echo    4. Reinicie o serviço: sc stop GymPulseUnified && sc start GymPulseUnified
)

echo.
echo 🔧 COMANDOS ÚTEIS:
echo ==================
echo.
echo 🔄 Reiniciar serviço:  sc stop GymPulseUnified ^& sc start GymPulseUnified
echo 📊 Ver logs:           type C:\gym-pulse-production\logs\production.log
echo 🧪 Teste manual:       cd C:\gym-pulse-production ^& node server-producao.js
echo 🌐 Abrir aplicação:    start http://localhost:3000/
echo.
pause

