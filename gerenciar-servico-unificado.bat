@echo off
chcp 65001 >nul
echo.
echo 🔧 GERENCIADOR - SERVIÇO UNIFICADO GYM PULSE
echo =============================================
echo.

:menu
echo 📋 ESCOLHA UMA OPÇÃO:
echo.
echo 1️⃣  - Ver status do serviço
echo 2️⃣  - Iniciar serviço
echo 3️⃣  - Parar serviço  
echo 4️⃣  - Reiniciar serviço
echo 5️⃣  - Ver logs em tempo real
echo 6️⃣  - Testar aplicação completa
echo 7️⃣  - Abrir aplicação no navegador
echo 8️⃣  - Configurações avançadas
echo 9️⃣  - Sair
echo.
set /p choice="Digite sua escolha (1-9): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto test
if "%choice%"=="7" goto open
if "%choice%"=="8" goto advanced
if "%choice%"=="9" goto exit

echo ❌ Opção inválida!
goto menu

:status
echo.
echo 🔍 STATUS DO SERVIÇO:
echo ====================
sc query GymPulseUnified 2>nul
if %errorlevel% neq 0 (
    echo ❌ Serviço não encontrado!
    echo 💡 Execute: .\migrar-para-node-unificado.bat
) else (
    echo.
    echo 🌐 Verificando porta 3000:
    netstat -an | findstr :3000
    if %errorlevel% neq 0 (
        echo ❌ Porta 3000 não está ativa
    ) else (
        echo ✅ Porta 3000 ativa
    )
)
echo.
pause
goto menu

:start
echo.
echo 🚀 INICIANDO SERVIÇO...
echo =======================
sc start GymPulseUnified
echo ⏱️ Aguardando 15 segundos para inicialização...
timeout /t 15 /nobreak
echo.
echo 🔍 Status após inicialização:
sc query GymPulseUnified | findstr STATE
echo.
echo 🧪 Testando API:
curl -s http://localhost:3000/api/health
if %errorlevel% equ 0 (
    echo.
    echo ✅ Serviço iniciado com sucesso!
) else (
    echo ❌ Serviço iniciou mas API não responde
)
echo.
pause
goto menu

:stop
echo.
echo ⏹️ PARANDO SERVIÇO...
echo ====================
sc stop GymPulseUnified
echo ✅ Comando enviado
echo.
pause
goto menu

:restart
echo.
echo 🔄 REINICIANDO SERVIÇO...
echo =========================
echo ⏹️ Parando...
sc stop GymPulseUnified
timeout /t 5 /nobreak
echo 🚀 Iniciando...
sc start GymPulseUnified
echo ⏱️ Aguardando 20 segundos...
timeout /t 20 /nobreak
echo.
echo 🧪 Testando após reinício:
curl -s http://localhost:3000/api/health
if %errorlevel% equ 0 (
    echo.
    echo ✅ Reinício bem-sucedido!
) else (
    echo ❌ Problema após reinício
)
echo.
pause
goto menu

:logs
echo.
echo 📊 LOGS EM TEMPO REAL:
echo ======================
echo Pressione Ctrl+C para voltar ao menu
echo.
timeout /t 3 /nobreak
if exist "C:\gym-pulse-production\logs\production.log" (
    powershell "Get-Content 'C:\gym-pulse-production\logs\production.log' -Wait"
) else (
    echo ⚠️ Arquivo de log não encontrado
    echo 📁 Procurando logs do sistema...
    powershell "Get-EventLog -LogName System -Source 'Service Control Manager' -Newest 10 | Where-Object {$_.Message -like '*GymPulse*'} | Format-Table TimeGenerated,EntryType,Message -AutoSize"
)
echo.
pause
goto menu

:test
echo.
echo 🧪 TESTE COMPLETO DA APLICAÇÃO:
echo ===============================
call testar-aplicacao-unificada.bat
goto menu

:open
echo.
echo 🌐 ABRINDO APLICAÇÃO NO NAVEGADOR...
echo ====================================
echo Verificando se o serviço está rodando...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Aplicação está rodando
    echo 🌐 Abrindo http://localhost:3000/
    start http://localhost:3000/
) else (
    echo ❌ Aplicação não está respondendo
    echo 💡 Iniciando serviço primeiro...
    sc start GymPulseUnified
    echo ⏱️ Aguardando 20 segundos...
    timeout /t 20 /nobreak
    echo 🌐 Tentando abrir novamente...
    start http://localhost:3000/
)
echo.
pause
goto menu

