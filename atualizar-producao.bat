@echo off
echo ======================================================
echo 🔄 ATUALIZAÇÃO PRODUÇÃO - GYM PULSE SYSTEM
echo ======================================================

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como Administrador
) else (
    echo ❌ ERRO: Execute como Administrador!
    echo Clique com o botão direito e "Executar como administrador"
    pause
    exit /b 1
)

set PROD_DIR=C:\gym-pulse-production
set SERVICE_NAME=GymPulseSystem
set BACKUP_DIR=C:\gym-pulse-backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo.
echo 📋 Verificações pré-atualização...

REM Verificar se o projeto atual tem build atualizado
if not exist "dist\index.html" (
    echo ❌ ERRO: Pasta 'dist' não encontrada!
    echo Execute 'npm run build' primeiro no projeto atual
    pause
    exit /b 1
)

REM Verificar se o diretório de produção existe
if not exist "%PROD_DIR%" (
    echo ❌ ERRO: Diretório de produção não encontrado!
    echo Execute primeiro 'setup-producao.bat'
    pause
    exit /b 1
)

echo ✅ Verificações iniciais OK

echo.
echo 💾 Criando backup da versão atual...

REM Criar diretório de backup
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set BACKUP_FOLDER=%BACKUP_DIR%\backup_%TIMESTAMP%
mkdir "%BACKUP_FOLDER%"

REM Fazer backup da versão atual
xcopy "%PROD_DIR%" "%BACKUP_FOLDER%" /E /I /H /Y >nul
if %errorlevel% == 0 (
    echo ✅ Backup criado: %BACKUP_FOLDER%
) else (
    echo ❌ Erro ao criar backup
    pause
    exit /b 1
)

echo.
echo ⏹️ Parando serviço atual...
sc stop "%SERVICE_NAME%" >nul 2>&1
echo ⏳ Aguardando serviço parar...
timeout /t 5 /nobreak >nul

echo.
echo 🔄 Atualizando arquivos...

REM Atualizar servidor principal
copy "server-producao-unificado.js" "%PROD_DIR%\server-producao-unificado.js" >nul
echo ✅ Servidor atualizado

REM Atualizar package.json se necessário
copy "package-producao-unificado.json" "%PROD_DIR%\package.json" >nul
echo ✅ package.json atualizado

REM Atualizar frontend (dist)
rmdir /s /q "%PROD_DIR%\dist" 2>nul
xcopy "dist" "%PROD_DIR%\dist" /E /I /H /Y >nul
echo ✅ Frontend atualizado

REM Atualizar módulos do servidor
rmdir /s /q "%PROD_DIR%\server" 2>nul
xcopy "server" "%PROD_DIR%\server" /E /I /H /Y >nul
echo ✅ Módulos do servidor atualizados

REM Atualizar scripts do banco
rmdir /s /q "%PROD_DIR%\scripts" 2>nul
xcopy "scripts" "%PROD_DIR%\scripts" /E /I /H /Y >nul
echo ✅ Scripts do banco atualizados

echo.
echo 📦 Verificando dependências...
cd /d "%PROD_DIR%"

REM Verificar se há novas dependências
call npm install --production
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    echo 🔄 Restaurando backup...
    goto RESTORE_BACKUP
)

echo ✅ Dependências atualizadas

echo.
echo ▶️ Iniciando serviço atualizado...
sc start "%SERVICE_NAME%" >nul 2>&1
echo ⏳ Aguardando serviço inicializar...
timeout /t 10 /nobreak >nul

echo.
echo 🧪 Testando aplicação atualizada...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 15; if ($response.StatusCode -eq 200) { Write-Host '✅ API respondendo corretamente'; $content = $response.Content | ConvertFrom-Json; Write-Host '📊 Status:', $content.status } else { Write-Host '❌ API com problemas:', $response.StatusCode; exit 1 } } catch { Write-Host '❌ Erro ao conectar com API:', $_.Exception.Message; exit 1 }"

if %errorlevel% neq 0 (
    echo ❌ Teste da API falhou
    goto RESTORE_BACKUP
)

echo.
echo 🌐 Testando frontend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 15; if ($response.StatusCode -eq 200 -and $response.Content -like '*<!DOCTYPE html>*') { Write-Host '✅ Frontend funcionando corretamente' } else { Write-Host '❌ Frontend com problemas'; exit 1 } } catch { Write-Host '❌ Erro no frontend:', $_.Exception.Message; exit 1 }"

if %errorlevel% neq 0 (
    echo ❌ Teste do frontend falhou
    goto RESTORE_BACKUP
)

echo.
echo ✅ ======================================================
echo 🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!
echo ======================================================
echo.
echo 💾 Backup mantido em: %BACKUP_FOLDER%
echo 🌐 Aplicação: http://localhost:3000
echo 📊 API: http://localhost:3000/api/health
echo.
echo 📋 O que foi atualizado:
echo    ✅ Servidor Node.js
echo    ✅ Frontend React
echo    ✅ Módulos de servidor
echo    ✅ Scripts de banco
echo    ✅ Dependências
echo.
goto END

:RESTORE_BACKUP
echo.
echo 🚨 ERRO DETECTADO - RESTAURANDO BACKUP...
echo.
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 /nobreak >nul

echo 🔄 Restaurando versão anterior...
rmdir /s /q "%PROD_DIR%" 2>nul
xcopy "%BACKUP_FOLDER%" "%PROD_DIR%" /E /I /H /Y >nul

echo ▶️ Reiniciando serviço com versão anterior...
sc start "%SERVICE_NAME%" >nul 2>&1
timeout /t 5 /nobreak >nul

echo.
echo ✅ BACKUP RESTAURADO COM SUCESSO
echo ⚠️ A aplicação voltou para a versão anterior
echo 🔍 Verifique os erros antes de tentar atualizar novamente
echo.

:END
pause
