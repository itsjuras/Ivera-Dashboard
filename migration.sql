-- ============================================================
-- Ivera: roles, products, plans, and user_products
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Products catalog
--    To add a new product: INSERT a row here. No code changes needed.
create table if not exists products (
  slug        text primary key,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

insert into products (slug, name, description) values
  ('receptionist', 'Receptionist',  'AI receptionist that answers calls 24/7'),
  ('sales',        'Sales Agent',   'Autonomous outbound sales pipeline'),
  ('consultant',   'Consultant',    'AI business consultant and advisor'),
  ('support',      'Support',       'AI customer support agent')
on conflict (slug) do nothing;

-- 2. Plans catalog
--    price_cad is the default monthly price (null = quote-only / custom)
create table if not exists plans (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  price_cad   numeric(10, 2),
  created_at  timestamptz not null default now()
);

insert into plans (slug, name, description, price_cad) values
  ('free',    'Free',    'No cost, limited usage',                      0.00),
  ('starter', 'Starter', 'For small teams getting started',            49.00),
  ('pro',     'Pro',     'For growing businesses',                    149.00),
  ('max',     'Max',     'Unlimited usage, all features',             299.00),
  ('custom',  'Custom',  'Negotiated pricing — see custom_price_cad',  null)
on conflict (slug) do nothing;

-- 3. User roles  (one row per Supabase auth user)
create table if not exists user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('ivera_admin', 'customer')),
  created_at timestamptz not null default now()
);

-- 4. User ↔ product subscriptions (extended)
create table if not exists user_products (
  user_id          uuid        not null references auth.users (id) on delete cascade,
  product_slug     text        not null references products (slug) on delete cascade,
  plan_id          int         not null references plans (id),
  -- Optional overrides set by Ivera admin
  custom_price_cad numeric(10, 2),    -- overrides plan.price_cad when set
  custom_notes     text,              -- e.g. "Q1 deal – 20% off for 3 months"
  active           boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, product_slug)
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_products_updated_at on user_products;
create trigger user_products_updated_at
  before update on user_products
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table products     enable row level security;
alter table plans        enable row level security;
alter table user_roles   enable row level security;
alter table user_products enable row level security;

-- products + plans: any authenticated user can read
create policy "products_read"     on products  for select to authenticated using (true);
create policy "plans_read"        on plans     for select to authenticated using (true);

-- user_roles: users read their own row; service role manages all
create policy "user_roles_read_own" on user_roles
  for select to authenticated using (auth.uid() = user_id);

-- user_products: users read their own rows; service role manages all
create policy "user_products_read_own" on user_products
  for select to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Grants (tables created via SQL need explicit grants)
-- ============================================================

grant select on products      to anon, authenticated;
grant select on plans         to anon, authenticated;
grant select on user_roles    to authenticated;
grant select on user_products to authenticated;
