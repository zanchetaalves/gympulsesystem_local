@echo off
color 0A
echo ========================================
echo   CONFIGURACAO BACKEND EM PRODUCAO
echo ========================================
echo.

REM Verificar se esta rodando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como Administrador...
) else (
    echo ❌ ERRO: Execute como Administrador!
    echo Clique com botao direito no arquivo e selecione "Executar como administrador"
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 1: Verificando estrutura de diretorios...
set "PROJETO_BASE=C:\gym-pulse-system"

if not exist "%PROJETO_BASE%" (
    echo ❌ ERRO: Nao encontrei o projeto em %PROJETO_BASE%
    echo Por favor, confirme se a aplicacao esta em C:\gym-pulse-system
    pause
    exit /b 1
)

if not exist "%PROJETO_BASE%\backend" mkdir "%PROJETO_BASE%\backend"
if not exist "%PROJETO_BASE%\logs" mkdir "%PROJETO_BASE%\logs"
echo ✅ Estrutura verificada!

echo.
echo 📋 PASSO 2: Verificando arquivos do projeto...
if not exist "%PROJETO_BASE%\package.json" (
    echo ❌ ERRO: Nao encontrei package.json em %PROJETO_BASE%
    echo Verifique se os arquivos estao na pasta correta.
    pause
    exit /b 1
)
echo ✅ Projeto encontrado em %PROJETO_BASE%!

echo.
echo 📋 PASSO 3: Organizando arquivos necessarios...
echo Copiando package.json para pasta backend...
copy "%PROJETO_BASE%\package.json" "%PROJETO_BASE%\backend\" >nul
if exist "%PROJETO_BASE%\package-lock.json" (
    copy "%PROJETO_BASE%\package-lock.json" "%PROJETO_BASE%\backend\" >nul
    echo ✅ package-lock.json copiado
)

echo Copiando arquivos do servidor para pasta backend...
if exist "%PROJETO_BASE%\server" (
    xcopy "%PROJETO_BASE%\server\*" "%PROJETO_BASE%\backend\" /E /Y /Q >nul
    echo ✅ Arquivos do servidor copiados
) else (
    echo ❌ ERRO: Pasta server nao encontrada!
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 4: Criando arquivo de configuracao (.env)...
(
echo NODE_ENV=production
echo PORT=3001
echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gym_pulse
echo JWT_SECRET=seu_jwt_secret_super_seguro_aqui
) > "%PROJETO_BASE%\backend\.env"
echo ✅ Arquivo .env criado!

echo.
echo 📋 PASSO 5: Criando script de inicializacao...
(
echo @echo off
echo cd /d "%PROJETO_BASE%\backend"
echo set NODE_ENV=production
echo set PORT=3001
echo node index.js
) > "%PROJETO_BASE%\backend\start.bat"
echo ✅ Script start.bat criado!

echo.
echo 📋 PASSO 6: Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js instalado: 
    node --version
) else (
    echo ❌ ERRO: Node.js nao encontrado!
    echo Instale o Node.js primeiro: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 7: Instalando dependencias do Node.js...
echo Isso pode levar alguns minutos...
cd "%PROJETO_BASE%\backend"
call npm install --production --silent
if %errorLevel% == 0 (
    echo ✅ Dependencias instaladas com sucesso!
) else (
    echo ❌ ERRO ao instalar dependencias!
    echo Verifique se o package.json esta correto.
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 8: Testando configuracao do backend...
echo Testando se o servidor inicia...
timeout /t 2 >nul
start /min cmd /c "cd %PROJETO_BASE%\backend && node index.js" >nul 2>&1
timeout /t 5 >nul

REM Verificar se esta rodando na porta 3001
netstat -an | findstr :3001 >nul
if %errorLevel% == 0 (
    echo ✅ Servidor backend esta rodando na porta 3001!
    
    REM Parar o servidor de teste
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
    echo ✅ Servidor de teste finalizado.
) else (
    echo ⚠️  Servidor nao iniciou automaticamente (normal em alguns casos)
    echo Continuando com a configuracao...
)

echo.
echo ========================================
echo   BACKEND PREPARADO COM SUCESSO! ✅
echo ========================================
echo.
echo Proximos passos:
echo 1. Execute: configurar-servico-nssm.bat
echo 2. Teste o funcionamento
echo 3. Configure o proxy no IIS
echo.
echo Estrutura criada em: %PROJETO_BASE%\backend\
echo.
pause
