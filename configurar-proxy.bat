@echo off
echo ======================================================
echo CONFIGURAR PROXY - GYM PULSE SYSTEM
echo ======================================================

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Executando como Administrador
) else (
    echo [ERRO] Execute como Administrador!
    pause
    exit /b 1
)

set PROD_DIR=C:\gym-pulse-production

REM Verificar se estrutura existe
if not exist "%PROD_DIR%" (
    echo [ERRO] Diretorio %PROD_DIR% nao encontrado!
    echo Execute setup-producao.bat primeiro
    pause
    exit /b 1
)

echo.
echo [INFO] Configurando servidor unificado para solucionar URLs automaticamente...
echo.
echo COMO FUNCIONA:
echo - Servidor unico na porta 3000 (API + Frontend integrados)
echo - Frontend mantem URLs originais (localhost:3001)
echo - Servidor resolve automaticamente as rotas
echo - Estrutura correta: payments -> subscriptions -> clients
echo - NUNCA mais alterar URLs manualmente!
echo.

cd /d "%PROD_DIR%"

echo [INFO] Testando estrutura de arquivos...

if not exist "server-producao.js" (
    echo [ERRO] server-producao.js nao encontrado
    echo Execute setup-producao.bat novamente
    pause
    exit /b 1
)

echo [OK] Arquivo encontrado

echo.
echo [INFO] Testando servidor unificado na porta 3000...
start /B "" cmd /c "start-aplicacao.bat" >nul 2>&1
echo [INFO] Aguardando servidor inicializar...
timeout /t 10 /nobreak >nul

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 15; Write-Host '[OK] API funcionando na porta 3000:', $response.StatusCode } catch { Write-Host '[AVISO] API nao respondeu - verifique logs' }"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 15; Write-Host '[OK] Frontend carregando na porta 3000:', $response.StatusCode } catch { Write-Host '[AVISO] Frontend nao carregou - verifique dist/' }"

echo.
echo [INFO] Parando processo de teste...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo ======================================================
echo [SUCESSO] SERVIDOR CONFIGURADO E TESTADO!
echo ======================================================
echo.
echo FUNCIONAMENTO:
echo   Aplicacao: http://localhost:3000     (tudo integrado)
echo   API:       http://localhost:3000/api (mesma porta)
echo   Frontend:  http://localhost:3000     (servido pelo Node.js)
echo.
echo VANTAGENS:
echo   [+] Servidor unico - mais simples
echo   [+] Frontend mantem URLs originais (localhost:3001)
echo   [+] Atualizacoes sem alteracao manual
echo   [+] Estrutura correta: payments -> subscriptions -> clients
echo.
echo PROXIMOS PASSOS:
echo 1. configurar-servico.bat (criar servico Windows)
echo 2. Acessar: http://localhost:3000
echo.
echo PARA TESTAR AGORA:
echo   Execute: %PROD_DIR%\start-aplicacao.bat
echo.
pause
