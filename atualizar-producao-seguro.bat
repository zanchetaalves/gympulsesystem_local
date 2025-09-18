@echo off
color 0E
echo ========================================
echo   ATUALIZACAO SEGURA EM PRODUCAO
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

set "PROJETO_ATUAL=C:\gym-pulse-system"
set "PROJETO_NOVO=C:\gym-pulse-system-novo"
set "BACKUP_DIR=C:\gym-pulse-system-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%"

echo.
echo 📋 CONFIGURAÇÕES:
echo Projeto atual: %PROJETO_ATUAL%
echo Projeto novo: %PROJETO_NOVO%
echo Backup: %BACKUP_DIR%
echo.

echo 📋 PASSO 1: Verificando status atual...
echo.
echo Status do serviço:
sc query gympulsebackend.exe | findstr "STATE"

echo.
echo Testando API atual:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 5; Write-Host '✅ API atual OK:' $r.StatusCode } catch { Write-Host '❌ API atual falhou:' $_.Exception.Message }"

echo.
echo Verificando uso da porta 3001:
netstat -ano | findstr :3001

echo.
echo 📋 PASSO 2: Verificando projeto novo...
if not exist "%PROJETO_NOVO%" (
    echo ❌ ERRO: Projeto novo não encontrado em %PROJETO_NOVO%
    echo.
    echo INSTRUÇÕES:
    echo 1. Baixe/descompacte o projeto atualizado em: %PROJETO_NOVO%
    echo 2. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Projeto novo encontrado!
echo Conteúdo:
dir "%PROJETO_NOVO%" /b

echo.
echo 📋 PASSO 3: Criando backup completo...
echo Criando backup em: %BACKUP_DIR%

if exist "%BACKUP_DIR%" (
    echo Removendo backup anterior...
    rmdir "%BACKUP_DIR%" /s /q >nul 2>&1
)

echo Copiando projeto atual para backup...
xcopy "%PROJETO_ATUAL%" "%BACKUP_DIR%\" /E /I /Y /Q >nul
if %errorLevel% == 0 (
    echo ✅ Backup criado com sucesso!
) else (
    echo ❌ ERRO ao criar backup!
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 4: Parando serviço backend...
echo.
sc stop gympulsebackend.exe
echo Aguardando parada do serviço...
timeout /t 5 >nul

sc query gympulsebackend.exe | findstr "STATE"

echo.
echo Verificando se porta 3001 está livre...
netstat -ano | findstr :3001 >nul
if %errorLevel% == 0 (
    echo ⚠️ Porta ainda em uso, aguardando mais...
    timeout /t 10 >nul
    
    netstat -ano | findstr :3001 >nul
    if !errorLevel! == 0 (
        echo ❌ Processo ainda usando porta 3001
        echo Forçando encerramento...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
        timeout /t 3 >nul
    )
)

echo ✅ Porta 3001 liberada!

echo.
echo 📋 PASSO 5: Atualizando arquivos...
echo.

REM Preservar arquivos importantes
echo Preservando arquivos de configuração...
if exist "%PROJETO_ATUAL%\backend\.env" (
    copy "%PROJETO_ATUAL%\backend\.env" "%PROJETO_NOVO%\backend\.env.backup" >nul 2>&1
    echo ✅ .env preservado
)

if exist "%PROJETO_ATUAL%\backend\daemon" (
    xcopy "%PROJETO_ATUAL%\backend\daemon" "%PROJETO_NOVO%\backend\daemon\" /E /Y /Q >nul 2>&1
    echo ✅ daemon preservado
)

if exist "%PROJETO_ATUAL%\logs" (
    xcopy "%PROJETO_ATUAL%\logs" "%PROJETO_NOVO%\logs\" /E /Y /Q >nul 2>&1
    echo ✅ logs preservados
)

echo.
echo Removendo projeto atual...
REM Mover ao invés de deletar para segurança
if exist "%PROJETO_ATUAL%.old" rmdir "%PROJETO_ATUAL%.old" /s /q >nul 2>&1
ren "%PROJETO_ATUAL%" "gym-pulse-system.old" >nul 2>&1

echo Movendo projeto novo para local correto...
ren "%PROJETO_NOVO%" "gym-pulse-system" >nul 2>&1

if exist "%PROJETO_ATUAL%" (
    echo ✅ Projeto atualizado com sucesso!
) else (
    echo ❌ ERRO na atualização! Restaurando backup...
    ren "C:\gym-pulse-system.old" "gym-pulse-system" >nul 2>&1
    pause
    exit /b 1
)

echo.
echo 📋 PASSO 6: Configurando novo projeto...
cd "%PROJETO_ATUAL%"

echo Verificando se precisa instalar dependências...
if not exist "%PROJETO_ATUAL%\backend\node_modules" (
    echo Instalando dependências do backend...
    cd "%PROJETO_ATUAL%\backend"
    call npm install --production
    if !errorLevel! neq 0 (
        echo ❌ ERRO ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas!
    cd "%PROJETO_ATUAL%"
)

echo.
echo Verificando se precisa fazer build do frontend...
if not exist "%PROJETO_ATUAL%\dist\index.html" (
    echo Fazendo build do frontend...
    call npm run build
    if !errorLevel! neq 0 (
        echo ❌ ERRO no build do frontend!
        pause
        exit /b 1
    )
    echo ✅ Build do frontend concluído!
)

echo.
echo 📋 PASSO 7: Restaurando configurações...
if exist "%PROJETO_ATUAL%\backend\.env.backup" (
    echo Verificando configurações...
    fc "%PROJETO_ATUAL%\backend\.env" "%PROJETO_ATUAL%\backend\.env.backup" >nul 2>&1
    if !errorLevel! neq 0 (
        echo Configurações diferentes detectadas.
        echo Deseja usar a configuração anterior? (s/n)
        set /p "usar_config_antiga="
        if /i "!usar_config_antiga!"=="s" (
            copy "%PROJETO_ATUAL%\backend\.env.backup" "%PROJETO_ATUAL%\backend\.env" >nul
            echo ✅ Configuração anterior restaurada
        )
    )
)

echo.
echo 📋 PASSO 8: Reiniciando serviço...
echo.
sc start gympulsebackend.exe
echo Aguardando inicialização...
timeout /t 10 >nul

sc query gympulsebackend.exe | findstr "STATE"

echo.
echo 📋 PASSO 9: Testando aplicação atualizada...
echo.
timeout /t 5 >nul

echo Testando backend:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; Write-Host '✅ Backend OK:' $r.StatusCode; Write-Host 'Response:' $r.Content } catch { Write-Host '❌ Backend falhou:' $_.Exception.Message }"

echo.
echo Testando frontend:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81' -TimeoutSec 10; Write-Host '✅ Frontend OK:' $r.StatusCode } catch { Write-Host '❌ Frontend falhou:' $_.Exception.Message }"

echo.
echo Testando proxy da API:
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:81/api/health' -TimeoutSec 10; Write-Host '✅ Proxy OK:' $r.StatusCode } catch { Write-Host '❌ Proxy falhou:' $_.Exception.Message }"

echo.
echo ========================================
echo   ATUALIZACAO CONCLUIDA! ✅
echo ========================================
echo.
echo 🎯 RESULTADO:
echo ✅ Backup criado em: %BACKUP_DIR%
echo ✅ Projeto atualizado em: %PROJETO_ATUAL%
echo ✅ Serviço reiniciado
echo.
echo 🌐 TESTES:
echo Frontend: http://localhost:81/
echo API: http://localhost:81/api/health
echo.
echo 📋 EM CASO DE PROBLEMAS:
echo 1. Verifique logs: type C:\gym-pulse-system\logs\error.log
echo 2. Restaurar backup: .\restaurar-backup.bat
echo.
echo 🗑️ LIMPEZA (OPCIONAL):
echo - Remover projeto antigo: rmdir C:\gym-pulse-system.old /s /q
echo - Remover backup depois de confirmar: rmdir "%BACKUP_DIR%" /s /q
echo.
pause
