@echo off
setlocal enabledelayedexpansion
color 0A
echo ========================================
echo   CONFIGURANDO SERVICO BACKEND
echo   (Usando Node.js)
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
echo 📋 PASSO 1: Verificando Node.js e arquivos...
set "PROJETO_BASE=C:\gym-pulse-system"

node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js instalado: 
    node --version
) else (
    echo ❌ ERRO: Node.js não encontrado!
    pause
    exit /b 1
)

if not exist "%PROJETO_BASE%\backend\index.js" (
    echo ❌ ERRO: Execute primeiro o script setup-backend-producao.bat
    pause
    exit /b 1
)
echo ✅ Arquivos do backend encontrados!

echo.
echo 📋 PASSO 2: Instalando node-windows...
cd "%PROJETO_BASE%\backend"

REM Verificar se node-windows já está instalado
if exist "node_modules\node-windows" (
    echo ✅ node-windows já instalado
) else (
    echo Instalando node-windows...
    call npm install node-windows --save-dev
    if !errorLevel! == 0 (
        echo ✅ node-windows instalado com sucesso!
    ) else (
        echo ❌ ERRO ao instalar node-windows
        pause
        exit /b 1
    )
)

echo.
echo 📋 PASSO 3: Criando scripts de serviço (.cjs para CommonJS)...

REM Script de instalação usando CommonJS
(
echo const Service = require('node-windows'^).Service;
echo const path = require('path'^);
echo.
echo // Criar o serviço
echo const svc = new Service({
echo   name: 'GymPulseBackend',
echo   description: 'Gym Pulse System - Backend API Server',
echo   script: path.join(__dirname, 'index.js'^),
echo   nodeOptions: [
echo     '--max_old_space_size=4096'
echo   ],
echo   env: [
echo     {
echo       name: 'NODE_ENV',
echo       value: 'production'
echo     },
echo     {
echo       name: 'PORT', 
echo       value: '3001'
echo     }
echo   ]
echo }^);
echo.
echo // Eventos do serviço
echo svc.on('install', function(^) {
echo   console.log('✅ Serviço instalado com sucesso!'^);
echo   console.log('Iniciando serviço...'^);
echo   svc.start(^);
echo }^);
echo.
echo svc.on('start', function(^) {
echo   console.log('✅ Serviço iniciado!'^);
echo   process.exit(0^);
echo }^);
echo.
echo svc.on('error', function(err^) {
echo   console.log('❌ Erro no serviço:', err^);
echo   process.exit(1^);
echo }^);
echo.
echo // Instalar o serviço
echo console.log('Instalando serviço GymPulseBackend...'^);
echo svc.install(^);
) > "install-service.cjs"

echo ✅ Script de instalação criado (install-service.cjs)!

REM Script de desinstalação usando CommonJS
(
echo const Service = require('node-windows'^).Service;
echo const path = require('path'^);
echo.
echo // Criar referência ao serviço
echo const svc = new Service({
echo   name: 'GymPulseBackend',
echo   script: path.join(__dirname, 'index.js'^)
echo }^);
echo.
echo // Eventos de desinstalação
echo svc.on('uninstall', function(^) {
echo   console.log('✅ Serviço desinstalado com sucesso!'^);
echo   process.exit(0^);
echo }^);
echo.
echo svc.on('error', function(err^) {
echo   console.log('❌ Erro na desinstalação:', err^);
echo   process.exit(1^);
echo }^);
echo.
echo // Parar e desinstalar
echo console.log('Parando e desinstalando serviço...'^);
echo svc.stop(^);
echo setTimeout(function(^) {
echo   svc.uninstall(^);
echo }, 2000^);
) > "uninstall-service.cjs"

echo ✅ Script de desinstalação criado (uninstall-service.cjs)!

echo.
echo 📋 PASSO 4: Removendo serviço existente (se houver)...
if exist "uninstall-service.cjs" (
    node uninstall-service.cjs 2>nul
    timeout /t 3 >nul
)

echo.
echo 📋 PASSO 5: Instalando novo serviço...
node install-service.cjs
if %errorLevel% == 0 (
    echo ✅ Serviço configurado com sucesso!
) else (
    echo ❌ ERRO na configuração do serviço (Exit Code: %errorLevel%)
    echo.
    echo Tentando método alternativo...
    goto :alternative_method
)

goto :test_service

:alternative_method
echo.
echo 📋 MÉTODO ALTERNATIVO: Criando serviço Windows diretamente...

REM Criar script batch simples para o serviço
(
echo @echo off
echo cd /d "%PROJETO_BASE%\backend"
echo set NODE_ENV=production
echo set PORT=3001
echo node index.js
) > "start-service.bat"

echo Registrando como serviço Windows...
sc create GymPulseBackend binPath= "\"%PROJETO_BASE%\backend\start-service.bat\"" start= auto DisplayName= "Gym Pulse Backend"
if %errorLevel% == 0 (
    echo ✅ Serviço criado com SC!
    sc description GymPulseBackend "Gym Pulse System - Backend API Server"
) else (
    echo ❌ ERRO ao criar serviço com SC
    pause
    exit /b 1
)

:test_service
echo.
echo 📋 PASSO 6: Aguardando inicialização...
timeout /t 10 >nul

echo.
echo 📋 PASSO 7: Verificando status...
sc query GymPulseBackend >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Serviço encontrado!
    sc query GymPulseBackend | findstr "STATE"
    
    REM Tentar iniciar se não estiver rodando
    sc query GymPulseBackend | findstr "RUNNING" >nul
    if !errorLevel! neq 0 (
        echo Iniciando serviço...
        sc start GymPulseBackend
        timeout /t 5 >nul
    )
) else (
    echo ⚠️ Serviço não encontrado
)

echo.
echo 📋 PASSO 8: Testando API...
timeout /t 5 >nul
echo Verificando porta 3001...
netstat -an | findstr :3001
if %errorLevel% == 0 (
    echo ✅ Backend rodando na porta 3001!
    
    echo Testando endpoint...
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ API funcionando!' } catch { Write-Host '⚠️ API ainda iniciando ou com erro...' }"
) else (
    echo ⚠️ Porta 3001 não detectada
    echo.
    echo Verificando logs de erro...
    if exist "%PROJETO_BASE%\logs\error.log" (
        echo Últimas linhas do log:
        type "%PROJETO_BASE%\logs\error.log" | more +5
    )
)

echo.
echo ========================================
echo   SERVICO NODE.JS CONFIGURADO! ✅
echo ========================================
echo.
echo 🎯 COMANDOS ÚTEIS:
echo.
echo Ver status:       sc query GymPulseBackend
echo Parar serviço:    sc stop GymPulseBackend  
echo Iniciar serviço:  sc start GymPulseBackend
echo Desinstalar:      node uninstall-service.cjs
echo   OU:             sc delete GymPulseBackend
echo Reinstalar:       node install-service.cjs
echo.
echo 📂 Arquivos criados:
echo - install-service.cjs (instalar serviço)
echo - uninstall-service.cjs (desinstalar serviço)
echo - start-service.bat (script de inicialização)
echo.
echo 📍 Local: %PROJETO_BASE%\backend\
echo.
echo 🌐 PRÓXIMO PASSO: Execute testar-funcionamento.bat
echo.
pause
