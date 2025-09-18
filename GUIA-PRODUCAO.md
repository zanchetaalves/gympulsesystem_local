# 🎯 GUIA COMPLETO - CONFIGURAÇÃO EM PRODUÇÃO

## ✅ Status Atual
- ✅ NSSM instalado e funcionando
- ✅ Frontend funcionando no IIS (pasta dist)
- 🔄 **PRÓXIMO:** Configurar backend como serviço

---

## 📋 RESUMO DO QUE VAMOS FAZER

1. **Preparar arquivos do backend** (automatizado)
2. **Configurar variáveis de ambiente** (automatizado)
3. **Criar serviço com NSSM** (automatizado)
4. **Testar funcionamento** (manual)
5. **Configurar proxy no IIS** (manual)

---

## 🛠️ PASSO 1: PREPARAR O BACKEND

### O que vamos fazer:
- Copiar arquivos do projeto para pasta de produção
- Instalar dependências Node.js
- Criar arquivo de configuração

### Como executar:
```batch
# Execute este script que eu vou criar:
.\setup-backend-producao.bat
```

---

## 🔧 PASSO 2: CONFIGURAR SERVIÇO

### O que vamos fazer:
- Criar serviço Windows com NSSM
- Configurar logs e reinicialização automática
- Definir usuário de execução

### Como executar:
```batch
# Execute este script que eu vou criar:
.\configurar-servico-nssm.bat
```

---

## 🧪 PASSO 3: TESTAR FUNCIONAMENTO

### Testes que faremos:
1. Verificar se serviço está rodando
2. Testar API backend diretamente
3. Verificar logs de erro
4. Testar comunicação frontend → backend

---

## 🌐 PASSO 4: CONFIGURAR PROXY IIS

### O que vamos fazer:
- Configurar IIS para redirecionar `/api/*` para o backend
- Permitir comunicação entre frontend e backend
- Configurar CORS se necessário

---

## 📂 ESTRUTURA FINAL ESPERADA

```
C:\gym-pulse-production\
├── backend\
│   ├── index.js              ← Servidor principal
│   ├── auth.js              ← Autenticação
│   ├── package.json         ← Dependências
│   ├── node_modules\        ← Bibliotecas instaladas
│   ├── .env                 ← Configurações
│   └── start.bat           ← Script de inicialização
├── frontend\               ← Já configurado no IIS
│   ├── index.html
│   └── assets\
└── logs\
    ├── backend.log         ← Logs do serviço
    └── error.log          ← Logs de erro
```

---

## 🎯 PRÓXIMOS COMANDOS

Execute na ordem:

1. `.\setup-backend-producao.bat`
2. `.\configurar-servico-nssm.bat`
3. Seguir instruções de teste
4. Configurar proxy IIS (com minha ajuda)

---

## ❓ AJUDA RÁPIDA

- **Ver status do serviço:** `nssm status GymPulseBackend`
- **Parar serviço:** `nssm stop GymPulseBackend`
- **Iniciar serviço:** `nssm start GymPulseBackend`
- **Ver logs:** Arquivo em `C:\gym-pulse-production\logs\`
