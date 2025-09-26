@echo off
chcp 65001 >nul
echo.
echo 🚀 MIGRAÇÃO PARA NODE.JS UNIFICADO (SEM IIS)
echo =============================================
echo.
echo Este script vai configurar a aplicação para rodar completamente no Node.js
echo eliminando a necessidade do IIS e resolvendo problemas de proxy.
echo.

echo 📋 PASSO 1: PARANDO SERVIÇOS ATUAIS...
echo.

echo ⏹️ Parando serviço backend atual:
sc stop GymPulseBackend 2>nul
timeout /t 3 /nobreak >nul

echo ⏹️ Parando IIS (se estiver rodando):
iisreset /stop 2>nul
echo ✅ Serviços parados
echo.

echo 📋 PASSO 2: CRIANDO ESTRUTURA DE PRODUÇÃO...
echo.

echo 📁 Criando pasta de produção:
if not exist "C:\gym-pulse-production" mkdir "C:\gym-pulse-production"
echo ✅ Pasta criada: C:\gym-pulse-production

echo.
echo 📁 Criando subpastas:
if not exist "C:\gym-pulse-production\logs" mkdir "C:\gym-pulse-production\logs"
if not exist "C:\gym-pulse-production\scripts" mkdir "C:\gym-pulse-production\scripts"
echo ✅ Subpastas criadas
echo.

echo 📋 PASSO 3: COPIANDO ARQUIVOS NECESSÁRIOS...
echo.

echo 📄 Copiando servidor unificado:
copy "server-producao.js" "C:\gym-pulse-production\" >nul
echo ✅ server-producao.js copiado

echo 📄 Copiando configurações:
copy "package-producao.json" "C:\gym-pulse-production\package.json" >nul
copy "env.production" "C:\gym-pulse-production\.env" >nul
echo ✅ Configurações copiadas

echo 📄 Copiando pasta server (auth.js):
if exist "server" (
    xcopy "server\*" "C:\gym-pulse-production\server\" /E /I /Y >nul
    echo ✅ Pasta server copiada
) else (
    echo ⚠️ Pasta server não encontrada, verifique a estrutura
)

echo 📄 Copiando scripts de banco:
if exist "scripts" (
    xcopy "scripts\*" "C:\gym-pulse-production\scripts\" /E /I /Y >nul
    echo ✅ Scripts copiados
) else (
    echo ⚠️ Pasta scripts não encontrada
)

echo 📄 Copiando frontend build:
if exist "dist" (
    xcopy "dist\*" "C:\gym-pulse-production\dist\" /E /I /Y >nul
    echo ✅ Frontend copiado (pasta dist)
) else (
    echo ❌ Pasta 'dist' não encontrada!
    echo 💡 Execute primeiro: npm run build
    echo.
    echo ⏸️ Script pausado. Execute npm run build e rode este script novamente.
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 4: INSTALANDO DEPENDÊNCIAS...
echo.

cd /d "C:\gym-pulse-production"

echo 🔄 Instalando dependências Node.js:
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)
echo ✅ Dependências instaladas

echo.
echo 📋 PASSO 5: TESTANDO BANCO DE DADOS...
echo.

echo 🗄️ Configurando banco de dados:
call npm run setup:db
if %errorlevel% neq 0 (
    echo ⚠️ Problema no banco, mas continuando...
)

echo.
echo 📋 PASSO 6: TESTANDO SERVIDOR...
echo.

echo 🧪 Teste rápido do servidor (30 segundos):
echo    Se aparecer "GYM PULSE SYSTEM - PRODUCTION SERVER", está funcionando!
echo    Pressione Ctrl+C quando aparecer a mensagem de sucesso.
echo.
echo ⏱️ Iniciando em 3 segundos...
timeout /t 3 /nobreak >nul

start /wait cmd /c "node server-producao.js & timeout /t 30 /nobreak >nul"

echo.
echo 📋 PASSO 7: CRIANDO SERVIÇO WINDOWS...
echo.

echo 🔧 Removendo serviço antigo:
sc delete GymPulseBackend 2>nul

echo 🔧 Criando novo serviço Node.js unificado:

sc create GymPulseUnified ^
    binPath= "\"C:\Program Files\nodejs\node.exe\" \"C:\gym-pulse-production\server-producao.js\"" ^
    start= auto ^
    DisplayName= "Gym Pulse - Servidor Unificado" ^
    Description= "Sistema completo Gym Pulse (Frontend + Backend + API)"

if %errorlevel% neq 0 (
    echo ❌ Erro ao criar serviço
    pause
    exit /b 1
)

echo ✅ Serviço criado com sucesso!

echo 🔧 Configurando diretório de trabalho:
sc config GymPulseUnified start= delayed-auto

echo.
echo 📋 PASSO 8: INICIANDO SERVIÇO...
echo.

echo 🚀 Iniciando serviço unificado:
sc start GymPulseUnified

echo ⏱️ Aguardando 15 segundos para inicialização...
timeout /t 15 /nobreak

echo 🔍 Verificando status:
sc query GymPulseUnified | findstr STATE

echo.
echo 📋 PASSO 9: TESTANDO APLICAÇÃO COMPLETA...
echo.

echo ⏱️ Aguardando mais 10 segundos...
timeout /t 10 /nobreak

echo 🌐 Testando Frontend:
curl -s http://localhost:3000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend funcionando
) else (
    echo ❌ Frontend não responde
)

echo 📊 Testando API:
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API funcionando
) else (
    echo ❌ API não responde
)

echo.
echo 🎉 MIGRAÇÃO CONCLUÍDA!
echo =====================
echo.
echo ✅ NOVO ACESSO:
echo    🌐 Frontend: http://localhost:3000/
echo    📊 API: http://localhost:3000/api/health
echo    🔐 Login: http://localhost:3000/login
echo.
echo ✅ VANTAGENS DA NOVA CONFIGURAÇÃO:
echo    - ✅ Sem problemas de proxy
echo    - ✅ Sem dependência do IIS  
echo    - ✅ SPA routing nativo
echo    - ✅ Melhor performance
echo    - ✅ Logs centralizados
echo    - ✅ Mais fácil de manter
echo.
echo 📋 COMANDOS ÚTEIS:
echo ==================
echo.
echo ▶️  Iniciar:    sc start GymPulseUnified
echo ⏹️  Parar:      sc stop GymPulseUnified
echo 🔍 Status:     sc query GymPulseUnified
echo 🗑️  Remover:    sc delete GymPulseUnified
echo 📊 Logs:       type C:\gym-pulse-production\logs\production.log
echo 🌐 Testar:     curl http://localhost:3000/api/health
echo 📁 Pasta:      cd C:\gym-pulse-production
echo.
echo 💡 PRÓXIMOS PASSOS:
echo ===================
echo.
echo 1️⃣ Teste a aplicação em: http://localhost:3000/
echo 2️⃣ Faça login e teste todas as funcionalidades
echo 3️⃣ Se algo não funcionar, verifique os logs
echo 4️⃣ Configure firewall para porta 3000 (se necessário)
echo 5️⃣ Atualize links/bookmarks para nova porta
echo.
echo 🔥 A aplicação agora roda 100%% em Node.js!
echo    Sem IIS, sem proxy, sem problemas! 🚀
echo.
pause

