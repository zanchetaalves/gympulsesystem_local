@echo off
echo ======================================================
echo ATUALIZACAO PRODUCAO - GYM PULSE SYSTEM
echo ======================================================

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Executando como Administrador
) else (
    echo [ERRO] Execute como Administrador!
    pause
    exit /b 1
)

set PROD_DIR=C:\gym-pulse-production
set SERVICE_NAME=GymPulseSystem
set BACKUP_DIR=C:\gym-pulse-backups
set NSSM_PATH=C:\nssm-2.24\win64\nssm.exe
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo.
echo [INFO] Verificacoes pre-atualizacao...

REM Verificar se tem novo build
if not exist "dist\index.html" (
    echo [ERRO] Pasta 'dist' nao encontrada!
    echo Execute 'npm run build' primeiro
    pause
    exit /b 1
)

REM Verificar se diretório de produção existe
if not exist "%PROD_DIR%" (
    echo [ERRO] Diretorio de producao nao encontrado!
    echo Execute setup-producao.bat primeiro
    pause
    exit /b 1
)

echo [OK] Verificacoes OK

echo.
echo [INFO] Criando backup automatico...

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
set BACKUP_FOLDER=%BACKUP_DIR%\backup_%TIMESTAMP%
mkdir "%BACKUP_FOLDER%"

xcopy "%PROD_DIR%" "%BACKUP_FOLDER%" /E /I /H /Y >nul
if %errorlevel% == 0 (
    echo [OK] Backup criado: %BACKUP_FOLDER%
) else (
    echo [ERRO] Erro ao criar backup
    pause
    exit /b 1
)

echo.
echo [INFO] Parando servico...
"%NSSM_PATH%" stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 5 /nobreak >nul
echo [OK] Servico parado

echo.
echo [INFO] Atualizando arquivos...

REM Atualizar servidor unificado e migração
copy "server-producao.js" "%PROD_DIR%\server-producao.js" >nul
copy "package-producao.json" "%PROD_DIR%\package.json" >nul
copy "run-migration.js" "%PROD_DIR%\run-migration.js" >nul
echo [OK] Servidor unificado atualizado

REM Atualizar frontend (dist) - SEM ALTERACOES!
rmdir /s /q "%PROD_DIR%\dist" 2>nul
xcopy "dist" "%PROD_DIR%\dist" /E /I /H /Y >nul
echo [OK] Frontend atualizado (URLs originais mantidas)

REM Atualizar módulos e scripts
rmdir /s /q "%PROD_DIR%\server" 2>nul
rmdir /s /q "%PROD_DIR%\scripts" 2>nul
xcopy "server" "%PROD_DIR%\server" /E /I /H /Y >nul
xcopy "scripts" "%PROD_DIR%\scripts" /E /I /H /Y >nul
echo [OK] Modulos e scripts atualizados

echo.
echo [INFO] Verificando dependencias...
cd /d "%PROD_DIR%"
call npm install --production

if %errorlevel% neq 0 (
    echo [ERRO] Erro ao instalar dependencias
    goto RESTORE_BACKUP
)

echo [OK] Dependencias OK

echo.
echo [INFO] Executando ajustes de estrutura do banco...
node run-migration.js
if %errorlevel% neq 0 (
    echo [ERRO] Erro nos ajustes do banco
    goto RESTORE_BACKUP
)
echo [OK] Estrutura do banco ajustada

echo.
echo [INFO] Reiniciando servico...

"%NSSM_PATH%" start "%SERVICE_NAME%" >nul 2>&1
echo [INFO] Aguardando inicializacao...
timeout /t 10 /nobreak >nul

echo.
echo [INFO] Testando aplicacao atualizada...

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 15; Write-Host '[OK] API funcionando:', $response.StatusCode } catch { Write-Host '[ERRO] API falhou'; exit 1 }"
if %errorlevel% neq 0 goto RESTORE_BACKUP

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 15; Write-Host '[OK] Frontend funcionando:', $response.StatusCode } catch { Write-Host '[ERRO] Frontend falhou'; exit 1 }"
if %errorlevel% neq 0 goto RESTORE_BACKUP

echo.
echo ======================================================
echo [SUCESSO] ATUALIZACAO CONCLUIDA!
echo ======================================================
echo.
echo Backup mantido em: %BACKUP_FOLDER%
echo Aplicacao: http://localhost:3000
echo.
echo O QUE FOI ATUALIZADO:
echo   [+] Servidor unificado (server-producao.js)
echo   [+] Frontend (dist/) - URLs corrigidas
echo   [+] Modulos e scripts
echo   [+] Dependencias
echo   [+] Estrutura do banco (coluna plan removida)
echo.
echo VANTAGEM: Servidor unico - mais simples e estavel!
echo URLs corrigidas para porta 3000!
echo Estrutura corrigida: subscriptions usa apenas plan_id
echo.
goto END

:RESTORE_BACKUP
echo.
echo [ERRO] Problemas detectados - RESTAURANDO BACKUP...
"%NSSM_PATH%" stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 5 /nobreak >nul

rmdir /s /q "%PROD_DIR%" 2>nul
xcopy "%BACKUP_FOLDER%" "%PROD_DIR%" /E /I /H /Y >nul

"%NSSM_PATH%" start "%SERVICE_NAME%" >nul 2>&1
timeout /t 10 /nobreak >nul

echo [OK] BACKUP RESTAURADO - Aplicacao voltou para versao anterior
echo Verifique os erros antes de tentar novamente

:END
pause
