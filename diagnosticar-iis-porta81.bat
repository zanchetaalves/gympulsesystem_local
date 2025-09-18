@echo off
color 0C
echo ========================================
echo   DIAGNOSTICO IIS PORTA 81
echo ========================================
echo.

echo 📋 PASSO 1: Verificando status do IIS...
iisreset /status
echo.

echo 📋 PASSO 2: Verificando sites no IIS...
echo Sites configurados:
powershell -Command "Import-Module WebAdministration; Get-Website | Select-Object Name, State, Port, PhysicalPath | Format-Table -AutoSize"
echo.

echo 📋 PASSO 3: Verificando porta 81...
echo Processos usando porta 81:
netstat -ano | findstr :81
echo.

echo 📋 PASSO 4: Verificando logs do IIS...
echo Verificando logs de erro do IIS...
if exist "C:\inetpub\logs\LogFiles\W3SVC1\" (
    echo Ultimos logs W3SVC1:
    dir "C:\inetpub\logs\LogFiles\W3SVC1\" /o-d | head -5
    echo.
    echo Verificando erros recentes...
    powershell -Command "Get-ChildItem 'C:\inetpub\logs\LogFiles\W3SVC1\' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { Get-Content $_.FullName | Select-Object -Last 10 }"
) else (
    echo ❌ Pasta de logs do IIS nao encontrada
)

echo.
echo 📋 PASSO 5: Verificando arquivos da aplicacao...
echo.
echo Onde esta o frontend da aplicacao na porta 81?
echo Opcoes comuns:
echo 1. C:\inetpub\wwwroot\
echo 2. C:\gym-pulse-system\dist\
echo 3. Outro local
echo.
set /p "opcao=Digite o numero da opcao [1-3]: "

if "%opcao%"=="1" (
    set "FRONTEND_PATH=C:\inetpub\wwwroot"
) else if "%opcao%"=="2" (
    set "FRONTEND_PATH=C:\gym-pulse-system\dist"
) else (
    set /p "FRONTEND_PATH=Digite o caminho completo do frontend: "
)

echo.
echo Verificando arquivos em: %FRONTEND_PATH%
if exist "%FRONTEND_PATH%" (
    echo ✅ Pasta encontrada!
    echo Conteudo:
    dir "%FRONTEND_PATH%" /b
    echo.
    
    echo Verificando index.html:
    if exist "%FRONTEND_PATH%\index.html" (
        echo ✅ index.html encontrado
    ) else (
        echo ❌ index.html NAO encontrado!
    )
    
    echo Verificando web.config:
    if exist "%FRONTEND_PATH%\web.config" (
        echo ✅ web.config encontrado
        echo Conteudo do web.config:
        type "%FRONTEND_PATH%\web.config"
    ) else (
        echo ❌ web.config NAO encontrado!
    )
) else (
    echo ❌ Pasta nao encontrada: %FRONTEND_PATH%
)

echo.
echo 📋 PASSO 6: Verificando backend...
echo Status do servico backend:
sc query GymPulseBackend 2>nul
if %errorLevel% == 0 (
    echo ✅ Servico GymPulseBackend existe
    sc query GymPulseBackend | findstr "STATE"
) else (
    echo ❌ Servico GymPulseBackend nao encontrado!
)

echo.
echo Verificando porta 3001 (backend):
netstat -an | findstr :3001
if %errorLevel% == 0 (
    echo ✅ Backend rodando na porta 3001
) else (
    echo ❌ Backend NAO esta rodando na porta 3001!
)

echo.
echo 📋 PASSO 7: Testando conectividade...
echo Testando localhost:81...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ localhost:81 responde'; Write-Host 'Status:' $response.StatusCode } catch { Write-Host '❌ localhost:81 falhou:' $_.Exception.Message }"

echo.
echo Testando backend direto...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ Backend responde'; Write-Host 'Response:' $response.Content } catch { Write-Host '❌ Backend falhou:' $_.Exception.Message }"

echo.
echo ========================================
echo   RESULTADO DO DIAGNOSTICO
echo ========================================
echo.
echo Se encontrou problemas, execute:
echo 1. corrigir-iis-porta81.bat (se for problema de configuracao)
echo 2. verificar-backend.bat (se for problema do backend)
echo.
pause
