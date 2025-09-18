@echo off
color 0B
echo ========================================
echo   DESCOBRINDO SERVICO BACKEND
echo ========================================
echo.

echo 📋 PASSO 1: Procurando servicos relacionados...
echo.
echo Procurando por "Gym":
sc query | findstr -i gym
echo.

echo Procurando por "Pulse":
sc query | findstr -i pulse
echo.

echo Procurando por "Backend":
sc query | findstr -i backend
echo.

echo Procurando por "Node":
sc query | findstr -i node
echo.

echo 📋 PASSO 2: Verificando processos Node.js ativos...
echo.
echo Processos Node.js em execucao:
tasklist | findstr node.exe
echo.

echo 📋 PASSO 3: Verificando porta 3001...
echo.
echo Processos usando porta 3001:
netstat -ano | findstr :3001
echo.

if %errorLevel% == 0 (
    echo ✅ Porta 3001 esta em uso!
    echo.
    echo Identificando o processo:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" /FO TABLE
    )
) else (
    echo ❌ Porta 3001 NAO esta em uso!
)

echo.
echo 📋 PASSO 4: Verificando servicos do Windows relacionados...
echo.
echo Todos os servicos com "node" no nome ou descricao:
powershell -Command "Get-Service | Where-Object {$_.Name -like '*node*' -or $_.DisplayName -like '*node*' -or $_.DisplayName -like '*gym*' -or $_.DisplayName -like '*pulse*'} | Format-Table Name, DisplayName, Status -AutoSize"

echo.
echo 📋 PASSO 5: Verificando tarefas agendadas...
echo.
echo Tarefas agendadas relacionadas:
schtasks /query | findstr -i "gym\|pulse\|node\|backend"

echo.
echo 📋 PASSO 6: Verificando se esta rodando como aplicacao...
echo.
echo Verificando processos que podem ser o backend:
powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'node' -or $_.MainWindowTitle -like '*gym*' -or $_.MainWindowTitle -like '*pulse*'} | Format-Table ProcessName, Id, MainWindowTitle -AutoSize"

echo.
echo 📋 PASSO 7: Verificando diretorios de servicos...
echo.
if exist "C:\gym-pulse-system\backend" (
    echo ✅ Pasta backend encontrada
    echo Conteudo:
    dir "C:\gym-pulse-system\backend" /b
    
    echo.
    echo Verificando scripts de servico:
    if exist "C:\gym-pulse-system\backend\install-service.cjs" (
        echo ✅ install-service.cjs encontrado
    ) else (
        echo ❌ install-service.cjs NAO encontrado
    )
    
    if exist "C:\gym-pulse-system\backend\start-service.bat" (
        echo ✅ start-service.bat encontrado
    ) else (
        echo ❌ start-service.bat NAO encontrado
    )
) else (
    echo ❌ Pasta backend NAO encontrada
)

echo.
echo 📋 PASSO 8: Testando API diretamente...
echo.
echo Testando endpoint de saude:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 5; Write-Host '✅ API respondendo:' $r.StatusCode; Write-Host 'Response:' $r.Content } catch { Write-Host '❌ API nao responde:' $_.Exception.Message }"

echo.
echo Testando através do proxy (porta 81):
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/health' -TimeoutSec 5; Write-Host '✅ Proxy funcionando:' $r.StatusCode } catch { Write-Host '❌ Proxy nao funciona:' $_.Exception.Message }"

echo.
echo ========================================
echo   RESULTADO DA INVESTIGACAO
echo ========================================
echo.
echo 📋 ANALISE:
echo.
if %errorLevel% == 0 (
    echo ✅ Backend esta funcionando
    echo ✅ Aplicacao esta operacional
    echo.
    echo 💡 POSSIBILIDADES:
    echo 1. Servico com nome diferente de GymPulseBackend
    echo 2. Rodando como processo comum (nao como servico)
    echo 3. Rodando via PM2 ou outro gerenciador
    echo 4. Rodando manualmente ou via script
    echo.
    echo 🔧 PROXIMOS PASSOS:
    echo - Identifique o processo/servico correto acima
    echo - Se nao for servico, considere criar um
    echo - Use .\configurar-servico-node-v2.bat para criar servico oficial
) else (
    echo ❌ Backend NAO esta funcionando
    echo ❌ Precisa ser iniciado/configurado
    echo.
    echo 🔧 EXECUTE:
    echo 1. .\setup-backend-producao.bat
    echo 2. .\configurar-servico-node-v2.bat
)

echo.
pause
