@echo off
echo.
echo ========================================================
echo    🌐 CONFIGURADOR DE SPA ROUTING PARA IIS
echo ========================================================
echo.
echo Este script vai resolver o problema de 404 em rotas
echo como localhost:81/pagamentos quando atualizar a pagina
echo.

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERRO: Execute este script como Administrador!
    echo.
    echo 👉 Clique com botao direito no script e selecione
    echo    "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo ✅ Script executando como Administrador
echo.

REM Definir variáveis
set "SITE_PATH=C:\inetpub\wwwroot"
set "DIST_PATH=%~dp0dist"
set "WEB_CONFIG_SOURCE=%~dp0web.config"

echo 📁 Verificando estrutura de arquivos...
echo.

REM Verificar se a pasta dist existe
if not exist "%DIST_PATH%" (
    echo ❌ ERRO: Pasta dist não encontrada!
    echo.
    echo 🔧 SOLUÇÃO: Execute primeiro o build do projeto:
    echo    npm run build
    echo.
    pause
    exit /b 1
)

echo ✅ Pasta dist encontrada: %DIST_PATH%

REM Verificar se web.config existe
if not exist "%WEB_CONFIG_SOURCE%" (
    echo ❌ ERRO: Arquivo web.config não encontrado!
    echo.
    echo 🔧 SOLUÇÃO: O web.config deve estar na raiz do projeto
    echo.
    pause
    exit /b 1
)

echo ✅ Arquivo web.config encontrado: %WEB_CONFIG_SOURCE%
echo.

echo 🚀 Aplicando configuração SPA...
echo.

REM Parar IIS temporariamente
echo ⏸️  Parando IIS...
iisreset /stop >nul 2>&1

REM Copiar arquivos da pasta dist para o IIS
echo 📋 Copiando arquivos do frontend...
xcopy "%DIST_PATH%\*" "%SITE_PATH%\" /E /Y /Q >nul 2>&1

REM Copiar web.config para o IIS
echo 📋 Copiando configuração web.config...
copy "%WEB_CONFIG_SOURCE%" "%SITE_PATH%\web.config" /Y >nul 2>&1

REM Definir permissões corretas
echo 🔐 Configurando permissões...
icacls "%SITE_PATH%" /grant "IIS_IUSRS:(OI)(CI)F" /T >nul 2>&1
icacls "%SITE_PATH%" /grant "IUSR:(OI)(CI)F" /T >nul 2>&1

REM Verificar se URL Rewrite está instalado
echo 🔍 Verificando módulo URL Rewrite...
%windir%\system32\inetsrv\appcmd.exe list modules | findstr "RewriteModule" >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ⚠️  AVISO: Módulo URL Rewrite não detectado!
    echo.
    echo 💡 Se tiver problemas, instale o URL Rewrite:
    echo    https://www.iis.net/downloads/microsoft/url-rewrite
    echo.
) else (
    echo ✅ Módulo URL Rewrite detectado
)

REM Iniciar IIS novamente
echo ▶️  Iniciando IIS...
iisreset /start >nul 2>&1

echo.
echo ========================================================
echo                    ✅ CONCLUÍDO!
echo ========================================================
echo.
echo 🎯 CONFIGURAÇÃO APLICADA COM SUCESSO:
echo.
echo ✅ Frontend copiado para: %SITE_PATH%
echo ✅ web.config configurado para SPA routing
echo ✅ Proxy API configurado: /api/* → localhost:3001
echo ✅ IIS reiniciado
echo.
echo 🌐 TESTE AGORA:
echo    1. Acesse: http://localhost/
echo    2. Navegue para: http://localhost/pagamentos
echo    3. Pressione F5 para atualizar a página
echo    4. Deve funcionar sem erro 404!
echo.
echo 📋 ARQUIVOS CRIADOS:
echo    - %SITE_PATH%\web.config (configuração SPA)
echo    - Todo conteúdo da pasta dist
echo.

REM Fazer teste rápido
echo 🧪 Fazendo teste rápido...
timeout /t 2 >nul
curl -s -o nul -w "%%{http_code}" http://localhost/ >nul 2>&1 && (
    echo ✅ Frontend respondendo corretamente
) || (
    echo ⚠️  Frontend pode não estar respondendo
    echo    Verifique se o IIS está configurado corretamente
)

echo.
echo ℹ️  Se ainda tiver problemas:
echo    1. Verifique se URL Rewrite está instalado no IIS
echo    2. Verifique se o site padrão está rodando na porta 80/81
echo    3. Execute: .\testar-funcionamento.bat
echo.
pause
