@echo off
echo ======================================================
echo 🧪 TESTE COMPLETO - GYM PULSE SYSTEM
echo ======================================================

set PROD_DIR=C:\gym-pulse-production
set SERVICE_NAME=GymPulseSystem
set BASE_URL=http://localhost:3000

echo.
echo 🔍 Verificando status do serviço...
sc query "%SERVICE_NAME%" | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo ✅ Serviço %SERVICE_NAME% está rodando
) else (
    echo ❌ Serviço %SERVICE_NAME% não está rodando
    echo Tentando iniciar...
    sc start "%SERVICE_NAME%"
    timeout /t 5 /nobreak >nul
)

echo.
echo 🌐 Verificando se a porta 3000 está em uso...
netstat -an | find ":3000" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Porta 3000 está ativa
) else (
    echo ❌ Porta 3000 não está ativa
    echo Aguardando servidor inicializar...
    timeout /t 10 /nobreak >nul
)

echo.
echo 🔗 Testando endpoint de saúde da API...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BASE_URL%/api/health' -TimeoutSec 15; Write-Host '✅ API Health Check:', $response.StatusCode; $content = $response.Content | ConvertFrom-Json; Write-Host '📊 Status:', $content.status; Write-Host '🕒 Timestamp:', $content.timestamp } catch { Write-Host '❌ Erro na API Health Check:', $_.Exception.Message }"

echo.
echo 🗄️ Testando conexão com PostgreSQL...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BASE_URL%/api/plans' -TimeoutSec 15; Write-Host '✅ Conexão com banco OK - Planos carregados:', $response.StatusCode } catch { Write-Host '❌ Erro ao conectar com banco:', $_.Exception.Message }"

echo.
echo 🌐 Testando frontend (interface web)...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BASE_URL%/' -TimeoutSec 15; if ($response.StatusCode -eq 200 -and $response.Content -like '*<!DOCTYPE html>*') { Write-Host '✅ Frontend carregando corretamente' } else { Write-Host '⚠️ Frontend respondeu mas pode ter problemas' } } catch { Write-Host '❌ Erro ao carregar frontend:', $_.Exception.Message }"

echo.
echo 🧭 Testando roteamento SPA...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BASE_URL%/clientes' -TimeoutSec 15; if ($response.StatusCode -eq 200 -and $response.Content -like '*<!DOCTYPE html>*') { Write-Host '✅ SPA Routing funcionando (rota /clientes)' } else { Write-Host '⚠️ SPA Routing pode ter problemas' } } catch { Write-Host '❌ Erro no SPA Routing:', $_.Exception.Message }"

echo.
echo 📊 Verificando logs do sistema...
if exist "%PROD_DIR%\logs\production.log" (
    echo ✅ Arquivo de log encontrado
    echo 📄 Últimas 5 linhas do log:
    powershell -Command "Get-Content '%PROD_DIR%\logs\production.log' -Tail 5"
) else (
    echo ℹ️ Nenhum arquivo de log específico encontrado
)

echo.
echo 💾 Verificando espaço em disco...
powershell -Command "$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter 'DeviceID=\"C:\"'; $freeGB = [math]::Round($disk.FreeSpace/1GB, 2); $totalGB = [math]::Round($disk.Size/1GB, 2); Write-Host '💽 Espaço livre em C:', $freeGB, 'GB de', $totalGB, 'GB'"

echo.
echo 🔄 Verificando uso de memória do processo...
powershell -Command "try { $processes = Get-Process -Name node -ErrorAction SilentlyContinue; if ($processes) { foreach ($proc in $processes) { $memMB = [math]::Round($proc.WorkingSet64/1MB, 2); Write-Host '🧠 Processo Node.js PID', $proc.Id, '- Memória:', $memMB, 'MB' } } else { Write-Host '⚠️ Nenhum processo Node.js encontrado' } } catch { Write-Host '❌ Erro ao verificar processos' }"

echo.
echo ======================================================
echo 📋 RESUMO DO TESTE
echo ======================================================

REM Fazer uma verificação final rápida
powershell -Command "try { $health = Invoke-WebRequest -Uri '%BASE_URL%/api/health' -TimeoutSec 10; $frontend = Invoke-WebRequest -Uri '%BASE_URL%/' -TimeoutSec 10; if ($health.StatusCode -eq 200 -and $frontend.StatusCode -eq 200) { Write-Host '🎉 SISTEMA FUNCIONANDO CORRETAMENTE!'; Write-Host ''; Write-Host '🌐 Acesse: %BASE_URL%'; Write-Host '📊 API: %BASE_URL%/api/health'; Write-Host ''; Write-Host '✅ Tudo está funcionando perfeitamente!'; } else { Write-Host '⚠️ Sistema parcialmente funcional'; Write-Host 'Verifique os erros acima'; } } catch { Write-Host '❌ Sistema com problemas'; Write-Host 'Verifique os logs e configurações'; }"

echo.
echo 🛠️ Comandos úteis para manutenção:
echo    sc query %SERVICE_NAME%           - Status do serviço
echo    sc restart %SERVICE_NAME%         - Reiniciar serviço
echo    netstat -an ^| find ":3000"       - Verificar porta
echo    tasklist ^| find "node"           - Processos Node.js
echo.
echo 📁 Diretório: %PROD_DIR%
echo 📊 Logs: %PROD_DIR%\logs\
echo.
pause
