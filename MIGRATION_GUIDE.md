# 🔄 Guia de Migração - Tabela de Clientes

Este guia explica como atualizar a estrutura da tabela de clientes para permitir valores nulos em campos opcionais.

## 📋 Mudanças Realizadas

### **Campos que agora permitem NULL:**
- ✅ `cpf` - CPF do cliente (opcional)
- ✅ `email` - Email do cliente (opcional) 
- ✅ `address` - Endereço do cliente (opcional)
- ✅ `birth_date` - Data de nascimento (opcional)
- ✅ `photo_url` - URL da foto (opcional)

### **Campos que continuam obrigatórios:**
- 🔒 `name` - Nome do cliente (obrigatório)
- 🔒 `phone` - Telefone do cliente (obrigatório)

## 🚀 Como Aplicar no Servidor

### **Opção 1: Comando Automático (Recomendado)**

Execute o comando setup que agora inclui migração automática:

```bash
npm run setup:db
```

Este comando irá:
1. ✅ Verificar se a migração é necessária
2. ✅ Aplicar automaticamente se a estrutura estiver desatualizada
3. ✅ Manter dados existentes

### **Opção 2: Migração Manual**

Se preferir executar apenas a migração:

```bash
npm run migrate:clients
```

### **Opção 3: SQL Direto**

Execute diretamente no banco via pgAdmin/DBeaver:

```sql
-- Arquivo: scripts/migrate-client-nullable.sql
-- (O conteúdo do arquivo será executado)
```

## 🔍 Verificação

Após a migração, você pode verificar a estrutura:

```sql
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
column_name  | is_nullable | data_type
-------------|-------------|----------
id           | NO          | uuid
name         | NO          | text
cpf          | YES         | text
email        | YES         | text
phone        | NO          | text
address      | YES         | text
birth_date   | YES         | date
photo_url    | YES         | text
created_at   | NO          | timestamp
```

## 🧪 Teste

Teste inserindo um cliente apenas com nome e telefone:

```sql
INSERT INTO clients (name, phone) 
VALUES ('Cliente Teste', '11999999999');
```

Deve funcionar sem erro!

## ⚠️ Importante

- ✅ **Dados existentes**: Todos os dados atuais serão preservados
- ✅ **Rollback**: Caso necessário, é possível reverter as mudanças
- ✅ **Performance**: Índices foram atualizados adequadamente
- ✅ **Unicidade**: CPF continua único quando preenchido

## 🔧 Troubleshooting

### Erro: "column does not exist"
- Execute `npm run setup:db` primeiro

### Erro: "permission denied" 
- Execute como usuário com privilégios de ALTER TABLE

### Erro de conexão
- Verifique se PostgreSQL está rodando
- Confirme as credenciais no script

## 📁 Arquivos Modificados

- ✅ `database-setup.sql` - Estrutura base atualizada
- ✅ `scripts/migrate-client-nullable.sql` - Script de migração
- ✅ `scripts/migrate-client-table.js` - Migração via Node.js
- ✅ `scripts/setup-database.js` - Setup com migração automática
- ✅ `package.json` - Novo comando `migrate:clients`

Agora a aplicação suporta cadastro de clientes apenas com **nome e telefone**! 🎉


