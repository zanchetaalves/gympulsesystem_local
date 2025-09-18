@echo off
color 0B
echo ========================================
echo   CONFIGURANDO SERVICO COM NSSM
echo ========================================
echo.

REM Verificar se esta rodando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como Administrador...
) else (
    echo ❌ ERRO: Execute como Administrador!
    echo Clique com botao direito no arquivo e selecione "Executar como administrador"
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 1: Verificando NSSM...
nssm version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ NSSM instalado e funcionando!
    nssm version
) else (
    echo ❌ ERRO: NSSM nao encontrado!
    echo Verifique se foi adicionado ao PATH do sistema.
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 2: Verificando arquivos do backend...
if not exist "C:\gym-pulse-production\backend\start.bat" (
    echo ❌ ERRO: Execute primeiro o script setup-backend-producao.bat
    pause
    exit /b 1
)
if not exist "C:\gym-pulse-production\backend\index.js" (
    echo ❌ ERRO: Arquivo index.js nao encontrado!
    pause
    exit /b 1
)
echo ✅ Arquivos do backend encontrados!

echo.
echo 📋 PASSO 3: Removendo servico existente (se houver)...
nssm stop GymPulseBackend >nul 2>&1
nssm remove GymPulseBackend confirm >nul 2>&1
echo ✅ Servico anterior removido (se existia)

echo.
echo 📋 PASSO 4: Criando novo servico...
nssm install GymPulseBackend "C:\gym-pulse-production\backend\start.bat"
if %errorLevel% == 0 (
    echo ✅ Servico criado com sucesso!
) else (
    echo ❌ ERRO ao criar servico!
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 5: Configurando parametros do servico...

REM Configurar diretorio de trabalho
nssm set GymPulseBackend AppDirectory "C:\gym-pulse-production\backend"

REM Configurar logs
nssm set GymPulseBackend AppStdout "C:\gym-pulse-production\logs\backend.log"
nssm set GymPulseBackend AppStderr "C:\gym-pulse-production\logs\error.log"

REM Configurar reinicializacao automatica
nssm set GymPulseBackend AppExit Default Restart
nssm set GymPulseBackend AppRestartDelay 5000

REM Configurar para iniciar automaticamente
nssm set GymPulseBackend Start SERVICE_AUTO_START

REM Configurar descricao
nssm set GymPulseBackend Description "Gym Pulse System - Backend API Server"

echo ✅ Parametros configurados!

echo.
echo 📋 PASSO 6: Iniciando servico...
nssm start GymPulseBackend
if %errorLevel% == 0 (
    echo ✅ Servico iniciado!
) else (
    echo ❌ ERRO ao iniciar servico!
    echo Verificando logs...
    if exist "C:\gym-pulse-production\logs\error.log" (
        echo Ultimas linhas do log de erro:
        powershell "Get-Content 'C:\gym-pulse-production\logs\error.log' -Tail 5"
    )
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 7: Verificando status do servico...
timeout /t 3 >nul
nssm status GymPulseBackend
echo.

echo 📋 PASSO 8: Testando se API esta respondendo...
timeout /t 5 >nul
echo Verificando se a porta 3001 esta em uso...
netstat -an | findstr :3001
if %errorLevel% == 0 (
    echo ✅ Backend rodando na porta 3001!
    
    echo.
    echo Testando endpoint de saude...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ API Health Check: OK' } catch { Write-Host '⚠️ API Health Check: Falhou - pode ser normal se ainda estiver iniciando' }"
) else (
    echo ⚠️ Porta 3001 nao detectada
    echo Aguarde alguns segundos e verifique os logs...
)

echo.
echo ========================================
echo   SERVICO CONFIGURADO! ✅
echo ========================================
echo.
echo 🎯 COMANDOS UTEIS:
echo.
echo Ver status:      nssm status GymPulseBackend
echo Parar servico:   nssm stop GymPulseBackend
echo Iniciar servico: nssm start GymPulseBackend
echo Reiniciar:       nssm restart GymPulseBackend
echo Ver logs:        type C:\gym-pulse-production\logs\backend.log
echo Ver erros:       type C:\gym-pulse-production\logs\error.log
echo.
echo 📂 Logs salvos em: C:\gym-pulse-production\logs\
echo.
echo 🌐 PROXIMO PASSO: Configurar proxy no IIS
echo    Execute: testar-funcionamento.bat
echo.
pause