:advanced
echo.
echo ⚙️ CONFIGURAÇÕES AVANÇADAS:
echo ===========================
echo.
echo A️⃣ - Remover e recriar serviço
echo B️⃣ - Verificar estrutura de arquivos
echo C️⃣ - Reinstalar dependências
echo D️⃣ - Backup da configuração
echo E️⃣ - Voltar ao menu principal
echo.
set /p adv_choice="Digite sua escolha (A-E): "

if /i "%adv_choice%"=="A" goto recreate
if /i "%adv_choice%"=="B" goto check_files
if /i "%adv_choice%"=="C" goto reinstall
if /i "%adv_choice%"=="D" goto backup
if /i "%adv_choice%"=="E" goto menu

echo ❌ Opção inválida!
goto advanced

:recreate
echo.
echo 🗑️ REMOVENDO E RECRIANDO SERVIÇO:
echo =================================
echo ⏹️ Parando serviço atual...
sc stop GymPulseUnified 2>nul
timeout /t 3 /nobreak
echo 🗑️ Removendo serviço...
sc delete GymPulseUnified 2>nul
timeout /t 2 /nobreak
echo 🔧 Criando novo serviço...
sc create GymPulseUnified ^
    binPath= "\"C:\Program Files\nodejs\node.exe\" \"C:\gym-pulse-production\server-producao.js\"" ^
    start= auto ^
    DisplayName= "Gym Pulse - Servidor Unificado" ^
    Description= "Sistema completo Gym Pulse (Frontend + Backend + API)"
if %errorlevel% equ 0 (
    echo ✅ Serviço recriado com sucesso!
    echo 🚀 Iniciando...
    sc start GymPulseUnified
) else (
    echo ❌ Erro ao recriar serviço
)
echo.
pause
goto advanced

:check_files
echo.
echo 📁 VERIFICANDO ESTRUTURA DE ARQUIVOS:
echo =====================================
if exist "C:\gym-pulse-production" (
    echo ✅ Pasta principal: C:\gym-pulse-production
) else (
    echo ❌ Pasta principal não encontrada!
)

if exist "C:\gym-pulse-production\server-producao.js" (
    echo ✅ Servidor principal
) else (
    echo ❌ server-producao.js ausente
)

if exist "C:\gym-pulse-production\dist\index.html" (
    echo ✅ Frontend (dist)
) else (
    echo ❌ Frontend ausente - execute 'npm run build'
)

if exist "C:\gym-pulse-production\server\auth.js" (
    echo ✅ Módulo de autenticação
) else (
    echo ❌ auth.js ausente
)

if exist "C:\gym-pulse-production\node_modules" (
    echo ✅ Dependências Node.js
) else (
    echo ❌ node_modules ausente - execute 'npm install'
)

echo.
echo 📊 Tamanho da pasta dist:
dir "C:\gym-pulse-production\dist" 2>nul | findstr "bytes"

echo.
pause
goto advanced

:reinstall
echo.
echo 📦 REINSTALANDO DEPENDÊNCIAS:
echo =============================
cd /d "C:\gym-pulse-production"
echo 🗑️ Removendo node_modules...
rmdir /s /q node_modules 2>nul
echo 📦 Reinstalando...
call npm install
if %errorlevel% equ 0 (
    echo ✅ Dependências reinstaladas!
) else (
    echo ❌ Erro na reinstalação
)
echo.
pause
goto advanced

:backup
echo.
echo 💾 BACKUP DA CONFIGURAÇÃO:
echo ==========================
set backup_dir=C:\gym-pulse-backup-%date:~-4%%date:~3,2%%date:~0,2%
echo 📁 Criando backup em: %backup_dir%
mkdir "%backup_dir%" 2>nul
xcopy "C:\gym-pulse-production\*.js" "%backup_dir%\" /Y >nul
xcopy "C:\gym-pulse-production\*.json" "%backup_dir%\" /Y >nul
xcopy "C:\gym-pulse-production\.env" "%backup_dir%\" /Y >nul
if %errorlevel% equ 0 (
    echo ✅ Backup criado com sucesso!
    echo 📁 Local: %backup_dir%
) else (
    echo ❌ Erro ao criar backup
)
echo.
pause
goto advanced

:exit
echo.
echo 👋 Saindo do gerenciador...
echo.
echo 💡 LEMBRETES:
echo   - Aplicação: http://localhost:3000/
echo   - Status: sc query GymPulseUnified
echo   - Logs: C:\gym-pulse-production\logs\
echo.
exit /b 0
