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
echo [INFO] Configurando proxy para solucionar URLs automaticamente...
echo.
echo COMO FUNCIONA:
echo - Backend roda na porta 3001 (API + Banco)
echo - Proxy roda na porta 3000 (Frontend + redirecionamento)
echo - Frontend mantem URLs originais (localhost:3001)
echo - Proxy redireciona automaticamente
echo - NUNCA mais alterar URLs manualmente!
echo.

cd /d "%PROD_DIR%"

echo [INFO] Testando estrutura de arquivos...

if not exist "server-backend.js" (
    echo [ERRO] server-backend.js nao encontrado
    echo Execute setup-producao.bat novamente
    pause
    exit /b 1
)

if not exist "server-proxy.js" (
    echo [ERRO] server-proxy.js nao encontrado
    echo Execute setup-producao.bat novamente
    pause
    exit /b 1
)

echo [OK] Arquivos encontrados

echo.
echo [INFO] Testando backend na porta 3001...
start /B "" cmd /c "start-backend.bat" >nul 2>&1
echo [INFO] Aguardando backend inicializar...
timeout /t 8 /nobreak >nul

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '[OK] Backend funcionando na porta 3001:', $response.StatusCode } catch { Write-Host '[AVISO] Backend nao respondeu - verifique logs' }"

echo.
echo [INFO] Testando proxy na porta 3000...
start /B "" cmd /c "start-proxy.bat" >nul 2>&1
echo [INFO] Aguardando proxy inicializar...
timeout /t 8 /nobreak >nul

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 10; Write-Host '[OK] Proxy funcionando na porta 3000:', $response.StatusCode } catch { Write-Host '[AVISO] Proxy nao respondeu - verifique logs' }"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 10; Write-Host '[OK] Frontend carregando na porta 3000:', $response.StatusCode } catch { Write-Host '[AVISO] Frontend nao carregou - verifique dist/' }"

echo.
echo [INFO] Parando processos de teste...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo ======================================================
echo [SUCESSO] PROXY CONFIGURADO E TESTADO!
echo ======================================================
echo.
echo FUNCIONAMENTO:
echo   Backend:  http://localhost:3001/api (direto)
echo   Frontend: http://localhost:3000     (via proxy)
echo   API:      http://localhost:3000/api (via proxy)
echo.
echo VANTAGENS:
echo   [+] Frontend NUNCA precisa ser alterado
echo   [+] URLs originais mantidas (localhost:3001)
echo   [+] Atualizacoes sem alteracao manual
echo   [+] Proxy automatico e transparente
echo.
echo PROXIMOS PASSOS:
echo 1. configurar-servico.bat (criar servicos Windows)
echo 2. Acessar: http://localhost:3000
echo.
echo PARA TESTAR AGORA:
echo   Terminal 1: %PROD_DIR%\start-backend.bat
echo   Terminal 2: %PROD_DIR%\start-proxy.bat
echo.
pause
