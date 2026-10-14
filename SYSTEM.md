# How Halden works

Halden is a small furniture shop with two websites and one database.

- The **store** (`apps/store`) is what customers use: browse, bag, account, checkout.
- The **workshop** (`apps/admin`) is what the shop uses: catalog, stock, orders, customers.
- **Supabase** is the backend: Postgres, login, and image storage. There is no separate API server.

Both sites are Vue 3 apps. They share types and data access in `shared/`. Each one talks to Supabase with the public anon key. The key is safe to ship in the browser because Postgres row-level security decides what each person can read and write.

```text
Customer browser                Workshop browser
apps/store                      apps/admin
        \                            /
         \                          /
          +-------- shared/ -------+
                     |
              Supabase client
                     |
     +---------------+----------------+
     |  Auth     Postgres      Storage |
     |  users    tables, RLS   images  |
     |           place_order()         |
     +---------------------------------+
```

## Preview and live mode

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`, both apps use Supabase. That is live mode. Accounts, stock, and orders are shared.

If those values are missing, each app runs in preview mode and stores a catalog in that browser’s `localStorage`. The store and the workshop do not share preview data, because they are different sites. Preview sign-in accepts any password of at least 6 characters. The workshop preview account is `workshop@halden.test`.

`shared/supabase.ts` creates the client. `shared/api.ts` is the one data layer: it calls Supabase when a client exists, and the browser catalog when it does not.

## What a customer can do

| Page | What happens |
| --- | --- |
| Home, shop, product | Published pieces only. Search and department filters run in the browser after one catalog load. |
| Bag | Kept in `localStorage` on that browser. Prices are refreshed from the catalog at checkout. |
| Account | Email and password through Supabase Auth. A database trigger creates a `profiles` row. |
| Checkout | Calls `place_order`. The customer must be signed in. |
| Orders | The customer sees only their own orders. |

Shipping is free at $250. Under that, it is $18. Those amounts are applied inside `place_order`, using the database price, not the price sitting in the bag.

Checkout does not charge a card. It reserves the pieces. The shop confirms timing and sends payment details afterward.

## What the workshop can do

Sign-in uses the same Auth system. The app then checks `profiles.role`. Anyone who is not `admin` is signed out.

| Area | What it writes |
| --- | --- |
| Pieces | Insert, update, delete on `products`. Images can be a URL or an upload. |
| Departments | Insert, update, delete on `categories`. |
| Orders | Status changes go through `set_order_status`. |
| Customers | Can promote a profile to `admin` or back to `customer`. A trigger blocks a customer from changing their own role. |
| Overview | Reads orders, stock, and the studio-notes list. Nothing is written here. |

Uploads go to the public `product-images` bucket. Anyone can view a file. Only an admin can upload or delete one.

The first admin is created by hand, after that person has registered on the store:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## Tables

| Table | Holds |
| --- | --- |
| `profiles` | One row per Auth user. `customer` or `admin`. |
| `categories` | Departments such as Seating and Tables. |
| `products` | Name, price in cents, stock, images, and whether it is published. |
| `orders` | Who ordered, where it ships, totals, and status. |
| `order_items` | The piece name, SKU, unit price, and quantity at the time of the order. |
| `subscribers` | Emails from the footer list. |

Order status moves through `pending`, `paid`, `fulfilled`, and `cancelled`.

Money is stored as integer cents so a price cannot pick up floating-point error. The browser formats cents as dollars.

## How an order changes stock

`place_order` is a Postgres function. The browser cannot insert into `orders` directly.

1. The caller must be signed in.
2. Each line is locked with `for update`.
3. The function rejects the order if a piece is unpublished or the stock is short.
4. It subtracts stock, then inserts the order and its lines.
5. It returns the new order id.

The price on each line is copied from `products` inside the function.

`set_order_status` is the only way to change a status, and only an admin can run it.

- Cancelling an order adds the quantities back.
- Reopening a cancelled order subtracts them again, and fails if there is no longer enough stock.
- Moving between pending, paid, and fulfilled does not touch stock.

If a product is deleted later, past order lines keep the name and price. The product link is cleared.

## Who can see what

Row-level security is on for every table.

| Data | Visitor | Signed-in customer | Admin |
| --- | --- | --- | --- |
| Published pieces and departments | Read | Read | Read, and write |
| Hidden pieces | No | No | Read and write |
| Orders | No | Their own | All |
| Profiles | No | Their own | All, including role changes |
| Studio-note emails | Can join the list | Can join the list | Can read the list |

`is_admin()` reads `profiles` as a privileged function so the policies do not call themselves in a loop.

## Code map

```text
apps/store          Customer site. Routes, bag, account.
apps/admin          Workshop site. Route guard requires role admin.
shared/types.ts     The shapes both apps use.
shared/api.ts       Reads and writes, live or preview.
shared/catalog.ts   The starter catalog used in preview mode and mirrored in seed.sql.
shared/format.ts    Money, dates, order numbers, shipping.
supabase/migrations Schema, policies, and the two order functions.
supabase/seed.sql   Departments and pieces. Accounts are not seeded.
```

An order number such as `HD-9D38BB61` is the first eight characters of the order id. It is not stored as its own column.

## Run and deploy

```bash
npm install
npm run dev:store    # http://localhost:5173
npm run dev:admin    # http://localhost:5174
npm run build
```

Setup for a real Supabase project is in `README.md`.

Each app builds to static files (`apps/store/dist` and `apps/admin/dist`). Host them as two sites. Set the two `VITE_` variables in the host before building, because Vite bakes them into the JavaScript. Do not put the Supabase service role key in the apps or in `.env`.
