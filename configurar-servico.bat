@echo off
chcp 65001 >nul
echo ======================================================
echo CONFIGURAR SERVICOS WINDOWS - GYM PULSE SYSTEM
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
set BACKEND_SERVICE=GymPulseBackend
set PROXY_SERVICE=GymPulseProxy

REM Verificar se estrutura existe
if not exist "%PROD_DIR%" (
    echo [ERRO] Diretorio %PROD_DIR% nao encontrado!
    echo Execute setup-producao.bat primeiro
    pause
    exit /b 1
)

echo.
echo [INFO] Configurando 2 servicos Windows:
echo   1. %BACKEND_SERVICE% (porta 3001) - API + Banco
echo   2. %PROXY_SERVICE% (porta 3000) - Frontend + Proxy
echo.

echo [INFO] Removendo servicos existentes...
sc stop "%BACKEND_SERVICE%" >nul 2>&1
sc stop "%PROXY_SERVICE%" >nul 2>&1
sc stop "GymPulseSystem" >nul 2>&1
timeout /t 3 /nobreak >nul

sc delete "%BACKEND_SERVICE%" >nul 2>&1
sc delete "%PROXY_SERVICE%" >nul 2>&1
sc delete "GymPulseSystem" >nul 2>&1
timeout /t 3 /nobreak >nul

echo [OK] Servicos antigos removidos

echo.
echo [INFO] Criando servico Backend (porta 3001)...

sc create "%BACKEND_SERVICE%" ^
binPath= "\"%PROD_DIR%\start-backend.bat\"" ^
start= auto ^
DisplayName= "Gym Pulse Backend API" ^
depend= "PostgreSQL" >nul 2>&1

if %errorlevel% == 0 (
    echo [OK] Servico Backend criado
) else (
    echo [AVISO] Erro ao criar servico Backend
)

echo.
echo [INFO] Criando servico Proxy (porta 3000)...

sc create "%PROXY_SERVICE%" ^
binPath= "\"%PROD_DIR%\start-proxy.bat\"" ^
start= auto ^
DisplayName= "Gym Pulse Frontend Proxy" ^
depend= "%BACKEND_SERVICE%" >nul 2>&1

if %errorlevel% == 0 (
    echo [OK] Servico Proxy criado
) else (
    echo [AVISO] Erro ao criar servico Proxy
)

echo.
echo [INFO] Configurando inicializacao automatica...
sc config "%BACKEND_SERVICE%" start= auto >nul 2>&1
sc config "%PROXY_SERVICE%" start= auto >nul 2>&1

echo.
echo [INFO] Iniciando servicos...

echo [INFO] Iniciando Backend...
sc start "%BACKEND_SERVICE%" >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Backend iniciado
) else (
    echo [AVISO] Erro ao iniciar Backend
)

echo [INFO] Aguardando Backend...
timeout /t 8 /nobreak >nul

echo [INFO] Iniciando Proxy...
sc start "%PROXY_SERVICE%" >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Proxy iniciado
) else (
    echo [AVISO] Erro ao iniciar Proxy
)

echo.
echo [INFO] Aguardando inicializacao completa...
timeout /t 10 /nobreak >nul

echo.
echo [INFO] Verificando status dos servicos...
echo.
echo === BACKEND STATUS ===
sc query "%BACKEND_SERVICE%"
echo.
echo === PROXY STATUS ===
sc query "%PROXY_SERVICE%"

echo.
echo [INFO] Testando aplicacao...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 15; Write-Host '[OK] Backend API funcionando:', $response.StatusCode } catch { Write-Host '[AVISO] Backend nao respondeu ainda' }"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 15; Write-Host '[OK] Proxy API funcionando:', $response.StatusCode } catch { Write-Host '[AVISO] Proxy nao respondeu ainda' }"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 15; Write-Host '[OK] Frontend funcionando:', $response.StatusCode } catch { Write-Host '[AVISO] Frontend nao carregou ainda' }"

echo.
echo ======================================================
echo [SUCESSO] SERVICOS CONFIGURADOS!
echo ======================================================
echo.
echo SERVICOS CRIADOS:
echo   %BACKEND_SERVICE% (porta 3001) - API + Banco
echo   %PROXY_SERVICE% (porta 3000) - Frontend + Proxy
echo.
echo COMANDOS UTEIS:
echo   sc start %BACKEND_SERVICE%    - Iniciar Backend
echo   sc start %PROXY_SERVICE%      - Iniciar Proxy
echo   sc stop %BACKEND_SERVICE%     - Parar Backend
echo   sc stop %PROXY_SERVICE%       - Parar Proxy
echo   sc query %BACKEND_SERVICE%    - Status Backend
echo   sc query %PROXY_SERVICE%      - Status Proxy
echo.
echo ACESSO A APLICACAO:
echo   Frontend: http://localhost:3000
echo   API: http://localhost:3000/api/health
echo.
echo NUNCA MAIS ALTERAR URLs MANUALMENTE!
echo O proxy resolve tudo automaticamente!
echo.
pause
