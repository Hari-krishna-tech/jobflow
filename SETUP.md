# JobFlow — Local Setup

> Get the app running locally. Copy `.env.example` → `.env.local`, then fill in
> the values below. Never commit `.env.local` (it's gitignored).

```bash
cp .env.example .env.local
```

---

## Environment variables

### Needed now (Phase 1)

| Variable | How to get it | Why |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string ([neon.tech](https://neon.tech)) | Prisma datasource. App + migrations need it. |
| `AUTH_SECRET` | `openssl rand -base64 32` | Signs Auth.js session JWTs. **Required** — app breaks without it. |
| `AUTH_GOOGLE_ID` | Google Cloud Console → APIs & Services → Credentials → **Create Credentials → OAuth client ID** (Web application) → copy **Client ID** | Google "Continue with Google" login. |
| `AUTH_GOOGLE_SECRET` | Same screen → copy **Client Secret** | Pairs with the ID. |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) / your Vercel domain (prod) | App base URL for redirects. |

### Later phases (can be empty for now)

| Variable | Needed in | How to get it |
|---|---|---|
| `OPENROUTER_API_KEY` | Phase 3 — AI email classification | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | Phase 3 | `qwen/qwen3-8b` (already set in `.env.example`) |
| `TOKEN_ENCRYPTION_KEY` | Phase 2.2 — Gmail refresh-token encryption at rest | `openssl rand -base64 32` |

---

## Generate the two secrets

```bash
echo "AUTH_SECRET=$(openssl rand -base64 32)"
echo "TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

Paste each output (the part after `=`) into `.env.local`.

---

## Google OAuth client setup

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

1. **Create Credentials → OAuth client ID** → Application type: **Web application**.
2. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
3. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Copy the **Client ID** → `AUTH_GOOGLE_ID`, and **Client Secret** → `AUTH_GOOGLE_SECRET`.

> If you skip the redirect URI, the Google sign-in button fails with
> `redirect_uri_mismatch`.

---

## Run it

```bash
npm install
npx prisma migrate dev          # apply migrations to Neon
npx prisma generate             # regenerate client after schema changes
npm run dev                     # http://localhost:3000
```

First visit redirects to `/signin` → click **Continue with Google**.

---

## Status at a glance

A quick check of which vars are filled:

```bash
while IFS='=' read -r key val; do
  case "$key" in ''|\#*) continue;; esac
  if [ -z "$val" ]; then echo "❌ $key"; else echo "✅ $key"; fi
done < .env.local
```

Full variable reference: `PLAN.html` §16.
