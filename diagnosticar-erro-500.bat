@echo off
chcp 65001 >nul
echo.
echo 🔍 DIAGNÓSTICO ERRO 500 - LOCALHOST:81
echo ==========================================
echo.

echo 📋 1. VERIFICANDO STATUS DOS SERVIÇOS...
echo.

echo 🌐 IIS (World Wide Web Publishing Service):
sc query W3SVC | findstr STATE
echo.

echo 🚀 Backend GymPulse:
sc query GymPulseBackend 2>nul | findstr STATE
if %errorlevel% neq 0 (
    echo ❌ Serviço GymPulseBackend não encontrado
) else (
    echo ✅ Serviço encontrado
)
echo.

echo 🗄️ PostgreSQL:
sc query postgresql-x64-14 2>nul | findstr STATE
if %errorlevel% neq 0 (
    sc query postgresql-x64-13 2>nul | findstr STATE
    if %errorlevel% neq 0 (
        sc query postgresql-x64-12 2>nul | findstr STATE
        if %errorlevel% neq 0 (
            echo ❌ PostgreSQL não encontrado
        )
    )
)
echo.

echo 📋 2. VERIFICANDO PORTAS EM USO...
echo.

echo 🌐 Porta 81 (IIS):
netstat -an | findstr :81
if %errorlevel% neq 0 (
    echo ❌ Porta 81 não está sendo usada
) else (
    echo ✅ Porta 81 ativa
)
echo.

echo 🚀 Porta 3001 (Backend):
netstat -an | findstr :3001
if %errorlevel% neq 0 (
    echo ❌ Porta 3001 não está sendo usada - PROBLEMA ENCONTRADO!
) else (
    echo ✅ Porta 3001 ativa
)
echo.

echo 🗄️ Porta 5432 (PostgreSQL):
netstat -an | findstr :5432
if %errorlevel% neq 0 (
    echo ❌ Porta 5432 não está sendo usada - PostgreSQL pode estar parado
) else (
    echo ✅ Porta 5432 ativa
)
echo.

echo 📋 3. TESTANDO CONECTIVIDADE...
echo.

echo 🚀 Testando Backend diretamente:
curl -s http://localhost:3001/api/health 2>nul
if %errorlevel% neq 0 (
    echo ❌ Backend não responde - PROBLEMA CRÍTICO!
    echo.
    echo 💡 SOLUÇÕES:
    echo    1. Iniciar serviço: sc start GymPulseBackend
    echo    2. Verificar logs: type C:\gym-pulse-system\logs\backend.log
    echo    3. Reinstalar serviço: .\configurar-servico-node-v2.bat
) else (
    echo ✅ Backend respondendo
)
echo.

echo 🌐 Testando IIS com proxy:
curl -s http://localhost:81/api/health 2>nul
if %errorlevel% neq 0 (
    echo ❌ IIS não consegue fazer proxy para backend
    echo.
    echo 💡 SOLUÇÕES:
    echo    1. Reconfigurar proxy: .\configurar-proxy-iis.bat
    echo    2. Reiniciar IIS: iisreset
) else (
    echo ✅ Proxy IIS funcionando
)
echo.

echo 📋 4. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO...
echo.

echo 📁 Frontend (dist):
if exist "C:\gym-pulse-system\dist\index.html" (
    echo ✅ Arquivos do frontend encontrados
) else (
    echo ❌ Arquivos do frontend não encontrados
    echo 💡 Execute: npm run build
)
echo.

echo 📁 Backend:
if exist "C:\gym-pulse-system\backend\index.js" (
    echo ✅ Arquivos do backend encontrados
) else (
    echo ❌ Arquivos do backend não encontrados
    echo 💡 Execute: .\setup-backend-producao.bat
)
echo.

echo 📋 5. VERIFICANDO LOGS DE ERRO...
echo.

if exist "C:\gym-pulse-system\logs\backend.log" (
    echo 🚀 Últimas 10 linhas do log do backend:
    echo ----------------------------------------
    powershell "Get-Content 'C:\gym-pulse-system\logs\backend.log' | Select-Object -Last 10"
    echo ----------------------------------------
) else (
    echo ❌ Log do backend não encontrado
)
echo.

if exist "C:\gym-pulse-system\logs\error.log" (
    echo ❌ Últimas 5 linhas do log de erros:
    echo ----------------------------------------
    powershell "Get-Content 'C:\gym-pulse-system\logs\error.log' | Select-Object -Last 5"
    echo ----------------------------------------
) else (
    echo ✅ Nenhum log de erro encontrado
)
echo.

echo 📋 RESUMO DO DIAGNÓSTICO:
echo =========================
echo.
echo Se você viu ❌ em algum item acima, essas são as causas do erro 500.
echo.
echo 🔧 SOLUÇÕES RÁPIDAS:
echo.
echo 1️⃣ Se Backend parado:
echo    sc start GymPulseBackend
echo.
echo 2️⃣ Se PostgreSQL parado:
echo    Inicie o PostgreSQL pelo pgAdmin ou services.msc
echo.
echo 3️⃣ Se IIS com problema:
echo    iisreset
echo.
echo 4️⃣ Se arquivos ausentes:
echo    .\setup-backend-producao.bat
echo    npm run build
echo.
echo 5️⃣ Reconfigurar tudo:
echo    .\configurar-servico-node-v2.bat
echo    .\configurar-proxy-iis.bat
echo.
echo ⚡ Para execução automática das soluções, execute:
echo    .\testar-funcionamento.bat
echo.
pause


