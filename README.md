# Halden

A small furniture shop: public storefront, workshop admin, and a Supabase backend. Vue 3, Vue Router, and Pinia on the front. Postgres, Auth, and Storage on the back.

The shop is [Halden](apps/store), a Portland workshop selling seating, tables, textiles, lighting, and ceramics. Orders reserve stock and wait for the shop to confirm payment. Cancelling an order puts the stock back.

How the store, workshop, and database fit together is in [SYSTEM.md](SYSTEM.md).

## Preview before Supabase

```bash
npm install
npm run dev:store
npm run dev:admin
```

- Store: http://localhost:5173
- Workshop: http://localhost:5174

Preview mode keeps a catalog in the browser. Register on the store with any email and a password of at least 6 characters, add a piece to the bag, and check out. The workshop login is `workshop@halden.test` with any password of at least 6 characters. The two apps do not share that preview data. Connect Supabase when you want one catalog and real accounts.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run these files in order:
   - `supabase/migrations/20261009120000_init.sql`
   - `supabase/migrations/20261009120100_storage.sql`
   - `supabase/seed.sql`
3. Authentication → Providers → Email: turn off “Confirm email” while you are testing. You can turn it back on later; the store tells people to check their inbox.
4. Copy `.env.example` to `.env` and fill in the project URL and the anon key. Do not put the service role key in this file.
5. Restart both dev servers.
6. Register on the store, then promote that account in the SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Sign in to the workshop with that account.

Shipping is free at $250. Below that it is $18. Prices on an order come from the database, not from the browser. The `place_order` and `set_order_status` functions are the only way to create an order or change its status.

Product photos can be pasted as URLs or uploaded from the piece form. Uploads go to the public `product-images` bucket.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:store` | Storefront on port 5173 |
| `npm run dev:admin` | Workshop on port 5174 |
| `npm run build` | Typecheck and build both apps |

## Push to GitHub

```bash
git init
git add .
git commit -m "Add the Halden storefront, workshop, and Supabase schema."
gh repo create halden --private --source=. --remote=origin --push
```

Use `--public` if you want the repository public. Each app is a static Vite build. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host’s environment before building, then publish `apps/store/dist` and `apps/admin/dist` as two sites.
