@echo off
chcp 65001 >nul
echo ======================================================
echo SETUP PRODUCAO - GYM PULSE SYSTEM
echo ======================================================

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Executando como Administrador
) else (
    echo [ERRO] Execute como Administrador!
    echo Clique com o botao direito e "Executar como administrador"
    pause
    exit /b 1
)

set PROD_DIR=C:\gym-pulse-production

echo.
echo [INFO] Criando estrutura de producao em %PROD_DIR%...

REM Criar diretório de produção
if not exist "%PROD_DIR%" (
    mkdir "%PROD_DIR%"
    echo [OK] Diretorio criado
) else (
    echo [INFO] Diretorio ja existe
)

REM Criar subdiretórios
mkdir "%PROD_DIR%\logs" 2>nul
mkdir "%PROD_DIR%\server" 2>nul
mkdir "%PROD_DIR%\scripts" 2>nul

echo.
echo [INFO] Verificando arquivos necessarios...

REM Verificar se pasta dist existe
if not exist "dist" (
    echo [ERRO] Pasta 'dist' nao encontrada!
    echo Execute 'npm run build' primeiro
    pause
    exit /b 1
)

echo [OK] Arquivos necessarios encontrados

echo.
echo [INFO] Copiando arquivos...

REM Copiar servidores
copy "server-producao-unificado.js" "%PROD_DIR%\server-backend.js" >nul
copy "server-producao-com-proxy.js" "%PROD_DIR%\server-proxy.js" >nul
copy "package-proxy.json" "%PROD_DIR%\package.json" >nul
echo [OK] Servidores copiados

REM Copiar estrutura
xcopy "dist" "%PROD_DIR%\dist" /E /I /H /Y >nul
xcopy "server" "%PROD_DIR%\server" /E /I /H /Y >nul
xcopy "scripts" "%PROD_DIR%\scripts" /E /I /H /Y >nul
echo [OK] Estrutura copiada

REM Copiar database-setup.sql se existir
if exist "database-setup.sql" (
    copy "database-setup.sql" "%PROD_DIR%\database-setup.sql" >nul
    echo [OK] Script de banco copiado
)

echo.
echo [INFO] Criando configuracoes...

REM Criar arquivo .env para backend
(
echo # Backend - Porta 3001
echo NODE_ENV=production
echo PORT=3001
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=GYMPULSE_BD
echo DB_USER=postgres
echo DB_PASSWORD=postgres
echo JWT_SECRET=gym-pulse-super-secret-key-production-2024
echo JWT_EXPIRES_IN=24h
echo CORS_ORIGIN=http://localhost:3000
echo LOG_LEVEL=info
) > "%PROD_DIR%\.env"

REM Criar scripts de inicialização
(
echo @echo off
echo cd /d "%PROD_DIR%"
echo set PORT=3001
echo node server-backend.js
) > "%PROD_DIR%\start-backend.bat"

(
echo @echo off
echo cd /d "%PROD_DIR%"
echo set FRONTEND_PORT=3000
echo set BACKEND_PORT=3001
echo node server-proxy.js
) > "%PROD_DIR%\start-proxy.bat"

echo [OK] Configuracoes criadas

echo.
echo [INFO] Instalando dependencias...
cd /d "%PROD_DIR%"
call npm install

if %errorlevel% neq 0 (
    echo [ERRO] Erro ao instalar dependencias
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas

echo.
echo [INFO] Configurando banco de dados...
call npm run setup:db

if %errorlevel% neq 0 (
    echo [AVISO] Erro ao configurar banco - configure manualmente depois
)

echo.
echo ======================================================
echo [SUCESSO] SETUP CONCLUIDO!
echo ======================================================
echo.
echo Estrutura criada em: %PROD_DIR%
echo.
echo PROXIMOS PASSOS:
echo 1. configurar-proxy.bat      (configurar proxy)
echo 2. configurar-servico.bat    (criar servicos Windows)
echo 3. Acessar: http://localhost:3000
echo.
echo PARA TESTAR MANUALMENTE:
echo   Terminal 1: %PROD_DIR%\start-backend.bat
echo   Terminal 2: %PROD_DIR%\start-proxy.bat
echo.
pause
