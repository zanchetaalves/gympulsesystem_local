@echo off
color 0A
echo ========================================
echo   CORRIGINDO WEB.CONFIG - SEM DUPLICATAS
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
echo 📋 PROBLEMA IDENTIFICADO:
echo    - O IIS moderno já tem mimeMaps padrão para .js, .css, .json
echo    - Qualquer tentativa de re-adicionar causa erro 500.19
echo    - Vamos criar web.config LIMPO sem mimeMaps duplicados
echo.

echo 📋 PASSO 1: Localizando web.config problemático...

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
    echo Vamos criar um novo na pasta dist...
    set "CONFIG_PATH=%DIST_PATH%\web.config"
)

echo.
echo 📋 PASSO 2: Fazendo backup do arquivo atual...
if exist "%CONFIG_PATH%" (
    copy "%CONFIG_PATH%" "%CONFIG_PATH%.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%" >nul
    echo ✅ Backup criado com timestamp
) else (
    echo ℹ️ Nenhum arquivo anterior para backup
)

echo.
echo 📋 PASSO 3: Criando web.config LIMPO (sem mimeMaps duplicados)...

(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<!-- Configuração de rewrite para SPA e API proxy --^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<!-- Servir arquivos estáticos diretamente --^>
echo         ^<rule name="Static Files" stopProcessing="true"^>
echo           ^<match url="^(.*\.(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot^|map^|json))$" /^>
echo           ^<action type="None" /^>
echo         ^</rule^>
echo.
echo         ^<!-- Proxy para API do backend --^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^api/(.*)" /^>
echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" /^>
echo         ^</rule^>
echo.
echo         ^<!-- SPA Fallback - redirecionar para index.html --^>
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
echo         ^<add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" /^>
echo       ^</customHeaders^>
echo     ^</httpProtocol^>
echo.
echo     ^<!-- REMOVIDO: staticContent inteiro para evitar duplicatas --^>
echo     ^<!-- O IIS moderno já tem os mimeMaps necessários --^>
echo.
echo     ^<!-- Documento padrão --^>
echo     ^<defaultDocument^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo.
echo     ^<!-- Configuração de erro personalizada para SPA --^>
echo     ^<httpErrors errorMode="Custom" defaultResponseMode="File"^>
echo       ^<remove statusCode="404" subStatusCode="-1" /^>
echo       ^<error statusCode="404" path="/index.html" responseMode="ExecuteURL" /^>
echo     ^</httpErrors^>
echo.
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%CONFIG_PATH%"

echo ✅ web.config LIMPO criado com sucesso!

echo.
echo 📋 PASSO 4: Verificando se a pasta existe e tem arquivos...
if not exist "%DIST_PATH%" (
    echo ⚠️ Pasta dist não existe, criando...
    mkdir "%DIST_PATH%"
)

if not exist "%DIST_PATH%\index.html" (
    echo ⚠️ index.html não encontrado na pasta dist
    echo 💡 Execute: npm run build (para gerar os arquivos)
) else (
    echo ✅ Arquivos do frontend encontrados
)

echo.
echo 📋 PASSO 5: Reiniciando IIS...
iisreset
echo ✅ IIS reiniciado!

echo.
echo 📋 PASSO 6: Aguardando e testando...
timeout /t 8 >nul

echo Testando acesso ao frontend:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/' -TimeoutSec 15; if($r.StatusCode -eq 200) { Write-Host '✅ Frontend: OK (Status: ' + $r.StatusCode + ')' } else { Write-Host '⚠️ Frontend: Status ' + $r.StatusCode } } catch { Write-Host '❌ Frontend: ERRO - ' + $_.Exception.Message }"

echo.
echo Testando proxy da API:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/api/health' -TimeoutSec 15; if($r.StatusCode -eq 200) { Write-Host '✅ API Proxy: OK (Status: ' + $r.StatusCode + ')' } else { Write-Host '⚠️ API Proxy: Status ' + $r.StatusCode } } catch { Write-Host '❌ API Proxy: ERRO - ' + $_.Exception.Message }"

echo.
echo ========================================
echo   WEB.CONFIG LIMPO APLICADO! ✅
echo ========================================
echo.
echo 🎯 CORREÇÕES APLICADAS:
echo ✅ REMOVIDO: Todos os mimeMaps que causavam duplicata
echo ✅ MANTIDO: Proxy /api/* → localhost:3001  
echo ✅ MANTIDO: SPA routing (F5 funciona)
echo ✅ MANTIDO: CORS headers
echo ✅ ADICIONADO: Tratamento de erro 404 para SPA
echo.
echo 📂 Arquivo: %CONFIG_PATH%
echo 📂 Backup: %CONFIG_PATH%.backup.*
echo.
echo 🌐 AGORA TESTE:
echo 1. Acesse: http://localhost/
echo 2. Faça login na aplicação
echo 3. Navegue para: http://localhost/pagamentos
echo 4. Pressione F5 (deve funcionar sem 404)
echo 5. Teste operações da API
echo.
echo 💡 Se ainda houver erro:
echo    - Verifique se URL Rewrite está instalado no IIS
echo    - Execute: .\testar-funcionamento.bat
echo    - Verifique se backend está rodando: sc query GymPulseBackend
echo.
pause
