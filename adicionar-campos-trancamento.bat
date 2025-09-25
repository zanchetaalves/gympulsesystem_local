@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔒 ADICIONANDO CAMPOS DE TRANCAMENTO
echo ========================================
echo.
echo 📋 Este script adiciona os campos necessários para o
echo    controle de trancamento de matrículas:
echo.
echo    - locked (BOOLEAN) - Indica se está trancada
echo    - lock_days (INTEGER) - Dias de trancamento
echo.
echo ⚠️  IMPORTANTE: Certifique-se de que:
echo    ✅ PostgreSQL está rodando
echo    ✅ Banco GYMPULSE_BD existe
echo    ✅ Credenciais estão corretas
echo.
pause

echo.
echo 🔄 Executando migração...
echo.

npm run add:subscription-lock

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
    echo ========================================
    echo.
    echo 🎯 Próximos passos:
    echo    1. Reinicie o backend se estiver rodando
    echo    2. Acesse a tela de editar matrícula
    echo    3. Teste o checkbox "Trancar"
    echo    4. Teste o campo de quantidade de dias
    echo.
    echo 💡 Os novos campos foram adicionados:
    echo    - subscriptions.locked (BOOLEAN DEFAULT false)
    echo    - subscriptions.lock_days (INTEGER NULL)
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ ERRO NA MIGRAÇÃO
    echo ========================================
    echo.
    echo 🔧 Possíveis soluções:
    echo    1. Verificar se PostgreSQL está rodando
    echo    2. Verificar credenciais do banco
    echo    3. Executar manualmente: npm run add:subscription-lock
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
