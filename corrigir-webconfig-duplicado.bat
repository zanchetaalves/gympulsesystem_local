@echo off
color 0E
echo ========================================
echo   CORRIGINDO WEB.CONFIG DUPLICADO
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
echo 📋 PASSO 1: Identificando local do web.config problemático...

set "DIST_PATH=C:\gym-pulse-system\dist"
set "WWWROOT_PATH=C:\inetpub\wwwroot"

if exist "%DIST_PATH%\web.config" (
    set "CONFIG_PATH=%DIST_PATH%\web.config"
    echo ✅ Encontrado em: %DIST_PATH%\web.config
) else if exist "%WWWROOT_PATH%\web.config" (
    set "CONFIG_PATH=%WWWROOT_PATH%\web.config"
    echo ✅ Encontrado em: %WWWROOT_PATH%\web.config
) else (
    echo ❌ ERRO: web.config não encontrado!
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 2: Fazendo backup do arquivo atual...
copy "%CONFIG_PATH%" "%CONFIG_PATH%.backup" >nul
echo ✅ Backup criado: %CONFIG_PATH%.backup

echo.
echo 📋 PASSO 3: Criando web.config corrigido (sem mimeMap duplicado)...

(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<!-- Proxy para API do backend --^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^api/(.*)" /^>
echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" /^>
echo         ^</rule^>
echo.
echo         ^<!-- SPA - Single Page Application --^>
echo         ^<rule name="SPA" stopProcessing="true"^>
echo           ^<match url=".*" /^>
echo           ^<conditions logicalGrouping="MatchAll"^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^>
echo             ^<add input="{REQUEST_URI}" pattern="^/api/" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="/" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo.
echo     ^<!-- Permitir CORS --^>
echo     ^<httpProtocol^>
echo       ^<customHeaders^>
echo         ^<add name="Access-Control-Allow-Origin" value="*" /^>
echo         ^<add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" /^>
echo         ^<add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" /^>
echo       ^</customHeaders^>
echo     ^</httpProtocol^>
echo.
echo     ^<!-- REMOVIDO: staticContent com mimeMap duplicado --^>
echo.
echo     ^<!-- Configuracoes de seguranca --^>
echo     ^<defaultDocument^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%CONFIG_PATH%"

echo ✅ web.config corrigido criado!

echo.
echo 📋 PASSO 4: Reiniciando IIS...
iisreset
echo ✅ IIS reiniciado!

echo.
echo 📋 PASSO 5: Testando acesso...
timeout /t 5 >nul

echo Testando frontend:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/' -TimeoutSec 10; Write-Host '✅ Frontend: OK' } catch { Write-Host '❌ Frontend: FALHOU - ' + $_.Exception.Message }"

echo.
echo Testando proxy API:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/api/health' -TimeoutSec 10; Write-Host '✅ API Proxy: OK' } catch { Write-Host '❌ API Proxy: FALHOU - ' + $_.Exception.Message }"

echo.
echo ========================================
echo   WEB.CONFIG CORRIGIDO! ✅
echo ========================================
echo.
echo 🎯 MUDANÇAS FEITAS:
echo ✅ Removido mimeMap duplicado para .js e .css
echo ✅ Mantido proxy para /api/*
echo ✅ Mantido SPA routing
echo ✅ Mantido CORS headers
echo.
echo 📂 Arquivo corrigido: %CONFIG_PATH%
echo 📂 Backup anterior: %CONFIG_PATH%.backup
echo.
echo 🌐 TESTE AGORA:
echo 1. Acesse: http://localhost/
echo 2. Teste login na aplicação
echo 3. Verifique se as APIs funcionam
echo.
pause
