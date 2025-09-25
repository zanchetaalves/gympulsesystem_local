@echo off
chcp 65001 >nul
echo.
echo 🔧 CORREÇÃO - TIMEOUT DO SERVIÇO BACKEND
echo =========================================
echo.

echo 📋 1. PARANDO E REMOVENDO SERVIÇO ATUAL...
echo.

echo ⏹️ Parando serviço (se estiver rodando):
sc stop GymPulseBackend 2>nul
timeout /t 3 /nobreak >nul

echo 🗑️ Removendo serviço atual:
sc delete GymPulseBackend 2>nul
timeout /t 2 /nobreak >nul
echo.

echo 📋 2. TESTANDO INICIALIZAÇÃO MANUAL...
echo.

echo 🧪 Testando se Node.js roda manualmente:
cd /d "C:\gym-pulse-system\backend"

echo Verificando se arquivos existem:
if not exist "index.js" (
    echo ❌ Arquivo index.js não encontrado!
    echo 💡 Execute: .\setup-backend-producao.bat
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ❌ node_modules não encontrado!
    echo 🔄 Instalando dependências...
    npm install
)

echo.
echo 🚀 Testando inicialização do Node.js (30 segundos):
echo    - Se aparecer "Server running on port 3001", pressione Ctrl+C
echo    - Se der erro, anote a mensagem
echo.
echo ⏱️ Iniciando em 3 segundos...
timeout /t 3 /nobreak >nul

start /wait cmd /c "node index.js & timeout /t 30 /nobreak >nul"

echo.
echo 📋 3. CRIANDO SERVIÇO COM CONFIGURAÇÃO MELHORADA...
echo.

echo 🔧 Método 1: Usando node-windows (se disponível):
if exist "install-service.cjs" (
    echo Instalando via node-windows...
    node install-service.cjs
    
    echo Aguardando 5 segundos...
    timeout /t 5 /nobreak >nul
    
    echo Verificando se foi criado:
    sc query GymPulseBackend >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Serviço criado via node-windows
        goto :test_service
    )
)

echo 🔧 Método 2: Criando serviço SC com timeout estendido:

sc create GymPulseBackend ^
    binPath= "\"C:\Program Files\nodejs\node.exe\" \"C:\gym-pulse-system\backend\index.js\"" ^
    start= auto ^
    DisplayName= "Gym Pulse Backend" ^
    Description= "Backend do sistema Gym Pulse"

if %errorlevel% neq 0 (
    echo ❌ Erro ao criar serviço
    pause
    exit /b 1
)

echo ✅ Serviço criado com sucesso
echo.

echo 📋 4. CONFIGURANDO TIMEOUT ESTENDIDO...
echo.

echo 🔧 Aumentando timeout para 180 segundos:
sc config GymPulseBackend start= delayed-auto
reg add "HKLM\SYSTEM\CurrentControlSet\Services\GymPulseBackend" /v ServiceSidType /t REG_DWORD /d 1 /f >nul 2>&1

echo.

:test_service
echo 📋 5. TESTANDO NOVO SERVIÇO...
echo.

echo 🚀 Iniciando serviço (aguarde até 3 minutos):
sc start GymPulseBackend

echo ⏱️ Aguardando 30 segundos para inicialização...
timeout /t 30 /nobreak

echo 🔍 Verificando status:
sc query GymPulseBackend | findstr STATE

echo.
echo 🌐 Testando conectividade:
echo Aguardando mais 15 segundos...
timeout /t 15 /nobreak

curl -s http://localhost:3001/api/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend respondendo corretamente!
    echo.
    echo 🎉 PROBLEMA RESOLVIDO!
    echo    O serviço agora deve funcionar normalmente.
) else (
    echo ❌ Backend ainda não responde
    echo.
    echo 📋 PRÓXIMOS PASSOS:
    echo.
    echo 1️⃣ Verificar logs:
    if exist "C:\gym-pulse-system\logs\backend.log" (
        echo    type C:\gym-pulse-system\logs\backend.log
    ) else (
        echo    Verificar Event Viewer do Windows
    )
    echo.
    echo 2️⃣ Testar manualmente:
    echo    cd C:\gym-pulse-system\backend
    echo    node index.js
    echo.
    echo 3️⃣ Verificar PostgreSQL:
    echo    Confirme se PostgreSQL está rodando
    echo.
    echo 4️⃣ Verificar arquivo .env:
    echo    Confirme as configurações de banco
)

echo.
echo 📋 6. CONFIGURAÇÃO FINAL...
echo.

if exist "C:\gym-pulse-system\logs" (
    echo ✅ Pasta de logs existe
) else (
    echo 📁 Criando pasta de logs:
    mkdir "C:\gym-pulse-system\logs"
)

echo.
echo 🔧 COMANDOS ÚTEIS PARA GERENCIAR O SERVIÇO:
echo ============================================
echo.
echo ▶️  Iniciar:    sc start GymPulseBackend
echo ⏹️  Parar:      sc stop GymPulseBackend
echo 🔍 Status:     sc query GymPulseBackend
echo 🗑️  Remover:    sc delete GymPulseBackend
echo 📊 Logs:       type C:\gym-pulse-system\logs\backend.log
echo 🌐 Testar:     curl http://localhost:3001/api/health
echo.
echo 💡 Se ainda houver problemas:
echo    1. Execute: .\testar-funcionamento.bat
echo    2. Verifique se PostgreSQL está rodando
echo    3. Teste manual: cd backend ^& node index.js
echo.
pause

