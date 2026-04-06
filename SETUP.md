# Organização Fácil — Guia de Setup

Documentação técnica para configurar, desenvolver e fazer deploy do projeto.

---

## O que foi implementado

### Camada de banco de dados
- **Prisma 7** como ORM, provider MySQL/MariaDB
- Schema completo com 6 modelos: `User`, `Task`, `Project`, `Note`, `FinanceEntry`, `Category`
- Enums para status, prioridade, tipo de finança e escopo
- Índices estratégicos para performance
- `DECIMAL(12,2)` para valores monetários (sem float)

### Autenticação
- **Route Handler** `POST /api/auth/register` — cadastro com validação Zod, hash bcrypt, e-mail único
- **Route Handler** `POST /api/auth/login` — login seguro, resistente a timing attack
- **Route Handler** `POST /api/auth/logout` — encerra sessão
- **Route Handler** `GET /api/auth/me` — retorna usuário autenticado
- **Sessão JWT** em cookie `httpOnly` via `jose` (compatível com Edge Runtime)
- **Middleware** protege `/app` e redireciona auth pages se já logado

### Camada de lib
- `src/lib/db.ts` — singleton Prisma (evita múltiplas instâncias em desenvolvimento)
- `src/lib/auth.ts` — hash/verify senha, criar/ler/deletar sessão
- `src/lib/validations.ts` — schemas Zod reutilizáveis

### Seed de desenvolvimento
- Usuário pré-criado, categorias, projetos, tarefas, notas e finanças

---

## Pré-requisitos

- Node.js >= 18
- MySQL 8+ ou MariaDB 10.5+
- npm

---

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra `.env` e preencha:

```env
DATABASE_URL="mysql://root:sua_senha@localhost:3306/organizacao_facil_dev"
JWT_SECRET="sua-string-aleatoria-longa-aqui"
```

Para gerar um `JWT_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Criar o banco de dados

No MySQL/MariaDB, crie o banco:
```sql
CREATE DATABASE organizacao_facil_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Rodar a migration

```bash
npm run db:migrate
```

Isso cria todas as tabelas e um registro no histórico de migrations.

### 5. Gerar o Prisma Client

O client é gerado automaticamente pelo `db:migrate`, mas se precisar rodar manualmente:

```bash
npm run db:generate
```

### 6. Popular com dados de desenvolvimento (opcional)

```bash
npm run db:seed
```

Cria:
- Usuário: `dev@organizacaofacil.com.br` / Senha: `Dev@12345`
- Categorias, projetos, tarefas, notas e lançamentos financeiros de exemplo

### 7. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em: http://localhost:3000

---

## Estrutura de banco de dados

```
users
  ├── tasks (userId FK)
  ├── projects (userId FK)
  │     └── tasks (projectId FK)
  ├── notes (userId FK)
  ├── categories (userId FK)
  │     ├── tasks (categoryId FK)
  │     └── finance_entries (categoryId FK)
  └── finance_entries (userId FK)
```

**Isolamento por usuário:** Todos os modelos têm `userId` como FK. Toda query de dado deve filtrar por `userId` da sessão.

---

## Fluxo de autenticação

```
1. POST /api/auth/register   → cria usuário → retorna { user }
2. POST /api/auth/login      → valida credenciais → seta cookie httpOnly "of_session"
3. middleware.ts             → verifica cookie em /app/** → redireciona se inválido
4. GET /api/auth/me          → lê sessão → retorna { user }
5. POST /api/auth/logout     → deleta cookie → encerra sessão
```

O cookie `of_session` é:
- `httpOnly` (inacessível ao JavaScript do browser)
- `secure` em produção (apenas HTTPS)
- `sameSite: lax` (proteção CSRF básica)
- Válido por 7 dias

---

## O que ainda está mockado

| Tela/Funcionalidade | Estado |
|---|---|
| Dashboard `/app` — dados | Mockados em componente |
| Tarefas — listagem e CRUD | Mockado |
| Financeiro — listagem e CRUD | Mockado |
| Projetos — listagem e CRUD | Mockado |
| Anotações — listagem e CRUD | Mockado |
| Forgot password — envio de e-mail | Sem envio real (fluxo visual apenas) |
| Recuperação de senha — token | Não implementado |
| Upload de avatar | Não implementado |

---

## Deploy na Hostinger (Node.js compartilhado)

### 1. Criar banco no hPanel

- Acesse hPanel > Databases > MySQL Databases
- Crie um banco, ex: `u123456789_orgfacil`
- Crie um usuário MySQL e associe ao banco com todas as permissões
- Anote: host (geralmente `localhost`), usuário, senha, nome do banco

### 2. Configurar variáveis de ambiente na Hostinger

No hPanel > Node.js > seu app:
- Defina `DATABASE_URL` com as credenciais do passo anterior
- Defina `JWT_SECRET` (uma string aleatória longa)
- Defina `NODE_ENV=production`

### 3. Fazer o deploy

Suba os arquivos via Git ou FTP. **Não suba o `.env`** com credenciais reais.

No terminal da Hostinger (SSH):
```bash
npm install
npm run build       # já roda `prisma generate` internamente
```

### 4. Rodar migrations em produção

```bash
npm run db:migrate:prod
```

> ⚠️ **Importante:** `prisma migrate deploy` (usado em produção) aplica migrations já criadas em desenvolvimento. Nunca use `prisma migrate dev` em produção — ele pode resetar dados.

### 5. Iniciar a aplicação

```bash
npm start
```

A Hostinger gerencia o processo via PM2 automaticamente.

---

## Limitações conhecidas na Hostinger compartilhada

| Limitação | Impacto | Mitigação |
|---|---|---|
| Sem connection pooling externo (PgBouncer, etc.) | Pode esgotar conexões com tráfego alto | `db.$disconnect()` em routes de longa duração; considerar PlanetScale ou Railway para escala |
| MariaDB pode ter pequenas divergências do MySQL | Enums e alguns tipos avançados | Testado: o schema atual é compatível |
| Sem suporte a `prisma migrate dev` em produção | Não rodar migrations interativas em prod | Sempre usar `prisma migrate deploy` |
| Edge Runtime do middleware | jose funciona; Prisma não funciona no Edge | Nunca importar `db` no `middleware.ts` |
| SSH pode ter timeout longo em bcrypt alto | Seed com 12 rounds pode demorar | Normal; apenas na primeira execução |

---

## Próximos passos recomendados

1. **Integrar dashboard com dados reais** — criar `GET /api/dashboard` que retorna tarefas, saldo e projetos do usuário autenticado
2. **CRUD de tarefas** — `GET/POST /api/tasks` e `PATCH/DELETE /api/tasks/[id]`
3. **CRUD de finanças** — mesmo padrão
4. **Recuperação de senha** — envio de e-mail com token temporário (Resend ou Nodemailer)
5. **Proteção de rotas de API** — criar helper `requireAuth(request)` reutilizável para todos os route handlers
6. **Paginação** — todas as listagens devem ter cursor ou offset pagination
7. **Rate limiting** — especialmente em `/api/auth/login` e `/api/auth/register`
