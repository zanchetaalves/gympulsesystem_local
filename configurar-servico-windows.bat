@echo off
echo ======================================================
echo 🛠️ CONFIGURAÇÃO SERVIÇO WINDOWS - GYM PULSE
echo ======================================================

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

set PROD_DIR=C:\gym-pulse-production
set SERVICE_NAME=GymPulseSystem

echo.
echo 🔍 Verificando se o serviço já existe...
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️ Serviço %SERVICE_NAME% já existe. Removendo...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo ✅ Serviço anterior removido
)

echo.
echo 🔧 Criando script de inicialização...

REM Criar script de inicialização do serviço
(
echo @echo off
echo cd /d "%PROD_DIR%"
echo node server-producao-unificado.js
) > "%PROD_DIR%\start-service.bat"

echo ✅ Script de inicialização criado

echo.
echo 📝 Criando serviço Windows...

REM Criar o serviço Windows
sc create "%SERVICE_NAME%" ^
binPath= "\"%PROD_DIR%\start-service.bat\"" ^
start= auto ^
DisplayName= "Gym Pulse System" ^
depend= "PostgreSQL" >nul 2>&1

if %errorlevel% == 0 (
    echo ✅ Serviço criado com sucesso
) else (
    echo ❌ Erro ao criar serviço. Tentando método alternativo...
    
    REM Método alternativo - usando node-windows se disponível
    echo 🔄 Tentando instalar node-windows...
    cd /d "%PROD_DIR%"
    call npm install --save node-windows
    
    if %errorlevel% == 0 (
        echo ✅ node-windows instalado
        
        REM Criar script de instalação do serviço
        (
        echo import { Service } from 'node-windows';
        echo.
        echo const svc = new Service({
        echo   name: 'Gym Pulse System',
        echo   description: 'Sistema de gerenciamento de academia - Gym Pulse',
        echo   script: 'C:\\gym-pulse-production\\server-producao-unificado.js',
        echo   nodeOptions: [
        echo     '--harmony',
        echo     '--max_old_space_size=4096'
        echo   ]
        echo });
        echo.
        echo svc.on('install', () => {
        echo   console.log('✅ Serviço instalado com sucesso!');
        echo   svc.start();
        echo });
        echo.
        echo svc.install();
        ) > "%PROD_DIR%\install-service.js"
        
        echo 🚀 Instalando serviço via node-windows...
        node "%PROD_DIR%\install-service.js"
        
        if %errorlevel% == 0 (
            echo ✅ Serviço instalado com node-windows
        ) else (
            echo ❌ Falhou também com node-windows
            echo Você precisará configurar manualmente
        )
    ) else (
        echo ❌ Não foi possível instalar node-windows
        echo Configure o serviço manualmente ou use outro método
    )
)

echo.
echo 🚀 Configurando inicialização automática...
sc config "%SERVICE_NAME%" start= auto >nul 2>&1

echo.
echo ▶️ Iniciando serviço...
sc start "%SERVICE_NAME%" >nul 2>&1

if %errorlevel% == 0 (
    echo ✅ Serviço iniciado com sucesso
) else (
    echo ⚠️ Aviso: Não foi possível iniciar automaticamente
    echo Tente iniciar manualmente: sc start %SERVICE_NAME%
)

echo.
echo 🔍 Verificando status do serviço...
timeout /t 3 /nobreak >nul
sc query "%SERVICE_NAME%"

echo.
echo 🌐 Testando aplicação...
timeout /t 5 /nobreak >nul
echo Aguardando servidor inicializar...

REM Testar se a aplicação está respondendo
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 10; if ($response.StatusCode -eq 200) { Write-Host '✅ API respondendo corretamente' } else { Write-Host '⚠️ API retornou status:', $response.StatusCode } } catch { Write-Host '❌ Erro ao conectar com a API:', $_.Exception.Message }"

echo.
echo ✅ ======================================================
echo 🎉 CONFIGURAÇÃO DO SERVIÇO CONCLUÍDA!
echo ======================================================
echo.
echo 📊 Comandos úteis:
echo    sc start %SERVICE_NAME%     - Iniciar serviço
echo    sc stop %SERVICE_NAME%      - Parar serviço
echo    sc query %SERVICE_NAME%     - Status do serviço
echo    sc delete %SERVICE_NAME%    - Remover serviço
echo.
echo 🌐 Acesso à aplicação:
echo    Frontend: http://localhost:3000
echo    API: http://localhost:3000/api/health
echo.
echo 📁 Logs: %PROD_DIR%\logs\
echo.
pause
