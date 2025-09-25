@echo off
color 0A
echo ========================================
echo   USANDO WEB.CONFIG CORRETO
echo ========================================
echo.

REM Verificar se esta rodando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como Administrador...
) else (
    echo ❌ ERRO: Execute como Administrador!
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 1: Localizando web.config correto...

if not exist "C:\gym-pulse-system\web.config" (
    echo ❌ ERRO: web.config correto não encontrado na raiz do projeto!
    pause
    exit /b 1
)

echo ✅ web.config correto encontrado: C:\gym-pulse-system\web.config

echo.
echo 📋 PASSO 2: Identificando onde copiar...

set "DIST_PATH=C:\gym-pulse-system\dist"
set "WWWROOT_PATH=C:\inetpub\wwwroot"

if exist "%DIST_PATH%\index.html" (
    set "TARGET_PATH=%DIST_PATH%"
    echo ✅ Frontend está em: %DIST_PATH%
) else if exist "%WWWROOT_PATH%\index.html" (
    set "TARGET_PATH=%WWWROOT_PATH%"
    echo ✅ Frontend está em: %WWWROOT_PATH%
) else (
    echo ⚠️ Frontend não encontrado, usando pasta dist padrão
    set "TARGET_PATH=%DIST_PATH%"
)

echo.
echo 📋 PASSO 3: Fazendo backup do web.config atual (se existir)...

if exist "%TARGET_PATH%\web.config" (
    copy "%TARGET_PATH%\web.config" "%TARGET_PATH%\web.config.backup" >nul
    echo ✅ Backup criado: %TARGET_PATH%\web.config.backup
) else (
    echo ℹ️ Nenhum web.config anterior para fazer backup
)

echo.
echo 📋 PASSO 4: Copiando web.config correto...

copy "C:\gym-pulse-system\web.config" "%TARGET_PATH%\web.config" /Y >nul
if %errorLevel% == 0 (
    echo ✅ web.config copiado com sucesso!
) else (
    echo ❌ ERRO ao copiar web.config!
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 5: Reiniciando IIS...
iisreset
echo ✅ IIS reiniciado!

echo.
echo 📋 PASSO 6: Testando acesso...
timeout /t 5 >nul

echo Testando frontend:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/' -TimeoutSec 10; Write-Host '✅ Frontend: OK' } catch { Write-Host '❌ Frontend: FALHOU - ' + $_.Exception.Message }"

echo.
echo Testando proxy API:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/api/health' -TimeoutSec 10; Write-Host '✅ API Proxy: OK' } catch { Write-Host '❌ API Proxy: FALHOU - ' + $_.Exception.Message }"

echo.
echo ========================================
echo   WEB.CONFIG CORRETO APLICADO! ✅
echo ========================================
echo.
echo 🎯 O QUE FOI FEITO:
echo ✅ Usado web.config da raiz (sem mimeMap duplicado)
echo ✅ Proxy /api/* → localhost:3001 configurado
echo ✅ SPA routing configurado
echo ✅ CORS headers configurados
echo.
echo 📂 web.config aplicado em: %TARGET_PATH%\web.config
echo 📂 Backup anterior: %TARGET_PATH%\web.config.backup
echo.
echo 🌐 TESTE AGORA:
echo 1. Acesse: http://localhost/
echo 2. Teste login na aplicação  
echo 3. Navegue para diferentes páginas
echo 4. Teste F5 nas páginas (não deve dar 404)
echo.
pause
