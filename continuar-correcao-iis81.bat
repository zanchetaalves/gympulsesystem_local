@echo off
color 0A
echo ========================================
echo   CONTINUANDO CORRECAO IIS 81
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

set "SITE_PATH=C:\gym-pulse-system\dist"

echo.
echo 📋 Verificando arquivos em: %SITE_PATH%
echo.
echo Conteúdo da pasta:
dir "%SITE_PATH%" /b
echo.

if not exist "%SITE_PATH%\index.html" (
    echo ❌ ERRO CRÍTICO: index.html não encontrado!
    echo.
    echo 🔧 SOLUÇÃO:
    echo 1. Execute: npm run build (no projeto)
    echo 2. Verifique se a pasta dist foi criada
    echo.
    echo Quer que eu tente fazer o build agora? (s/n)
    set /p "fazer_build="
    
    if /i "!fazer_build!"=="s" (
        echo Executando npm run build...
        cd "C:\gym-pulse-system"
        call npm run build
        if !errorLevel! == 0 (
            echo ✅ Build concluído!
        ) else (
            echo ❌ Erro no build
            pause
            exit /b 1
        )
    ) else (
        echo Execute manualmente: npm run build
        pause
        exit /b 1
    )
) else (
    echo ✅ index.html encontrado!
)

echo.
echo 📋 Removendo web.config problemático...
if exist "%SITE_PATH%\web.config" (
    echo Fazendo backup...
    ren "%SITE_PATH%\web.config" "web.config.backup.%time:~0,2%%time:~3,2%%time:~6,2%"
    echo ✅ Backup criado
)

echo.
echo 📋 Criando web.config mínimo...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<defaultDocument enabled="true"^>
echo       ^<files^>
echo         ^<clear /^>
echo         ^<add value="index.html" /^>
echo       ^</files^>
echo     ^</defaultDocument^>
echo.
echo     ^<httpErrors errorMode="Custom"^>
echo       ^<remove statusCode="404" /^>
echo       ^<error statusCode="404" responseMode="ExecuteURL" path="/index.html" /^>
echo     ^</httpErrors^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > "%SITE_PATH%\web.config"

echo ✅ web.config mínimo criado!

echo.
echo 📋 Reiniciando IIS...
iisreset /noforce
if %errorLevel% == 0 (
    echo ✅ IIS reiniciado com sucesso!
) else (
    echo ⚠️ Problema ao reiniciar IIS
)

echo.
echo 📋 Aguardando IIS inicializar...
timeout /t 5 /nobreak >nul

echo.
echo 📋 Testando configuração básica...
echo Testando http://localhost:81 ...

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 15; Write-Host '✅ SUCESSO! Status:' $r.StatusCode; Write-Host 'Site funcionando na porta 81!' } catch { Write-Host '❌ ERRO:' $_.Exception.Message }"

echo.
echo 📋 Se funcionou, vamos adicionar o proxy para a API...
set /p "adicionar_proxy=O site na porta 81 funcionou? (s/n): "

if /i "%adicionar_proxy%"=="s" (
    echo.
    echo ✅ Ótimo! Vamos adicionar o proxy para conectar com o backend...
    
    echo Primeiro, verificando se o backend está rodando...
    netstat -an | findstr :3001 >nul
    if !errorLevel! == 0 (
        echo ✅ Backend rodando na porta 3001
        
        echo.
        echo Adicionando configuração de proxy...
        (
        echo ^<?xml version="1.0" encoding="UTF-8"?^>
        echo ^<configuration^>
        echo   ^<system.webServer^>
        echo     ^<defaultDocument enabled="true"^>
        echo       ^<files^>
        echo         ^<clear /^>
        echo         ^<add value="index.html" /^>
        echo       ^</files^>
        echo     ^</defaultDocument^>
        echo.
        echo     ^<httpErrors errorMode="Custom"^>
        echo       ^<remove statusCode="404" /^>
        echo       ^<error statusCode="404" responseMode="ExecuteURL" path="/index.html" /^>
        echo     ^</httpErrors^>
        echo.
        echo     ^<rewrite^>
        echo       ^<rules^>
        echo         ^<rule name="API Proxy" stopProcessing="true"^>
        echo           ^<match url="^api/(.*)" /^>
        echo           ^<action type="Rewrite" url="http://localhost:3001/api/{R:1}" /^>
        echo         ^</rule^>
        echo       ^</rules^>
        echo     ^</rewrite^>
        echo.
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
        
        echo ✅ Proxy configurado!
        
        echo Reiniciando IIS...
        iisreset /noforce
        timeout /t 3 /nobreak >nul
        
        echo.
        echo 📋 Testando configuração completa...
        echo Testando frontend...
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ Frontend OK:' $r.StatusCode } catch { Write-Host '❌ Frontend erro:' $_.Exception.Message }"
        
        echo.
        echo Testando proxy da API...
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/health' -TimeoutSec 10; Write-Host '✅ API Proxy OK:' $r.Content } catch { Write-Host '⚠️ API Proxy falhou:' $_.Exception.Message }"
        
    ) else (
        echo ❌ Backend NÃO está rodando na porta 3001!
        echo.
        echo Execute primeiro:
        echo 1. .\configurar-servico-node-v2.bat
        echo 2. sc start GymPulseBackend
        echo.
        echo Por enquanto, o frontend já está funcionando.
    )
) else (
    echo.
    echo ❌ Site ainda não funcionou.
    echo.
    echo Verifique:
    echo 1. Se o arquivo index.html existe
    echo 2. Logs do IIS em C:\inetpub\logs\LogFiles\
    echo 3. Se há permissões na pasta
    echo.
    echo Executando diagnóstico adicional...
    
    echo Verificando permissões...
    icacls "%SITE_PATH%" | findstr "Everyone\|IIS_IUSRS\|IUSR"
    
    echo.
    echo Verificando se é um problema de módulo...
    powershell -Command "Get-WindowsFeature -Name '*IIS*' | Where-Object {$_.InstallState -eq 'Installed'} | Select-Object Name | Format-Table -HideTableHeaders"
)

echo.
echo ========================================
echo   CORREÇÃO CONCLUÍDA!
echo ========================================
echo.
echo 🌐 TESTES:
echo Frontend: http://localhost:81/
echo API:      http://localhost:81/api/health
echo.
echo 📂 Configuração: %SITE_PATH%\web.config
echo.
pause
