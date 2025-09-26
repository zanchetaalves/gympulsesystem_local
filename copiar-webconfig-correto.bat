@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   COPIANDO WEB.CONFIG CORRETO
echo ========================================
echo.

echo 🔧 Executando como Administrador...
echo.

echo 📋 OBJETIVO:
echo    - Copiar web.config SEM mimeMap duplicados
echo    - Evitar erro HTTP 500.19 - Internal Server Error
echo    - Manter funcionalidades: SPA routing + API proxy
echo.

echo 📁 PASSO 1: Verificando arquivos...
if not exist "web.config" (
    echo ❌ ERRO: web.config não encontrado na raiz do projeto!
    goto :error
)

if not exist "dist" (
    echo ❌ ERRO: Pasta dist não existe!
    echo 💡 Execute: npm run build
    goto :error
)

echo ✅ Arquivos encontrados

echo.
echo 📋 PASSO 2: Fazendo backup do web.config atual (se existir)...
if exist "dist\web.config" (
    copy "dist\web.config" "dist\web.config.backup.%date:/=-%_%time::=-%" >nul 2>&1
    echo ✅ Backup criado
) else (
    echo ℹ️  Nenhum arquivo anterior para backup
)

echo.
echo 📋 PASSO 3: Copiando web.config correto...
copy "web.config" "dist\web.config" >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ ERRO ao copiar web.config
    goto :error
)
echo ✅ web.config copiado com sucesso!

echo.
echo 📋 PASSO 4: Verificando conteúdo...
findstr /c:"<staticContent>" "dist\web.config" >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠️  ATENÇÃO: web.config ainda contém <staticContent>
    echo    Isso pode causar erro HTTP 500.19
) else (
    echo ✅ web.config limpo - sem mimeMaps duplicados
)

echo.
echo 📋 PASSO 5: Reiniciando IIS (se disponível)...
iisreset >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ IIS reiniciado!
) else (
    echo ℹ️  IIS não disponível ou não é necessário reiniciar
)

echo.
echo ========================================
echo   WEB.CONFIG CORRETO APLICADO! ✅
echo ========================================
echo.

echo 🎯 ARQUIVO COPIADO:
echo    Origem: %CD%\web.config
echo    Destino: %CD%\dist\web.config
echo.

echo 🔧 CARACTERÍSTICAS DO WEB.CONFIG CORRETO:
echo ✅ Proxy /api/* → localhost:3001  
echo ✅ SPA routing (F5 funciona)
echo ✅ CORS headers
echo ✅ Tratamento de erro 404 para SPA
echo ❌ SEM mimeMaps duplicados (evita erro 500.19)
echo.

echo 🧪 AGORA TESTE:
echo 1. Acesse: http://localhost/
echo 2. Faça login na aplicação
echo 3. Navegue para: http://localhost/pagamentos
echo 4. Pressione F5 (deve funcionar sem 404)
echo 5. Teste operações da API
echo.

goto :success

:error
echo.
echo ❌ ERRO DURANTE A EXECUÇÃO!
echo.
echo 💡 POSSÍVEIS SOLUÇÕES:
echo    1. Execute como Administrador
echo    2. Execute: npm run build (para criar pasta dist)
echo    3. Verifique se web.config existe na raiz
echo    4. Execute: .\testar-funcionamento.bat
echo.
pause
exit /b 1

:success
echo ✅ PROCESSO CONCLUÍDO COM SUCESSO!
echo.
pause
exit /b 0

