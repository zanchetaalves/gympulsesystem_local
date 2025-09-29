@echo off
echo ======================================================
echo 🚀 SETUP PRODUÇÃO - GYM PULSE SYSTEM
echo ======================================================

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como Administrador
) else (
    echo ❌ ERRO: Execute como Administrador!
    echo Clique com o botão direito e "Executar como administrador"
    pause
    exit /b 1
)

echo.
echo 📂 Criando estrutura de produção...

REM Criar diretório de produção
set PROD_DIR=C:\gym-pulse-production
if not exist "%PROD_DIR%" (
    mkdir "%PROD_DIR%"
    echo ✅ Diretório criado: %PROD_DIR%
) else (
    echo ℹ️ Diretório já existe: %PROD_DIR%
)

REM Criar subdiretórios
mkdir "%PROD_DIR%\logs" 2>nul
mkdir "%PROD_DIR%\server" 2>nul
mkdir "%PROD_DIR%\scripts" 2>nul

echo.
echo 📋 Copiando arquivos da aplicação...

REM Copiar servidor unificado
copy "server-producao-unificado.js" "%PROD_DIR%\server-producao-unificado.js" >nul
echo ✅ Servidor unificado copiado

REM Copiar package.json de produção
copy "package-producao-unificado.json" "%PROD_DIR%\package.json" >nul
echo ✅ package.json copiado

REM Copiar pasta dist
xcopy "dist" "%PROD_DIR%\dist" /E /I /H /Y >nul
echo ✅ Frontend (dist) copiado

REM Copiar pasta server
xcopy "server" "%PROD_DIR%\server" /E /I /H /Y >nul
echo ✅ Módulos do servidor copiados

REM Copiar pasta scripts
xcopy "scripts" "%PROD_DIR%\scripts" /E /I /H /Y >nul
echo ✅ Scripts do banco copiados

echo.
echo 🔧 Criando arquivo .env de produção...

REM Criar arquivo .env
(
echo # Configurações de Produção - Gym Pulse System
echo NODE_ENV=production
echo PORT=3000
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=GYMPULSE_BD
echo DB_USER=postgres
echo DB_PASSWORD=postgres
echo.
echo # JWT Configuration
echo JWT_SECRET=gym-pulse-super-secret-key-production-2024
echo JWT_EXPIRES_IN=24h
echo.
echo # Application Configuration
echo CORS_ORIGIN=http://localhost:3000
echo LOG_LEVEL=info
) > "%PROD_DIR%\.env"

echo ✅ Arquivo .env criado

echo.
echo 📦 Instalando dependências Node.js...
cd /d "%PROD_DIR%"
call npm install

if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo ✅ Dependências instaladas com sucesso

echo.
echo 🗄️ Configurando banco de dados...
call npm run setup:db

if %errorlevel% neq 0 (
    echo ⚠️ Aviso: Erro ao configurar banco de dados
    echo Verifique se o PostgreSQL está rodando e o banco GYMPULSE_BD existe
    echo Você pode configurar manualmente depois
)

echo.
echo ✅ ======================================================
echo 🎉 SETUP CONCLUÍDO COM SUCESSO!
echo ======================================================
echo.
echo 📂 Arquivos estão em: %PROD_DIR%
echo 🌐 Para testar: cd %PROD_DIR% && npm start
echo.
echo Próximos passos:
echo 1. Configure o serviço Windows (próximo script)
echo 2. Teste a aplicação
echo.
pause
