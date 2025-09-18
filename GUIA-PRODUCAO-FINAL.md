# 🚀 GUIA DEFINITIVO - CONFIGURAÇÃO EM PRODUÇÃO COM NODE.JS

## ✅ Status Atual
- ✅ NSSM descartado (problemas de compatibilidade)
- ✅ Frontend funcionando no IIS (pasta dist)
- ✅ **MÉTODO ESCOLHIDO:** Node.js com Windows Service

---

## 📋 SCRIPTS DISPONÍVEIS (LIMPOS)

### 🎯 **Scripts Principais:**
1. **`setup-backend-producao.bat`** → Preparar arquivos do backend
2. **`configurar-servico-node-v2.bat`** → Configurar serviço Node.js
3. **`testar-funcionamento.bat`** → Testar se tudo funciona
4. **`configurar-proxy-iis.bat`** → Conectar frontend ↔ backend
5. **`configurar-spa-routing.bat`** → Resolver erro 404 ao atualizar páginas

### 🗑️ **Scripts Removidos:**
- ❌ Todos os scripts de continuação/correção temporários
- ❌ Arquivos PM2 (ecosystem.config.*) 
- ❌ Scripts específicos para outros servidores
- ❌ Guias de produção incompletos

---

## 🛠️ PASSO A PASSO DEFINITIVO

### **PASSO 1: Preparar Backend**
```batch
# Execute como Administrador
.\setup-backend-producao.bat
```

**O que faz:**
- ✅ Organiza arquivos em `C:\gym-pulse-system\backend\`
- ✅ Instala dependências do Node.js
- ✅ Cria configurações (.env)
- ✅ Testa inicialização

---

### **PASSO 2: Configurar Serviço Node.js**
```batch
# Execute como Administrador
.\configurar-servico-node-v2.bat
```

**O que faz:**
- ✅ Instala `node-windows`
- ✅ Cria scripts `.cjs` (compatível com ES Modules)
- ✅ Registra serviço Windows `GymPulseBackend`
- ✅ Inicia serviço automaticamente
- ✅ **Método alternativo:** Se `node-windows` falhar, usa `sc create`

---

### **PASSO 3: Testar Funcionamento**
```batch
# Execute para verificar
.\testar-funcionamento.bat
```

**O que testa:**
- ✅ Status do serviço Windows
- ✅ Porta 3001 ativa
- ✅ API respondendo (`/api/health`)
- ✅ PostgreSQL funcionando
- ✅ Frontend no IIS

---

### **PASSO 4: Configurar Proxy IIS**
```batch
# Execute como Administrador
.\configurar-proxy-iis.bat
```

**O que configura:**
- ✅ Proxy `/api/*` → `localhost:3001`
- ✅ SPA routing para React
- ✅ CORS headers
- ✅ Reinicia IIS

---

### **PASSO 5: Configurar SPA Routing (NOVO!)**
```batch
# Execute como Administrador
.\configurar-spa-routing.bat
```

**O que resolve:**
- ✅ **Problema 404** ao atualizar páginas (localhost:81/pagamentos)
- ✅ **Fallback para index.html** em rotas SPA
- ✅ **Configuração web.config** automática
- ✅ **Assets estáticos** servidos corretamente
- ✅ **Proxy API** mantido funcionando

**Quando usar:**
- 🔧 Após configurar tudo e ainda ter erro 404 ao atualizar páginas
- 🔧 Quando `localhost:81/pagamentos` + F5 der erro
- 🔧 Para finalizar configuração SPA no IIS

---

## 📂 ESTRUTURA FINAL

```
C:\gym-pulse-system\
├── backend\                    ← Produção organizada
│   ├── index.js               ← Servidor Node.js
│   ├── auth.js                ← Autenticação
│   ├── package.json           ← Dependências
│   ├── node_modules\          ← Bibliotecas
│   ├── .env                   ← Configurações
│   ├── install-service.cjs    ← Instalar serviço
│   ├── uninstall-service.cjs  ← Desinstalar serviço
│   └── start-service.bat      ← Script de backup
├── logs\                       ← Logs centralizados
│   ├── backend.log            ← Saída do servidor
│   └── error.log              ← Erros
├── dist\                       ← Frontend (IIS)
├── server\                     ← Arquivos originais (mantidos)
├── src\                        ← Código fonte (mantido)
└── package.json               ← Projeto original
```

---

## 🎯 COMANDOS DE GERENCIAMENTO

### **Serviço Windows:**
```batch
sc query GymPulseBackend        # Ver status
sc start GymPulseBackend        # Iniciar
sc stop GymPulseBackend         # Parar
sc delete GymPulseBackend       # Remover serviço
```

### **Node-Windows (se disponível):**
```batch
node install-service.cjs       # Instalar
node uninstall-service.cjs     # Desinstalar
```

### **Logs e Debug:**
```batch
type C:\gym-pulse-system\logs\backend.log    # Ver logs
type C:\gym-pulse-system\logs\error.log      # Ver erros
netstat -an | findstr :3001                  # Verificar porta
```

---

## 🌐 ACESSOS FINAIS

- **Frontend:** `http://localhost/`
- **Backend:** `http://localhost:3001/api/health`
- **API via Proxy:** `http://localhost/api/health`

---

## 📱 TESTE COMPLETO

1. **Abra:** `http://localhost/`
2. **Faça login** na aplicação
3. **Navegue** para `http://localhost/pagamentos`
4. **Pressione F5** → Não deve dar erro 404!
5. **Teste** outras rotas: `/clientes`, `/planos`, etc.
6. **Verifique** operações (criar, editar, deletar)

---

## ⚡ SEQUÊNCIA DE EXECUÇÃO

```batch
# 1. Preparar backend
.\setup-backend-producao.bat

# 2. Configurar serviço Node.js
.\configurar-servico-node-v2.bat

# 3. Testar funcionamento
.\testar-funcionamento.bat

# 4. Configurar proxy IIS
.\configurar-proxy-iis.bat

# 5. Configurar SPA routing (NOVO!)
.\configurar-spa-routing.bat

# 6. Teste final completo
# Acesse http://localhost/ no navegador
# Teste: localhost/pagamentos + F5 (não deve dar 404)
```

---

## 🎉 VANTAGENS DO MÉTODO NODE.JS

- ✅ **Sem dependências externas** (NSSM)
- ✅ **Compatível com ES Modules**
- ✅ **Integração nativa** com Node.js
- ✅ **Gerenciamento padrão** Windows (sc)
- ✅ **Logs automáticos**
- ✅ **Restart automático** em caso de erro
- ✅ **Método alternativo** se node-windows falhar

---

**🚀 EXECUTE AGORA A SEQUÊNCIA ACIMA E SUA APLICAÇÃO ESTARÁ EM PRODUÇÃO!**
