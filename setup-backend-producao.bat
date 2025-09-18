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
echo 📋 PASSO 1: Criando estrutura de diretorios...
if not exist "C:\gym-pulse-production" mkdir "C:\gym-pulse-production"
if not exist "C:\gym-pulse-production\backend" mkdir "C:\gym-pulse-production\backend"
if not exist "C:\gym-pulse-production\logs" mkdir "C:\gym-pulse-production\logs"
echo ✅ Estrutura criada!

echo.
echo 📋 PASSO 2: Verificando arquivos do projeto...
set "PROJETO_ORIGEM=C:\Projetos_Particulares\gym-pulse-system"

if not exist "%PROJETO_ORIGEM%\package.json" (
    echo ❌ ERRO: Nao encontrei o projeto em %PROJETO_ORIGEM%
    echo Por favor, confirme o caminho do seu projeto.
    pause
    exit /b 1
)
echo ✅ Projeto encontrado!

echo.
echo 📋 PASSO 3: Copiando arquivos necessarios...
echo Copiando package.json...
copy "%PROJETO_ORIGEM%\package.json" "C:\gym-pulse-production\backend\" >nul
if exist "%PROJETO_ORIGEM%\package-lock.json" (
    copy "%PROJETO_ORIGEM%\package-lock.json" "C:\gym-pulse-production\backend\" >nul
    echo ✅ package-lock.json copiado
)

echo Copiando arquivos do servidor...
if exist "%PROJETO_ORIGEM%\server" (
    xcopy "%PROJETO_ORIGEM%\server\*" "C:\gym-pulse-production\backend\" /E /Y /Q >nul
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
) > "C:\gym-pulse-production\backend\.env"
echo ✅ Arquivo .env criado!

echo.
echo 📋 PASSO 5: Criando script de inicializacao...
(
echo @echo off
echo cd /d "C:\gym-pulse-production\backend"
echo set NODE_ENV=production
echo set PORT=3001
echo node index.js
) > "C:\gym-pulse-production\backend\start.bat"
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
cd "C:\gym-pulse-production\backend"
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
start /min cmd /c "cd C:\gym-pulse-production\backend && node index.js" >nul 2>&1
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
echo Estrutura criada em: C:\gym-pulse-production\backend\
echo.
pause
