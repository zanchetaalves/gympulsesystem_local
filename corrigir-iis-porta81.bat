@echo off
setlocal enabledelayedexpansion
color 0E
echo ========================================
echo   CORRIGINDO IIS PORTA 81
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
echo 📋 PASSO 1: Identificando caminho do frontend...
echo.
echo Onde esta o frontend da aplicacao (porta 81)?
echo 1. C:\inetpub\wwwroot\
echo 2. C:\gym-pulse-system\dist\
echo 3. Outro local
echo.
set /p "opcao=Digite o numero da opcao [1-3]: "

if "%opcao%"=="1" (
    set "FRONTEND_PATH=C:\inetpub\wwwroot"
) else if "%opcao%"=="2" (
    set "FRONTEND_PATH=C:\gym-pulse-system\dist"
) else (
    set /p "FRONTEND_PATH=Digite o caminho completo: "
)

echo.
echo Usando caminho: %FRONTEND_PATH%

echo.
echo 📋 PASSO 2: Verificando arquivos necessarios...
if not exist "%FRONTEND_PATH%\index.html" (
    echo ❌ ERRO: index.html nao encontrado em %FRONTEND_PATH%
    echo.
    echo Voce precisa copiar os arquivos do frontend para esta pasta.
    echo Execute: npm run build (no projeto original)
    echo Depois copie o conteudo de dist\ para %FRONTEND_PATH%
    pause
    exit /b 1
)

echo ✅ index.html encontrado!

echo.
echo 📋 PASSO 3: Criando/corrigindo web.config...

REM Backup do web.config existente
if exist "%FRONTEND_PATH%\web.config" (
    echo Fazendo backup do web.config...
    copy "%FRONTEND_PATH%\web.config" "%FRONTEND_PATH%\web.config.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%" >nul
)

echo Criando novo web.config otimizado...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<!-- Configuracoes de erro customizadas --^>
echo     ^<httpErrors errorMode="Custom" defaultResponseMode="File"^>
echo       ^<remove statusCode="404" /^>
echo       ^<error statusCode="404" responseMode="ExecuteURL" path="/index.html" /^>
echo     ^</httpErrors^>
echo.
echo     ^<!-- Rewrite rules --^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<!-- Proxy para API do backend --^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^api/(.*)" /^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_METHOD}" pattern="GET|POST|PUT|DELETE|OPTIONS" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" /^>
echo         ^</rule^>
echo.
echo         ^<!-- SPA - Single Page Application --^>
echo         ^<rule name="SPA Fallback" stopProcessing="true"^>
echo           ^<match url=".*" /^>
echo           ^<conditions logicalGrouping="MatchAll"^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^>
echo             ^<add input="{REQUEST_URI}" pattern="^/api/" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="/index.html" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo.
echo     ^<!-- Headers CORS --^>
echo     ^<httpProtocol^>
echo       ^<customHeaders^>
echo         ^<add name="Access-Control-Allow-Origin" value="*" /^>
echo         ^<add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" /^>
echo         ^<add name="Access-Control-Allow-Headers" value="Content-Type,Authorization,X-Requested-With" /^>
echo         ^<add name="Access-Control-Max-Age" value="86400" /^>
echo       ^</customHeaders^>
echo     ^</httpProtocol^>
echo.
echo     ^<!-- Configuracoes de MIME types --^>
echo     ^<staticContent^>
echo       ^<remove fileExtension=".js" /^>
echo       ^<remove fileExtension=".css" /^>
echo       ^<remove fileExtension=".woff" /^>
echo       ^<remove fileExtension=".woff2" /^>
echo       ^<mimeMap fileExtension=".js" mimeType="application/javascript; charset=UTF-8" /^>
echo       ^<mimeMap fileExtension=".css" mimeType="text/css; charset=UTF-8" /^>
echo       ^<mimeMap fileExtension=".woff" mimeType="font/woff" /^>
echo       ^<mimeMap fileExtension=".woff2" mimeType="font/woff2" /^>
echo     ^</staticContent^>
echo.
echo     ^<!-- Configuracao de compressao --^>
echo     ^<urlCompression doStaticCompression="true" doDynamicCompression="true" /^>
echo.
echo     ^<!-- Configuracoes de cache --^>
echo     ^<clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" /^>
echo.
echo     ^<!-- Configuracao do documento padrao --^>
echo     ^<defaultDocument enabled="true"^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%FRONTEND_PATH%\web.config"

echo ✅ web.config criado com sucesso!

echo.
echo 📋 PASSO 4: Verificando URL Rewrite Module...
echo.
echo ⚠️ IMPORTANTE: Verificando se URL Rewrite esta instalado...
powershell -Command "if (Get-WindowsFeature -Name IIS-HttpRedirect -ErrorAction SilentlyContinue) { Write-Host '✅ IIS URL Rewrite disponivel' } else { Write-Host '❌ URL Rewrite pode nao estar instalado' }"

echo.
echo Se o URL Rewrite nao estiver instalado:
echo 1. Baixe de: https://www.iis.net/downloads/microsoft/url-rewrite
echo 2. Instale o URL Rewrite Module
echo 3. Reinicie o IIS
echo.

echo 📋 PASSO 5: Verificando backend...
echo Status do servico:
sc query GymPulseBackend >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Servico GymPulseBackend encontrado
    sc query GymPulseBackend | findstr "STATE"
    
    REM Verificar se esta rodando
    sc query GymPulseBackend | findstr "RUNNING" >nul
    if !errorLevel! neq 0 (
        echo Iniciando servico backend...
        sc start GymPulseBackend
        timeout /t 5 >nul
    )
) else (
    echo ❌ Servico backend nao encontrado!
    echo Execute primeiro: configurar-servico-node-v2.bat
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 6: Reiniciando IIS...
echo Parando IIS...
iisreset /stop

echo Aguardando...
timeout /t 3 >nul

echo Iniciando IIS...
iisreset /start

echo ✅ IIS reiniciado!

echo.
echo 📋 PASSO 7: Testando configuracao...
timeout /t 5 >nul

echo Testando backend direto:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ Backend OK:' $r.StatusCode } catch { Write-Host '❌ Backend falhou:' $_.Exception.Message }"

echo.
echo Testando frontend (porta 81):
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ Frontend OK:' $r.StatusCode } catch { Write-Host '❌ Frontend falhou:' $_.Exception.Message }"

echo.
echo Testando proxy API (porta 81):
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/health' -TimeoutSec 10; Write-Host '✅ Proxy OK:' $r.StatusCode } catch { Write-Host '❌ Proxy falhou:' $_.Exception.Message }"

echo.
echo ========================================
echo   CORRECAO CONCLUIDA! ✅
echo ========================================
echo.
echo 🌐 TESTE AGORA:
echo Frontend: http://localhost:81/
echo API:      http://localhost:81/api/health
echo.
echo 📂 Configuracoes:
echo Frontend: %FRONTEND_PATH%
echo Web.config: %FRONTEND_PATH%\web.config
echo Backend: C:\gym-pulse-system\backend\
echo.
echo 📋 SE AINDA HOUVER PROBLEMAS:
echo 1. Verifique logs do IIS em C:\inetpub\logs\LogFiles\
echo 2. Verifique se URL Rewrite Module esta instalado
echo 3. Execute diagnosticar-iis-porta81.bat novamente
echo.
pause
