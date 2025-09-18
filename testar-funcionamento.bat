@echo off
color 0E
echo ========================================
echo   TESTANDO FUNCIONAMENTO COMPLETO
echo ========================================
echo.

echo 📋 TESTE 1: Status do servico Windows...
sc query GymPulseBackend | findstr "STATE\|SERVICE_NAME"
echo.

echo 📋 TESTE 2: Verificando portas em uso...
echo Portas relacionadas ao projeto:
netstat -an | findstr ":80\|:3001\|:5432"
echo.

echo 📋 TESTE 3: Testando backend diretamente...
echo Testando http://localhost:3001/api/health
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ Backend Health: OK'; Write-Host 'Response:' $response.Content } catch { Write-Host '❌ Backend Health: FALHOU'; Write-Host 'Erro:' $_.Exception.Message }"
echo.

echo 📋 TESTE 4: Testando PostgreSQL...
echo Verificando se PostgreSQL esta rodando...
sc query postgresql-x64-13 2>nul | findstr "RUNNING" >nul
if %errorLevel% == 0 (
    echo ✅ PostgreSQL esta rodando
) else (
    sc query postgresql-x64-14 2>nul | findstr "RUNNING" >nul
    if %errorLevel% == 0 (
        echo ✅ PostgreSQL esta rodando
    ) else (
        echo ⚠️ PostgreSQL pode nao estar rodando
        echo Verifique o servico PostgreSQL no "Services.msc"
    )
)
echo.

echo 📋 TESTE 5: Verificando logs do backend...
set "PROJETO_BASE=C:\gym-pulse-system"

if exist "%PROJETO_BASE%\logs\backend.log" (
    echo ✅ Log encontrado. Ultimas 5 linhas:
    powershell "Get-Content '%PROJETO_BASE%\logs\backend.log' -Tail 5 2>$null"
) else (
    echo ⚠️ Log do backend nao encontrado
)
echo.

if exist "%PROJETO_BASE%\logs\error.log" (
    echo ⚠️ Log de erros encontrado. Ultimas 5 linhas:
    powershell "Get-Content '%PROJETO_BASE%\logs\error.log' -Tail 5 2>$null"
    echo.
)

echo 📋 TESTE 6: Testando frontend (IIS)...
echo Testando http://localhost (frontend)
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost' -TimeoutSec 10; Write-Host '✅ Frontend (IIS): OK' } catch { Write-Host '❌ Frontend (IIS): FALHOU'; Write-Host 'Erro:' $_.Exception.Message }"
echo.

echo ========================================
echo   RESULTADO DOS TESTES
echo ========================================
echo.
echo Se todos os testes passaram (✅), sua aplicacao esta funcionando!
echo.
echo 🌐 PROXIMOS PASSOS:
echo.
echo 1. Configurar proxy no IIS para /api/*
echo 2. Testar comunicacao frontend ↔ backend
echo 3. Configurar SSL (HTTPS) se necessario
echo.
echo 📱 ACESSOS:
echo Frontend: http://localhost/
echo Backend:  http://localhost:3001/api/health
echo.
echo 🛠️ COMANDOS DE MANUTENCAO:
echo Ver status:    sc query GymPulseBackend
echo Ver logs:      type %PROJETO_BASE%\logs\backend.log
echo Reiniciar:     sc stop GymPulseBackend && sc start GymPulseBackend
echo.
pause
