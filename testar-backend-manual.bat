@echo off
chcp 65001 >nul
echo.
echo 🧪 TESTE MANUAL - BACKEND NODE.JS
echo =================================
echo.

echo 📁 Navegando para pasta do backend:
cd /d "C:\gym-pulse-system\backend"

echo.
echo 📋 Verificando arquivos necessários:

if not exist "index.js" (
    echo ❌ index.js não encontrado!
    echo 💡 Execute: .\setup-backend-producao.bat
    pause
    exit /b 1
) else (
    echo ✅ index.js encontrado
)

if not exist "package.json" (
    echo ❌ package.json não encontrado!
    pause
    exit /b 1
) else (
    echo ✅ package.json encontrado
)

if not exist "node_modules" (
    echo ❌ node_modules não encontrado!
    echo 🔄 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules encontrado
)

if not exist ".env" (
    echo ⚠️ .env não encontrado, criando...
    echo PORT=3001 > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_NAME=GYMPULSE_BD >> .env
    echo DB_USER=postgres >> .env
    echo DB_PASSWORD=postgres >> .env
    echo JWT_SECRET=gym-pulse-secret-key-2024 >> .env
) else (
    echo ✅ .env encontrado
)

echo.
echo 🗄️ Testando conexão PostgreSQL:
echo.

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
        console.log('✅ PostgreSQL conectado com sucesso');
        return client.end();
    })
    .catch(err => {
        console.log('❌ Erro PostgreSQL:', err.message);
        process.exit(1);
    });
"

if %errorlevel% neq 0 (
    echo.
    echo ❌ PROBLEMA: PostgreSQL não está acessível
    echo.
    echo 💡 SOLUÇÕES:
    echo    1. Inicie PostgreSQL (pgAdmin ou services.msc)
    echo    2. Verifique se o banco GYMPULSE_BD existe
    echo    3. Confirme usuário/senha: postgres/postgres
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 INICIANDO BACKEND MANUAL (Pressione Ctrl+C para parar):
echo ========================================================
echo.
echo Se aparecer "Server running on port 3001", significa que está funcionando!
echo Então você pode pressionar Ctrl+C e tentar recriar o serviço.
echo.
echo ⏱️ Iniciando em 3 segundos...
timeout /t 3 /nobreak >nul

node index.js


