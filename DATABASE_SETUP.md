# Configuração do Banco de Dados PostgreSQL Local

Este projeto foi configurado para usar um banco de dados PostgreSQL local chamado `GYMPULSE_BD` através de uma API backend Express.js.

## Arquitetura

- **Frontend:** React + Vite (porta 5173)
- **Backend:** Express.js + PostgreSQL (porta 3001)
- **Banco:** PostgreSQL local (porta 5432)

## Pré-requisitos

1. **PostgreSQL instalado** - Certifique-se de ter o PostgreSQL instalado em sua máquina
2. **Banco de dados criado** - Crie um banco de dados chamado `GYMPULSE_BD`

## Configuração do Banco de Dados

### 1. Criar o banco de dados

Conecte-se ao PostgreSQL e execute:

```sql
CREATE DATABASE "GYMPULSE_BD";
```

### 2. Executar o script de configuração

Execute o arquivo `database-setup.sql` no banco de dados usando pgAdmin, DBeaver ou qualquer cliente PostgreSQL.

Ou se tiver o psql no PATH:

```bash
psql -U postgres -d GYMPULSE_BD -f database-setup.sql
```

### 3. Configurações de conexão

O servidor backend está configurado para usar as seguintes configurações de conexão:

- **Host:** localhost
- **Port:** 5432
- **Database:** GYMPULSE_BD
- **Username:** postgres
- **Password:** postgres

Se suas configurações forem diferentes, edite o arquivo `server/index.js`.

## Como executar

### Opção 1: Executar tudo junto (Recomendado)

```bash
npm run dev:full
```

Este comando inicia tanto o servidor backend quanto o frontend simultaneamente.

### Opção 2: Executar separadamente

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Verificação

Para verificar se tudo foi configurado corretamente:

1. Execute `npm run dev:full`
2. Verifique se o backend conectou ao banco:
   ```
   ✅ Connected to PostgreSQL database successfully
   🚀 Server running on http://localhost:3001
   ```
3. Acesse `http://localhost:5173` para ver o frontend
4. Teste as funcionalidades de cadastro de clientes, planos, etc.

## API Endpoints

O servidor backend expõe os seguintes endpoints:

- `GET /api/health` - Status do servidor
- `GET /api/:table` - Listar registros de uma tabela
- `GET /api/:table/:id` - Buscar registro por ID
- `POST /api/:table` - Criar novo registro
- `PUT /api/:table/:id` - Atualizar registro
- `DELETE /api/:table/:id` - Deletar registro
- `POST /api/rpc/:functionName` - Executar função/procedimento

## Estrutura das Tabelas

O script criará as seguintes tabelas:

- **clients** - Clientes da academia
- **plans** - Planos de assinatura
- **users** - Usuários do sistema
- **subscriptions** - Matrículas/assinaturas
- **payments** - Pagamentos

## Dados de exemplo

O script também insere alguns dados de exemplo:

- 3 planos básicos (Básico, Premium, Anual)
- 2 usuários do sistema (Administrador e Recepcionista)

## Troubleshooting

### Erro de conexão com o banco

Se o servidor backend não conseguir conectar:

1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais em `server/index.js`
3. Verifique se o banco `GYMPULSE_BD` existe
4. Teste a conexão com um cliente PostgreSQL

### Erro de CORS

Se você receber erros de CORS no frontend:

1. Verifique se o servidor backend está rodando na porta 3001
2. Confirme que o CORS está habilitado no servidor

### Frontend não consegue conectar com backend

1. Verifique se ambos os serviços estão rodando
2. Confirme que a URL da API está correta: `http://localhost:3001/api`
3. Teste a API diretamente: `http://localhost:3001/api/health`

## Migração do Supabase

Este projeto foi migrado do Supabase para PostgreSQL local. As principais mudanças:

1. **Substituição do cliente Supabase** por um servidor Express.js
2. **Criação de uma API REST** que mantém a mesma interface do Supabase
3. **Implementação de queries SQL nativas** no backend
4. **Mock das funcionalidades de autenticação** para desenvolvimento local
5. **Sistema de conexão HTTP** entre frontend e backend

O frontend continua usando a mesma API do Supabase, mas agora as chamadas são redirecionadas para o servidor local via HTTP. 