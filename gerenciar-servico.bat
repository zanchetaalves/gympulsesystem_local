@echo off
echo ======================================================
echo 🎛️ GERENCIADOR DE SERVIÇO - GYM PULSE SYSTEM
echo ======================================================

set SERVICE_NAME=GymPulseSystem

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como Administrador
) else (
    echo ❌ ERRO: Execute como Administrador!
    echo Clique com o botão direito e "Executar como administrador"
    pause
    exit /b 1
)

:MENU
echo.
echo 🎯 Escolha uma opção:
echo.
echo [1] ▶️  Iniciar serviço
echo [2] ⏹️  Parar serviço
echo [3] 🔄 Reiniciar serviço
echo [4] 📊 Status do serviço
echo [5] 🗑️ Desinstalar serviço
echo [6] 📝 Ver logs em tempo real
echo [7] 🧪 Testar aplicação
echo [8] 🚪 Sair
echo.
set /p choice="Digite sua escolha (1-8): "

if "%choice%"=="1" goto START_SERVICE
if "%choice%"=="2" goto STOP_SERVICE
if "%choice%"=="3" goto RESTART_SERVICE
if "%choice%"=="4" goto STATUS_SERVICE
if "%choice%"=="5" goto UNINSTALL_SERVICE
if "%choice%"=="6" goto VIEW_LOGS
if "%choice%"=="7" goto TEST_APP
if "%choice%"=="8" goto EXIT
echo ❌ Opção inválida!
goto MENU

:START_SERVICE
echo.
echo ▶️ Iniciando serviço %SERVICE_NAME%...
sc start "%SERVICE_NAME%"
if %errorlevel% == 0 (
    echo ✅ Serviço iniciado com sucesso
    echo ⏳ Aguardando inicialização...
    timeout /t 5 /nobreak >nul
    echo 🌐 Testando aplicação...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 10; Write-Host '✅ Aplicação respondendo corretamente' } catch { Write-Host '⚠️ Aplicação ainda inicializando ou com problemas' }"
) else (
    echo ❌ Erro ao iniciar serviço
)
goto MENU

:STOP_SERVICE
echo.
echo ⏹️ Parando serviço %SERVICE_NAME%...
sc stop "%SERVICE_NAME%"
if %errorlevel% == 0 (
    echo ✅ Serviço parado com sucesso
) else (
    echo ❌ Erro ao parar serviço (pode já estar parado)
)
goto MENU

:RESTART_SERVICE
echo.
echo 🔄 Reiniciando serviço %SERVICE_NAME%...
echo ⏹️ Parando serviço...
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 /nobreak >nul
echo ▶️ Iniciando serviço...
sc start "%SERVICE_NAME%"
if %errorlevel% == 0 (
    echo ✅ Serviço reiniciado com sucesso
    echo ⏳ Aguardando inicialização...
    timeout /t 5 /nobreak >nul
    echo 🌐 Testando aplicação...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 10; Write-Host '✅ Aplicação respondendo após reinicialização' } catch { Write-Host '⚠️ Aplicação ainda inicializando' }"
) else (
    echo ❌ Erro ao reiniciar serviço
)
goto MENU

:STATUS_SERVICE
echo.
echo 📊 Status detalhado do serviço:
echo.
sc query "%SERVICE_NAME%"
echo.
echo 🌐 Verificando porta 3000...
netstat -an | find ":3000" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Porta 3000 está ativa
) else (
    echo ❌ Porta 3000 não está ativa
)
echo.
echo 🔗 Testando API rapidamente...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 5; Write-Host '✅ API respondendo:', $response.StatusCode } catch { Write-Host '❌ API não está respondendo' }"
goto MENU

:UNINSTALL_SERVICE
echo.
echo ⚠️ ATENÇÃO: Isso irá desinstalar completamente o serviço!
set /p confirm="Tem certeza? (S/N): "
if /i "%confirm%"=="S" (
    echo 🗑️ Desinstalando serviço...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    sc delete "%SERVICE_NAME%"
    if %errorlevel% == 0 (
        echo ✅ Serviço desinstalado com sucesso
        echo ℹ️ Os arquivos em C:\gym-pulse-production foram mantidos
    ) else (
        echo ❌ Erro ao desinstalar serviço
    )
) else (
    echo ❌ Desinstalação cancelada
)
goto MENU

:VIEW_LOGS
echo.
echo 📝 Monitorando logs em tempo real...
echo Pressione Ctrl+C para voltar ao menu
echo.
if exist "C:\gym-pulse-production\logs\production.log" (
    powershell -Command "Get-Content 'C:\gym-pulse-production\logs\production.log' -Wait -Tail 20"
) else (
    echo ⚠️ Arquivo de log não encontrado
    echo Verificando logs do sistema Windows...
    powershell -Command "Get-WinEvent -LogName Application | Where-Object {$_.ProviderName -like '*Node*' -or $_.Message -like '*Gym*Pulse*'} | Select-Object TimeCreated, LevelDisplayName, Message | Format-Table -Wrap"
)
goto MENU

:TEST_APP
echo.
echo 🧪 Executando teste completo da aplicação...
call testar-aplicacao.bat
goto MENU

:EXIT
echo.
echo 👋 Saindo do gerenciador...
echo ℹ️ O serviço continuará rodando em segundo plano
exit /b 0
