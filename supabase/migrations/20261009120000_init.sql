-- Halden schema: catalog, accounts, orders, and studio notes.
-- Run this in the Supabase SQL editor, then storage.sql, then seed.sql.

create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  summary text not null default '',
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0),
  sku text not null unique,
  stock integer not null default 0 check (stock >= 0),
  material text not null default '',
  dimensions text not null default '',
  lead_time text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  image_url text not null,
  image_alt text not null default '',
  hover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  status public.order_status not null default 'pending',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  full_name text not null,
  address_line text not null,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null default 'United States',
  notes text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  sku text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 8)
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    char_length(email) <= 160
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  created_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_published_idx on public.products (published);
create index orders_user_idx on public.orders (user_id);
create index orders_created_idx on public.orders (created_at desc);
create index order_items_order_idx on public.order_items (order_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch
before update on public.products
for each row execute function public.touch_updated_at();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and new.role is distinct from old.role then
    raise exception 'Cannot change role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.place_order(
  p_email text,
  p_full_name text,
  p_address_line text,
  p_city text,
  p_region text,
  p_postal_code text,
  p_country text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer;
  v_order_id uuid;
  v_lines jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in to place an order';
  end if;
  if p_email is null or length(trim(p_email)) < 3 then
    raise exception 'Email is required';
  end if;
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Name is required';
  end if;
  if p_address_line is null or length(trim(p_address_line)) < 3 then
    raise exception 'Address is required';
  end if;
  if p_city is null or length(trim(p_city)) < 2 then
    raise exception 'City is required';
  end if;
  if p_region is null or length(trim(p_region)) < 2 then
    raise exception 'State is required';
  end if;
  if p_postal_code is null or length(trim(p_postal_code)) < 3 then
    raise exception 'Postal code is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'Too many lines in one order';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item ->> 'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Invalid product';
    end if;

    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 8 then
      raise exception 'Quantity must be between 1 and 8';
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
      and published = true
    for update;

    if not found then
      raise exception 'A piece in your bag is no longer available';
    end if;
    if v_product.stock < v_qty then
      raise exception '% does not have enough stock', v_product.name;
    end if;

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;

    v_subtotal := v_subtotal + v_product.price_cents * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'sku', v_product.sku,
      'unit_price_cents', v_product.price_cents,
      'quantity', v_qty
    ));
  end loop;

  v_shipping := case when v_subtotal >= 25000 then 0 else 1800 end;

  insert into public.orders (
    user_id, email, status, subtotal_cents, shipping_cents, total_cents,
    full_name, address_line, city, region, postal_code, country, notes
  ) values (
    v_uid,
    trim(p_email),
    'pending',
    v_subtotal,
    v_shipping,
    v_subtotal + v_shipping,
    trim(p_full_name),
    trim(p_address_line),
    trim(p_city),
    trim(p_region),
    trim(p_postal_code),
    coalesce(nullif(trim(p_country), ''), 'United States'),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, name, sku, unit_price_cents, quantity)
  select
    v_order_id,
    (line ->> 'product_id')::uuid,
    line ->> 'name',
    line ->> 'sku',
    (line ->> 'unit_price_cents')::integer,
    (line ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) as line;

  return v_order_id;
end;
$$;

create or replace function public.set_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status = p_status then
    return;
  end if;

  if v_order.status = 'cancelled' and p_status <> 'cancelled' then
    if exists (
      select 1
      from public.order_items i
      join public.products p on p.id = i.product_id
      where i.order_id = p_order_id
        and p.stock < i.quantity
    ) then
      raise exception 'Not enough stock to reopen this order';
    end if;

    update public.products p
    set stock = p.stock - i.quantity
    from public.order_items i
    where i.order_id = p_order_id
      and i.product_id = p.id;
  elsif v_order.status <> 'cancelled' and p_status = 'cancelled' then
    update public.products p
    set stock = p.stock + i.quantity
    from public.order_items i
    where i.order_id = p_order_id
      and i.product_id = p.id;
  end if;

  update public.orders
  set status = p_status
  where id = p_order_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscribers enable row level security;

create policy "read profiles" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "update profiles" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "read categories" on public.categories
for select using (true);

create policy "write categories" on public.categories
for all using (public.is_admin())
with check (public.is_admin());

create policy "read products" on public.products
for select using (published = true or public.is_admin());

create policy "write products" on public.products
for all using (public.is_admin())
with check (public.is_admin());

create policy "read orders" on public.orders
for select using (user_id = auth.uid() or public.is_admin());

create policy "read order items" on public.order_items
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "subscribe" on public.subscribers
for insert with check (
  char_length(email) <= 160
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

create policy "admin reads subscribers" on public.subscribers
for select using (public.is_admin());

revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;

revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

revoke all on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;

revoke all on table public.order_items from anon, authenticated;
grant select on table public.order_items to authenticated;

revoke all on table public.subscribers from anon, authenticated;
grant insert on table public.subscribers to anon, authenticated;
grant select on table public.subscribers to authenticated;

revoke all on function public.place_order(text, text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, jsonb) to authenticated;

revoke all on function public.set_order_status(uuid, public.order_status) from public;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.protect_profile_role() from public;
revoke all on function public.touch_updated_at() from public;

grant execute on function public.is_admin() to anon, authenticated;
