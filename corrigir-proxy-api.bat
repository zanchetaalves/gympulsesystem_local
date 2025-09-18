@echo off
color 0A
echo ========================================
echo   CORRIGINDO PROXY DA API
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
echo 📋 PASSO 1: Confirmando que backend funciona...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 5; Write-Host '✅ Backend OK:' $r.StatusCode } catch { Write-Host '❌ Backend falhou:' $_.Exception.Message; exit 1 }"

echo.
echo 📋 PASSO 2: Identificando caminho do site IIS...
set "SITE_PATH=C:\gym-pulse-system\dist"

echo Verificando site em: %SITE_PATH%
if not exist "%SITE_PATH%\index.html" (
    echo ❌ ERRO: Frontend não encontrado em %SITE_PATH%
    pause
    exit /b 1
)

echo ✅ Frontend encontrado!

echo.
echo 📋 PASSO 3: Verificando web.config atual...
if exist "%SITE_PATH%\web.config" (
    echo ✅ web.config existe
    echo.
    echo Conteúdo atual (primeiras 10 linhas):
    powershell "Get-Content '%SITE_PATH%\web.config' | Select-Object -First 10"
    
    echo.
    echo Fazendo backup...
    copy "%SITE_PATH%\web.config" "%SITE_PATH%\web.config.backup.%time:~0,2%%time:~3,2%%time:~6,2%" >nul
    echo ✅ Backup criado
) else (
    echo ⚠️ web.config não existe, será criado
)

echo.
echo 📋 PASSO 4: Criando web.config com proxy correto...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<!-- Documento padrão --^>
echo     ^<defaultDocument enabled="true"^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo.
echo     ^<!-- Tratamento de erros 404 para SPA --^>
echo     ^<httpErrors errorMode="Custom"^>
echo       ^<remove statusCode="404" /^>
echo       ^<error statusCode="404" responseMode="ExecuteURL" path="/index.html" /^>
echo     ^</httpErrors^>
echo.
echo     ^<!-- Rewrite Rules para Proxy --^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<!-- Proxy para API do backend --^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^api/(.*)" /^>
echo           ^<conditions logicalGrouping="MatchAll"^>
echo             ^<add input="{REQUEST_METHOD}" pattern="GET|POST|PUT|DELETE|OPTIONS" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" logRewrittenUrl="true" /^>
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
echo     ^<!-- Configurações de MIME types --^>
echo     ^<staticContent^>
echo       ^<remove fileExtension=".js" /^>
echo       ^<remove fileExtension=".css" /^>
echo       ^<mimeMap fileExtension=".js" mimeType="application/javascript; charset=UTF-8" /^>
echo       ^<mimeMap fileExtension=".css" mimeType="text/css; charset=UTF-8" /^>
echo     ^</staticContent^>
echo.
echo     ^<!-- Configuração de compressão --^>
echo     ^<urlCompression doStaticCompression="true" doDynamicCompression="true" /^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%SITE_PATH%\web.config"

echo ✅ web.config criado com proxy otimizado!

echo.
echo 📋 PASSO 5: Verificando URL Rewrite Module...
powershell -Command "if (Get-WindowsFeature -Name IIS-HttpRedirect -ErrorAction SilentlyContinue) { Write-Host '✅ URL Rewrite disponível' } else { Write-Host '⚠️ URL Rewrite pode não estar instalado' }"

echo.
echo 📋 PASSO 6: Reiniciando IIS...
echo Parando IIS...
iisreset /stop /noforce

echo Aguardando...
timeout /t 3 >nul

echo Iniciando IIS...
iisreset /start

echo ✅ IIS reiniciado!

echo.
echo 📋 PASSO 7: Aguardando inicialização...
timeout /t 5 >nul

echo.
echo 📋 PASSO 8: Testando configuração...
echo.
echo Testando frontend (porta 81):
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ Frontend OK:' $r.StatusCode } catch { Write-Host '❌ Frontend falhou:' $_.Exception.Message }"

echo.
echo Testando proxy da API (porta 81):
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/health' -TimeoutSec 10; Write-Host '✅ Proxy API OK:' $r.StatusCode; Write-Host 'Response:' $r.Content } catch { Write-Host '❌ Proxy API falhou:' $_.Exception.Message }"

echo.
echo Testando API com dados (clientes):
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/clients' -TimeoutSec 10; Write-Host '✅ API Clientes OK:' $r.StatusCode } catch { Write-Host '❌ API Clientes falhou:' $_.Exception.Message }"

echo.
echo ========================================
echo   PROXY CORRIGIDO! ✅
echo ========================================
echo.
echo 🌐 TESTES FINAIS:
echo Frontend: http://localhost:81/
echo API Health: http://localhost:81/api/health
echo API Clientes: http://localhost:81/api/clients
echo.
echo 📂 Configuração: %SITE_PATH%\web.config
echo 📂 Backup: %SITE_PATH%\web.config.backup.*
echo.
echo 🎯 AGORA TESTE A APLICAÇÃO:
echo 1. Abra http://localhost:81/
echo 2. Faça login
echo 3. Teste alterar um cliente
echo.
pause
