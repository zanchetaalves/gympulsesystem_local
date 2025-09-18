@echo off
color 0C
echo ========================================
echo   RESTAURAR BACKUP EM CASO DE ERRO
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
echo 📋 Procurando backups disponíveis...
echo.
dir C:\gym-pulse-system-backup-* /b /ad 2>nul
if %errorLevel% neq 0 (
    echo ❌ Nenhum backup encontrado!
    pause
    exit /b 1
)

echo.
set /p "backup_dir=Digite o nome completo da pasta de backup: "

if not exist "C:\%backup_dir%" (
    echo ❌ Backup não encontrado: C:\%backup_dir%
    pause
    exit /b 1
)

echo.
echo ⚠️ ATENÇÃO: Esta operação irá:
echo 1. Parar o serviço backend
echo 2. Substituir o projeto atual pelo backup
echo 3. Reiniciar o serviço
echo.
set /p "confirma=Confirma a restauração? (DIGITE 'SIM' para confirmar): "

if not "%confirma%"=="SIM" (
    echo Operação cancelada.
    pause
    exit /b 0
)

echo.
echo 📋 RESTAURANDO BACKUP...

echo Parando serviço...
sc stop gympulsebackend.exe
timeout /t 5 >nul

echo Fazendo backup do projeto atual (com problemas)...
if exist "C:\gym-pulse-system-problema" rmdir "C:\gym-pulse-system-problema" /s /q >nul 2>&1
ren "C:\gym-pulse-system" "gym-pulse-system-problema" >nul 2>&1

echo Restaurando backup...
xcopy "C:\%backup_dir%" "C:\gym-pulse-system\" /E /I /Y /Q >nul

echo Reiniciando serviço...
sc start gympulsebackend.exe
timeout /t 10 >nul

echo.
echo ✅ BACKUP RESTAURADO!
echo.
echo Testando...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ Restauração OK:' $r.StatusCode } catch { Write-Host '❌ Problema na restauração:' $_.Exception.Message }"
echo.
pause
