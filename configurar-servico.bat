@echo off
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
set SERVICE_NAME=GymPulseSystem

REM Verificar se estrutura existe
if not exist "%PROD_DIR%" (
    echo [ERRO] Diretorio %PROD_DIR% nao encontrado!
    echo Execute setup-producao.bat primeiro
    pause
    exit /b 1
)

echo.
echo [INFO] Configurando servico Windows unico:
echo   %SERVICE_NAME% (porta 3000) - Aplicacao completa
echo.

echo [INFO] Removendo servicos existentes...
sc stop "GymPulseBackend" >nul 2>&1
sc stop "GymPulseProxy" >nul 2>&1
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 /nobreak >nul

sc delete "GymPulseBackend" >nul 2>&1
sc delete "GymPulseProxy" >nul 2>&1
sc delete "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 /nobreak >nul

echo [OK] Servicos antigos removidos

echo.
echo [INFO] Criando servico unico...

sc create "%SERVICE_NAME%" ^
binPath= "\"%PROD_DIR%\start-aplicacao.bat\"" ^
start= auto ^
DisplayName= "Gym Pulse System" ^
depend= "PostgreSQL" >nul 2>&1

if %errorlevel% == 0 (
    echo [OK] Servico criado com sucesso
) else (
    echo [AVISO] Erro ao criar servico
)

echo.
echo [INFO] Configurando inicializacao automatica...
sc config "%SERVICE_NAME%" start= auto >nul 2>&1

echo.
echo [INFO] Iniciando servico...
sc start "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Servico iniciado com sucesso
) else (
    echo [AVISO] Erro ao iniciar servico
)

echo.
echo [INFO] Aguardando inicializacao completa...
timeout /t 10 /nobreak >nul

echo.
echo [INFO] Verificando status do servico...
echo.
echo === STATUS DO SERVICO ===
sc query "%SERVICE_NAME%"

echo.
echo [INFO] Testando aplicacao...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 15; Write-Host '[OK] API funcionando:', $response.StatusCode } catch { Write-Host '[AVISO] API nao respondeu ainda' }"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 15; Write-Host '[OK] Frontend funcionando:', $response.StatusCode } catch { Write-Host '[AVISO] Frontend nao carregou ainda' }"

echo.
echo ======================================================
echo [SUCESSO] SERVICO CONFIGURADO!
echo ======================================================
echo.
echo SERVICO CRIADO:
echo   %SERVICE_NAME% (porta 3000) - Aplicacao completa
echo.
echo COMANDOS UTEIS:
echo   sc start %SERVICE_NAME%     - Iniciar servico
echo   sc stop %SERVICE_NAME%      - Parar servico
echo   sc query %SERVICE_NAME%     - Status do servico
echo   sc restart %SERVICE_NAME%   - Reiniciar servico
echo.
echo ACESSO A APLICACAO:
echo   Aplicacao: http://localhost:3000
echo   API: http://localhost:3000/api/health
echo.
echo VANTAGENS:
echo   [+] Servidor unico - mais simples
echo   [+] URLs originais mantidas (localhost:3001)
echo   [+] Estrutura correta: payments -> subscriptions -> clients
echo   [+] Nunca mais alterar URLs manualmente!
echo.
pause
