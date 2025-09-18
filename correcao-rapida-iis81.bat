@echo off
color 0C
echo ========================================
echo   CORRECAO RAPIDA IIS PORTA 81
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
echo 📋 PASSO 1: Identificando local do site na porta 81...
echo.
powershell -Command "Import-Module WebAdministration; $site = Get-Website | Where-Object {$_.bindings.Collection.bindingInformation -like '*:81:*'}; if($site) { Write-Host 'Site encontrado:' $site.name; Write-Host 'Caminho:' $site.physicalPath } else { Write-Host 'Nenhum site na porta 81 encontrado' }"

echo.
echo Digite o caminho onde estao os arquivos do frontend (porta 81):
echo Exemplos:
echo - C:\inetpub\wwwroot
echo - C:\gym-pulse-system\dist
echo - %SystemDrive%\inetpub\wwwroot
echo.
set /p "SITE_PATH=Caminho do frontend: "

if not exist "%SITE_PATH%" (
    echo ❌ ERRO: Caminho nao existe: %SITE_PATH%
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 2: Verificando arquivos...
echo Verificando: %SITE_PATH%
dir "%SITE_PATH%" /b

if not exist "%SITE_PATH%\index.html" (
    echo.
    echo ❌ ERRO CRITICO: index.html nao encontrado!
    echo.
    echo SOLUCAO:
    echo 1. No projeto original, execute: npm run build
    echo 2. Copie todo conteudo da pasta 'dist' para: %SITE_PATH%
    echo.
    echo Exemplo:
    echo xcopy "C:\gym-pulse-system\dist\*" "%SITE_PATH%\" /E /Y
    echo.
    pause
    exit /b 1
)

echo ✅ index.html encontrado!

echo.
echo 📋 PASSO 3: Removendo web.config problematico...
if exist "%SITE_PATH%\web.config" (
    echo Fazendo backup do web.config atual...
    ren "%SITE_PATH%\web.config" "web.config.backup"
    echo ✅ Backup criado: web.config.backup
)

echo.
echo 📋 PASSO 4: Criando web.config minimo...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<!-- Documento padrao --^>
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
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%SITE_PATH%\web.config"

echo ✅ web.config minimo criado!

echo.
echo 📋 PASSO 5: Reiniciando IIS...
iisreset /noforce
echo ✅ IIS reiniciado!

echo.
echo 📋 PASSO 6: Testando configuracao basica...
timeout /t 3 >nul

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ SUCESSO! localhost:81 funcionando!' $r.StatusCode } catch { Write-Host '❌ AINDA COM ERRO:' $_.Exception.Message }"

echo.
echo 📋 PASSO 7: Se funcionou, vamos adicionar o proxy...
echo.
set /p "adicionar_proxy=O site funcionou? (s/n): "

if /i "%adicionar_proxy%"=="s" (
    echo Adicionando configuracao de proxy para API...
    
    (
    echo ^<?xml version="1.0" encoding="UTF-8"?^>
    echo ^<configuration^>
    echo   ^<system.webServer^>
    echo     ^<!-- Documento padrao --^>
    echo     ^<defaultDocument enabled="true"^>
    echo       ^<files^>
    echo         ^<clear /^>
    echo         ^<add value="index.html" /^>
    echo       ^</files^>
    echo     ^</defaultDocument^>
    echo.
    echo     ^<!-- Tratamento de erros --^>
    echo     ^<httpErrors errorMode="Custom"^>
    echo       ^<remove statusCode="404" /^>
    echo       ^<error statusCode="404" responseMode="ExecuteURL" path="/index.html" /^>
    echo     ^</httpErrors^>
    echo.
    echo     ^<!-- Proxy para API apenas se URL Rewrite estiver instalado --^>
    echo     ^<rewrite^>
    echo       ^<rules^>
    echo         ^<rule name="API Proxy" stopProcessing="true"^>
    echo           ^<match url="^api/(.*)" /^>
    echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" /^>
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
    echo   ^</system.webServer^>
    echo ^</configuration^>
    ) > "%SITE_PATH%\web.config"
    
    echo ✅ Proxy adicionado ao web.config!
    
    echo Reiniciando IIS novamente...
    iisreset /noforce
    
    echo Testando com proxy...
    timeout /t 3 >nul
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ Frontend OK:' $r.StatusCode } catch { Write-Host '❌ Frontend com erro:' $_.Exception.Message }"
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/health' -TimeoutSec 10; Write-Host '✅ Proxy API OK:' $r.StatusCode } catch { Write-Host '⚠️ Proxy API falhou (backend pode nao estar rodando):' $_.Exception.Message }"
)

echo.
echo ========================================
echo   CORRECAO CONCLUIDA!
echo ========================================
echo.
echo 🌐 TESTE AGORA: http://localhost:81/
echo.
echo Se ainda houver erro 500:
echo 1. Verifique logs do IIS: C:\inetpub\logs\LogFiles\
echo 2. Instale URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite
echo 3. Verifique permissoes da pasta: %SITE_PATH%
echo.
echo 📂 Configuracao salva em: %SITE_PATH%\web.config
echo 📂 Backup anterior: %SITE_PATH%\web.config.backup
echo.
pause
