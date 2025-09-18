@echo off
color 0D
echo ========================================
echo   CONFIGURANDO PROXY NO IIS
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
echo 📋 PASSO 1: Instalando URL Rewrite Module (se necessario)...
echo.
echo ⚠️ IMPORTANTE: Se o URL Rewrite nao estiver instalado,
echo    baixe e instale de: https://www.iis.net/downloads/microsoft/url-rewrite
echo.
echo Pressione qualquer tecla apos verificar/instalar o URL Rewrite...
pause

echo.
echo 📋 PASSO 2: Criando web.config para proxy...
echo.
echo Onde esta configurado seu frontend no IIS?
echo Opcoes comuns:
echo 1. C:\inetpub\wwwroot\ (site padrao)
echo 2. C:\gym-pulse-production\frontend\
echo 3. Outro local
echo.
set /p "opcao=Digite o numero da opcao [1-3]: "

if "%opcao%"=="1" (
    set "FRONTEND_PATH=C:\inetpub\wwwroot"
) else if "%opcao%"=="2" (
    set "FRONTEND_PATH=C:\gym-pulse-production\frontend"
) else (
    set /p "FRONTEND_PATH=Digite o caminho completo do frontend: "
)

echo.
echo Configurando proxy em: %FRONTEND_PATH%
echo.

REM Backup do web.config existente se houver
if exist "%FRONTEND_PATH%\web.config" (
    echo Fazendo backup do web.config existente...
    copy "%FRONTEND_PATH%\web.config" "%FRONTEND_PATH%\web.config.backup" >nul
    echo ✅ Backup criado: web.config.backup
)

echo.
echo Criando novo web.config com proxy...
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
echo     ^<!-- Configuracoes de MIME types --^>
echo     ^<staticContent^>
echo       ^<mimeMap fileExtension=".js" mimeType="application/javascript" /^>
echo       ^<mimeMap fileExtension=".css" mimeType="text/css" /^>
echo     ^</staticContent^>
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
) > "%FRONTEND_PATH%\web.config"

echo ✅ web.config criado com sucesso!
echo.

echo 📋 PASSO 3: Reiniciando IIS...
iisreset
echo ✅ IIS reiniciado!
echo.

echo 📋 PASSO 4: Testando proxy...
timeout /t 5 >nul
echo.
echo Testando acesso direto ao backend:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ Backend direto: OK' } catch { Write-Host '❌ Backend direto: FALHOU' }"

echo.
echo Testando proxy atraves do IIS:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/api/health' -TimeoutSec 10; Write-Host '✅ Proxy IIS: OK' } catch { Write-Host '❌ Proxy IIS: FALHOU' }"

echo.
echo ========================================
echo   PROXY CONFIGURADO! ✅
echo ========================================
echo.
echo 🌐 ACESSOS FINAIS:
echo Frontend: http://localhost/
echo API:      http://localhost/api/health
echo.
echo 🧪 TESTE COMPLETO:
echo 1. Abra http://localhost/ no navegador
echo 2. Tente fazer login
echo 3. Verifique se as requisicoes para /api/ funcionam
echo.
echo 📂 Configuracao salva em: %FRONTEND_PATH%\web.config
echo 📂 Backup anterior em: %FRONTEND_PATH%\web.config.backup
echo.
echo Se houver problemas, verifique:
echo - URL Rewrite Module instalado no IIS
echo - Servico GymPulseBackend rodando
echo - Logs em C:\gym-pulse-production\logs\
echo.
pause
