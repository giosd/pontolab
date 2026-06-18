# PontoLab

Sistema de registro de tempo por usuário, tarefa e atividade.

## Requisitos

- Node.js 20+
- npm
- PostgreSQL (em produção: [Neon](https://neon.tech))

## Configuração

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

2. Preencha as variáveis em `.env.local` (e/ou `.env` para o Prisma CLI):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
SESSION_SECRET="troque-essa-chave-em-producao"   # gere: openssl rand -base64 32
```

3. Instale as dependências e prepare o banco:

```bash
npm install
npm run db:generate
npm run db:migrate   # ou: npm run db:deploy (produção/Neon)
npm run db:seed
```

4. Inicie o servidor:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Migrations

Sempre que o schema Prisma mudar, rode:

```bash
npm run db:generate
npm run db:migrate
```

Para recriar dados iniciais:

```bash
npx tsx prisma/seed.ts
```

## Usuário inicial

Após rodar o seed, use:

- **Email:** `admin@pontolab.local`
- **Senha:** `admin123`

Recomendamos alterar a senha após o primeiro acesso.

## Trocar senha

1. Faça login no sistema.
2. Acesse **Perfil** no menu lateral.
3. Preencha senha atual, nova senha e confirmação.
4. A nova senha deve ter pelo menos 8 caracteres.

Ao trocar a senha, sessões antigas em outros dispositivos são invalidadas automaticamente.

## Perfis de acesso

- **ADMIN:** acesso completo, incluindo gestão de usuários e visualização de todos os registros.
- **USER:** acesso ao dashboard, registros, configurações e perfil, vendo apenas os próprios lançamentos.

## Segurança da sessão

- Cookie `pontolab_session` com expiração de 8 horas.
- Versão de sessão no banco invalida logins antigos ao trocar senha ou inativar usuário.
- Rotas privadas protegidas por middleware e validação no servidor.

## Scripts úteis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run db:generate` — gerar o Prisma Client
- `npm run db:migrate` — criar/aplicar migrations (dev)
- `npm run db:deploy` — aplicar migrations em produção (Neon)
- `npm run db:seed` — popular dados iniciais
- `npm run db:studio` — abrir Prisma Studio

## Deploy (Vercel + Neon)

1. Crie um banco PostgreSQL na [Neon](https://neon.tech) e copie a connection string (com `?sslmode=require`).
2. Na Vercel, defina as variáveis de ambiente:
   - `DATABASE_URL` — connection string da Neon
   - `SESSION_SECRET` — `openssl rand -base64 32`
   - `NODE_ENV=production`
3. Aplique as migrations na Neon:

```bash
DATABASE_URL="<string-da-neon>" npm run db:deploy
DATABASE_URL="<string-da-neon>" npm run db:seed
```

4. Faça o deploy. O `postinstall` roda `prisma generate` automaticamente na Vercel.

> O provider do Prisma é `postgresql`. As migrations originais de SQLite ficam
> arquivadas em `prisma/migrations_sqlite_backup/` apenas como histórico e não
> são aplicadas.
