@echo off
color 0D
echo ========================================
echo   VERIFICANDO BACKEND
echo ========================================
echo.

echo 📋 PASSO 1: Status do servico...
sc query GymPulseBackend >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Servico GymPulseBackend encontrado
    sc query GymPulseBackend
    echo.
    
    REM Verificar se esta rodando
    sc query GymPulseBackend | findstr "RUNNING" >nul
    if %errorLevel% neq 0 (
        echo ⚠️ Servico nao esta rodando. Tentando iniciar...
        sc start GymPulseBackend
        timeout /t 5 >nul
        sc query GymPulseBackend | findstr "STATE"
    )
) else (
    echo ❌ Servico GymPulseBackend NAO encontrado!
    echo Execute: configurar-servico-node-v2.bat
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 2: Verificando porta 3001...
netstat -an | findstr :3001
if %errorLevel% == 0 (
    echo ✅ Porta 3001 em uso
) else (
    echo ❌ Porta 3001 NAO esta em uso!
)

echo.
echo 📋 PASSO 3: Verificando arquivos do backend...
set "BACKEND_PATH=C:\gym-pulse-system\backend"

if exist "%BACKEND_PATH%\index.js" (
    echo ✅ index.js encontrado
) else (
    echo ❌ index.js NAO encontrado em %BACKEND_PATH%
)

if exist "%BACKEND_PATH%\.env" (
    echo ✅ .env encontrado
    echo Conteudo do .env:
    type "%BACKEND_PATH%\.env"
) else (
    echo ❌ .env NAO encontrado
)

echo.
echo 📋 PASSO 4: Verificando logs...
if exist "C:\gym-pulse-system\logs\backend.log" (
    echo ✅ Log do backend encontrado
    echo Ultimas 10 linhas:
    powershell "Get-Content 'C:\gym-pulse-system\logs\backend.log' -Tail 10 2>$null"
) else (
    echo ⚠️ Log do backend nao encontrado
)

echo.
if exist "C:\gym-pulse-system\logs\error.log" (
    echo ⚠️ Log de erro encontrado
    echo Ultimas 10 linhas de erro:
    powershell "Get-Content 'C:\gym-pulse-system\logs\error.log' -Tail 10 2>$null"
    echo.
)

echo.
echo 📋 PASSO 5: Testando backend manualmente...
cd "%BACKEND_PATH%"
echo Tentando iniciar backend manualmente por 10 segundos...

start /min cmd /c "set NODE_ENV=production && set PORT=3001 && node index.js"
timeout /t 10 >nul

echo Verificando se iniciou...
netstat -an | findstr :3001 >nul
if %errorLevel% == 0 (
    echo ✅ Backend iniciou manualmente!
    
    echo Testando API...
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 5; Write-Host '✅ API responde:' $r.Content } catch { Write-Host '❌ API nao responde:' $_.Exception.Message }"
    
    echo Parando teste manual...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
) else (
    echo ❌ Backend NAO iniciou manualmente!
    echo.
    echo Verificando erros...
    if exist "package.json" (
        echo ✅ package.json encontrado
        echo Verificando dependencias...
        if exist "node_modules" (
            echo ✅ node_modules existe
        ) else (
            echo ❌ node_modules NAO existe!
            echo Execute: npm install
        )
    )
)

echo.
echo 📋 PASSO 6: Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js instalado:
    node --version
) else (
    echo ❌ Node.js NAO encontrado!
)

echo.
echo 📋 PASSO 7: Verificando PostgreSQL...
sc query postgresql* | findstr "SERVICE_NAME\|STATE" 2>nul
if %errorLevel% == 0 (
    echo ✅ PostgreSQL encontrado
) else (
    echo ⚠️ PostgreSQL nao detectado como servico
)

echo.
echo ========================================
echo   DIAGNOSTICO BACKEND CONCLUIDO
echo ========================================
echo.
echo Se o backend nao esta funcionando:
echo 1. Verifique os logs acima
echo 2. Execute: npm install (na pasta backend)
echo 3. Verifique se PostgreSQL esta rodando
echo 4. Teste conexao com banco: psql -U postgres -d gym_pulse
echo.
pause
