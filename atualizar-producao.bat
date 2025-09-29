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
set BACKEND_SERVICE=GymPulseBackend
set PROXY_SERVICE=GymPulseProxy
set BACKUP_DIR=C:\gym-pulse-backups
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
echo [INFO] Parando servicos...
sc stop "%PROXY_SERVICE%" >nul 2>&1
timeout /t 3 /nobreak >nul
sc stop "%BACKEND_SERVICE%" >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo [INFO] Atualizando arquivos...

REM Atualizar servidores
copy "server-producao-unificado.js" "%PROD_DIR%\server-backend.js" >nul
copy "server-producao-com-proxy.js" "%PROD_DIR%\server-proxy.js" >nul
echo [OK] Servidores atualizados

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
echo [INFO] Reiniciando servicos...

sc start "%BACKEND_SERVICE%" >nul 2>&1
echo [INFO] Aguardando Backend...
timeout /t 8 /nobreak >nul

sc start "%PROXY_SERVICE%" >nul 2>&1
echo [INFO] Aguardando Proxy...
timeout /t 8 /nobreak >nul

echo.
echo [INFO] Testando aplicacao atualizada...

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 15; Write-Host '[OK] Backend funcionando:', $response.StatusCode } catch { Write-Host '[ERRO] Backend falhou'; exit 1 }"
if %errorlevel% neq 0 goto RESTORE_BACKUP

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 15; Write-Host '[OK] Proxy funcionando:', $response.StatusCode } catch { Write-Host '[ERRO] Proxy falhou'; exit 1 }"
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
echo   [+] Backend (server-backend.js)
echo   [+] Proxy (server-proxy.js)  
echo   [+] Frontend (dist/) - URLs originais mantidas
echo   [+] Modulos e scripts
echo   [+] Dependencias
echo.
echo VANTAGEM: Frontend NUNCA precisa ser alterado!
echo Proxy resolve URLs automaticamente!
echo.
goto END

:RESTORE_BACKUP
echo.
echo [ERRO] Problemas detectados - RESTAURANDO BACKUP...
sc stop "%PROXY_SERVICE%" >nul 2>&1
sc stop "%BACKEND_SERVICE%" >nul 2>&1
timeout /t 3 /nobreak >nul

rmdir /s /q "%PROD_DIR%" 2>nul
xcopy "%BACKUP_FOLDER%" "%PROD_DIR%" /E /I /H /Y >nul

sc start "%BACKEND_SERVICE%" >nul 2>&1
timeout /t 5 /nobreak >nul
sc start "%PROXY_SERVICE%" >nul 2>&1

echo [OK] BACKUP RESTAURADO - Aplicacao voltou para versao anterior
echo Verifique os erros antes de tentar novamente

:END
pause
