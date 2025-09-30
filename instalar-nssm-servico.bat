@echo off
echo ======================================================
echo INSTALAR SERVICO COM NSSM - GYM PULSE SYSTEM
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
set NSSM_DIR=C:\nssm-2.24\win64

REM Verificar se estrutura existe
if not exist "%PROD_DIR%" (
    echo [ERRO] Diretorio %PROD_DIR% nao encontrado!
    echo Execute setup-producao.bat primeiro
    pause
    exit /b 1
)

echo.
echo [INFO] Baixando NSSM...

REM Baixar NSSM se não existir
if not exist "%NSSM_DIR%\nssm.exe" (
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'C:\nssm.zip'"
    powershell -Command "Expand-Archive -Path 'C:\nssm.zip' -DestinationPath 'C:\' -Force"
    echo [OK] NSSM baixado e extraido
) else (
    echo [OK] NSSM ja existe
)

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
echo [INFO] Criando pasta de logs...
if not exist "%PROD_DIR%\logs" mkdir "%PROD_DIR%\logs"

echo.
echo [INFO] Instalando servico com NSSM...
"%NSSM_DIR%\nssm.exe" install %SERVICE_NAME% node.exe server-producao.js

echo [INFO] Configurando servico...
"%NSSM_DIR%\nssm.exe" set %SERVICE_NAME% AppDirectory "%PROD_DIR%"
"%NSSM_DIR%\nssm.exe" set %SERVICE_NAME% AppEnvironmentExtra PORT=3000 NODE_ENV=production
"%NSSM_DIR%\nssm.exe" set %SERVICE_NAME% AppStdout "%PROD_DIR%\logs\stdout.log"
"%NSSM_DIR%\nssm.exe" set %SERVICE_NAME% AppStderr "%PROD_DIR%\logs\stderr.log"
"%NSSM_DIR%\nssm.exe" set %SERVICE_NAME% DisplayName "Gym Pulse System"
"%NSSM_DIR%\nssm.exe" set %SERVICE_NAME% Description "Sistema de gerenciamento de academia - Gym Pulse"

echo [OK] Servico configurado

echo.
echo [INFO] Iniciando servico...
"%NSSM_DIR%\nssm.exe" start %SERVICE_NAME%

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
echo [SUCESSO] SERVICO INSTALADO COM NSSM!
echo ======================================================
echo.
echo SERVICO CRIADO:
echo   %SERVICE_NAME% (porta 3000) - Aplicacao completa
echo.
echo COMANDOS UTEIS:
echo   nssm start %SERVICE_NAME%     - Iniciar servico
echo   nssm stop %SERVICE_NAME%      - Parar servico
echo   nssm status %SERVICE_NAME%    - Status do servico
echo   nssm restart %SERVICE_NAME%   - Reiniciar servico
echo   nssm edit %SERVICE_NAME%      - Editar configuracoes
echo.
echo LOGS DO SERVICO:
echo   Stdout: %PROD_DIR%\logs\stdout.log
echo   Stderr: %PROD_DIR%\logs\stderr.log
echo.
echo ACESSO A APLICACAO:
echo   Aplicacao: http://localhost:3000
echo   API: http://localhost:3000/api/health
echo.
pause
