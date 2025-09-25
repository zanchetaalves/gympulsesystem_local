# 🔒 Migração: Campos de Trancamento de Matrículas

## 📋 Resumo

Esta migração adiciona os campos necessários para implementar o controle de trancamento de matrículas na tabela `subscriptions`.

### **Campos Adicionados:**
- `locked` (BOOLEAN) - Indica se a matrícula está trancada
- `lock_days` (INTEGER) - Quantidade de dias de trancamento

## 🚀 Como Executar

### **Método 1: Script Automatizado (Recomendado)**
```bash
# Windows
.\adicionar-campos-trancamento.bat

# Linux/Mac
chmod +x adicionar-campos-trancamento.sh
./adicionar-campos-trancamento.sh
```

### **Método 2: Comando NPM**
```bash
npm run add:subscription-lock
```

### **Método 3: SQL Direto**
```bash
# Execute o arquivo SQL no PostgreSQL
psql -U postgres -d GYMPULSE_BD -f scripts/add-subscription-lock-fields.sql
```

## 📊 Alterações no Banco

### **Estrutura Antes:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  plan TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Estrutura Depois:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  plan TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,        -- NOVO ✅
  lock_days INTEGER NULL,              -- NOVO ✅
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🔧 Detalhes Técnicos

### **Campo `locked`:**
- **Tipo:** BOOLEAN
- **Padrão:** false
- **Nullable:** NO
- **Descrição:** Indica se a matrícula está temporariamente trancada

### **Campo `lock_days`:**
- **Tipo:** INTEGER
- **Padrão:** NULL
- **Nullable:** YES
- **Descrição:** Quantidade de dias a ser adicionada na data de término

### **Índices Criados:**
```sql
CREATE INDEX idx_subscriptions_locked ON subscriptions(locked) WHERE locked = true;
```

## 📈 Compatibilidade

### **Registros Existentes:**
- ✅ **Preservados:** Todos os dados existentes são mantidos
- ✅ **Valores padrão:** `locked = false` para todas matrículas existentes
- ✅ **Limpeza:** `lock_days = NULL` onde `locked = false`

### **Aplicação Frontend:**
- ✅ **Tipos atualizados:** Interface `Subscription` já inclui os novos campos
- ✅ **Formulários:** Tela de edição já implementada com os controles
- ✅ **Validação:** Schema Zod já configurado
- ✅ **API:** Hooks `useSubscriptions` já atualizados

## ✅ Verificação Pós-Migração

### **1. Verificar Estrutura:**
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### **2. Verificar Dados:**
```sql
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN locked = true THEN 1 END) as locked_count,
    COUNT(CASE WHEN lock_days IS NOT NULL THEN 1 END) as with_lock_days
FROM subscriptions;
```

### **3. Testar Funcionalidade:**
1. ✅ Acesse "Editar Matrícula"
2. ✅ Marque checkbox "Trancar"
3. ✅ Informe quantidade de dias
4. ✅ Veja data de término atualizada
5. ✅ Salve e verifique no banco

## 🛡️ Segurança e Rollback

### **Backup Recomendado:**
```bash
# Fazer backup antes da migração
pg_dump -U postgres -d GYMPULSE_BD -t subscriptions > backup_subscriptions.sql
```

### **Rollback (se necessário):**
```sql
-- Remover campos adicionados
ALTER TABLE subscriptions DROP COLUMN IF EXISTS locked;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS lock_days;

-- Remover índice
DROP INDEX IF EXISTS idx_subscriptions_locked;
```

## 📋 Checklist de Execução

### **Pré-requisitos:**
- [ ] PostgreSQL rodando
- [ ] Banco `GYMPULSE_BD` existe
- [ ] Credenciais corretas configuradas
- [ ] Backup realizado (recomendado)

### **Execução:**
- [ ] Script executado sem erros
- [ ] Campos `locked` e `lock_days` criados
- [ ] Índice `idx_subscriptions_locked` criado
- [ ] Registros existentes atualizados

### **Testes:**
- [ ] Frontend carrega sem erros
- [ ] Tela de edição exibe checkbox "Trancar"
- [ ] Campo de dias aparece quando marcado
- [ ] Data de término calcula corretamente
- [ ] Dados salvam no banco corretamente

## 🎯 Resultado Final

Após a migração, você terá:

1. ✅ **Campos no banco** para armazenar dados de trancamento
2. ✅ **Interface funcional** para controlar trancamento
3. ✅ **Cálculo automático** de datas com dias adicionais
4. ✅ **Compatibilidade total** com dados existentes
5. ✅ **Performance otimizada** com índices apropriados

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique logs** do script de migração
2. **Confirme conexão** com PostgreSQL
3. **Execute verificações** SQL manualmente
4. **Consulte documentação** em `SubscriptionLock.test.md`

---

**A funcionalidade de trancamento estará completa após esta migração!** 🔒✅
