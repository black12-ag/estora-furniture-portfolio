-- ============================================================================
-- ESTORA — Full database bootstrap for a fresh Supabase project
-- ----------------------------------------------------------------------------
-- Run this once against a fresh Supabase database (SQL editor, psql, or a
-- migration). It is idempotent-ish (uses IF NOT EXISTS / OR REPLACE where
-- possible) and creates every table, RLS policy, function, and trigger the
-- Estora app depends on.
--
-- Order:
--   1. Enums & helper functions (updated_at, has_role, permissions, audit)
--   2. Auth-adjacent tables (profiles, user_roles, admin_permissions,
--      notification_preferences) + auth.users trigger
--   3. Domain tables (products, blog_posts, orders, promo_codes, ...)
--   4. Notifications, audit log, refund workflow
--   5. Grants + RLS policies for every public table
-- ============================================================================

-- --- 1. ENUMS & UTILITY FUNCTIONS -------------------------------------------

do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('customer', 'admin', 'super_admin');
  end if;
end $$;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Security-definer role check (avoids recursive RLS on user_roles).
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_any_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin') or public.has_role(_user_id, 'super_admin');
$$;

-- Fine-grained admin permissions (super_admin bypasses).
create or replace function public.has_admin_permission(_user_id uuid, _resource text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'super_admin')
    or (public.has_role(_user_id, 'admin') and (
      not exists (select 1 from public.admin_permissions where user_id = _user_id)
      or exists (select 1 from public.admin_permissions where user_id = _user_id and resource = _resource)
    ));
$$;

-- --- 2. AUTH-ADJACENT TABLES -------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource text not null,
  created_at timestamptz not null default now(),
  unique (user_id, resource)
);
grant select on public.admin_permissions to authenticated;
grant all on public.admin_permissions to service_role;
alter table public.admin_permissions enable row level security;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refunds_inapp boolean not null default true,
  refunds_email boolean not null default true,
  cancellations_inapp boolean not null default true,
  cancellations_email boolean not null default true,
  orders_inapp boolean not null default true,
  orders_email boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;
alter table public.notification_preferences enable row level security;

-- Auto-provision profile, role, and prefs on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, avatar_url) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'customer')
    on conflict (user_id, role) do nothing;

  insert into public.notification_preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- 3. DOMAIN TABLES --------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  long_description text,
  category text,
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  stock int not null default 0,
  low_stock_threshold int not null default 5,
  featured boolean not null default false,
  status text not null default 'draft', -- draft | published | archived
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  cover_url text,
  author text,
  tags text[] not null default '{}',
  status text not null default 'draft',
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.blog_posts to anon;
grant select, insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
alter table public.blog_posts enable row level security;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('EST-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending',
  ship jsonb not null default '{}'::jsonb,
  method text not null default 'pay_later',
  promo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant insert on public.orders to anon; -- guest checkout
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);
grant select on public.product_reviews to anon;
grant select, insert on public.product_reviews to authenticated;
grant all on public.product_reviews to service_role;
alter table public.product_reviews enable row level security;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_subscribers to anon;
grant insert, select on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  body text not null,
  status text not null default 'new',
  admin_note text,
  handled_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon;
grant insert, select on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_pct numeric(5,2) not null default 0,
  free_shipping boolean not null default false,
  active boolean not null default true,
  min_subtotal numeric(10,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.promo_codes to anon;
grant select, insert, update, delete on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;
alter table public.promo_codes enable row level security;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;

-- --- 4. NOTIFICATIONS / AUDIT / REFUND WORKFLOW -----------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null,
  ref_table text,
  ref_id uuid,
  channel text not null,        -- email | inapp
  status text not null,         -- queued | sent | skipped | failed
  subject text,
  from_addr text,
  to_addr text,
  body_preview text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.notification_events to authenticated;
grant all on public.notification_events to service_role;
alter table public.notification_events enable row level security;

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  request_type text not null,   -- refund | cancellation
  reason text,
  status text not null default 'pending', -- pending | approved | rejected
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.refund_requests to authenticated;
grant all on public.refund_requests to service_role;
alter table public.refund_requests enable row level security;

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant text,
  color text,
  size text,
  delta int not null,
  before_stock int,
  after_stock int,
  reason text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert on public.inventory_adjustments to authenticated;
grant all on public.inventory_adjustments to service_role;
alter table public.inventory_adjustments enable row level security;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  table_name text not null,
  record_id text,
  action text not null,          -- create | update | delete
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

-- Generic audit trigger (attach to any table you want tracked).
create or replace function public.record_audit_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_email text; v_id text;
begin
  begin select email into v_email from auth.users where id = v_uid; exception when others then v_email := null; end;
  if tg_op = 'DELETE' then
    v_id := (row_to_json(old)->>'id');
    insert into public.audit_logs(actor_id, actor_email, table_name, record_id, action, old_data)
      values (v_uid, v_email, tg_table_name, v_id, 'delete', to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    v_id := (row_to_json(new)->>'id');
    insert into public.audit_logs(actor_id, actor_email, table_name, record_id, action, old_data, new_data)
      values (v_uid, v_email, tg_table_name, v_id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  else
    v_id := (row_to_json(new)->>'id');
    insert into public.audit_logs(actor_id, actor_email, table_name, record_id, action, new_data)
      values (v_uid, v_email, tg_table_name, v_id, 'create', to_jsonb(new));
    return new;
  end if;
end;
$$;

-- updated_at auto triggers on the tables that need it.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','products','blog_posts','orders','promo_codes',
    'contact_messages','refund_requests','notification_preferences','site_settings'
  ] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I ' ||
      'for each row execute function public.update_updated_at_column()', t, t);
  end loop;
end $$;

-- --- 5. RLS POLICIES ---------------------------------------------------------

-- profiles ---------------------------------------------------------------
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select
  to authenticated using (auth.uid() = id);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert
  to authenticated with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update
  to authenticated using (auth.uid() = id);
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles for select
  to authenticated using (public.is_any_admin(auth.uid()));

-- user_roles -------------------------------------------------------------
drop policy if exists "users read own roles" on public.user_roles;
create policy "users read own roles" on public.user_roles for select
  to authenticated using (auth.uid() = user_id);
drop policy if exists "admins read all roles" on public.user_roles;
create policy "admins read all roles" on public.user_roles for select
  to authenticated using (public.is_any_admin(auth.uid()));
drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles for all
  to authenticated using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- admin_permissions -----------------------------------------------------
drop policy if exists "admins read their own permissions" on public.admin_permissions;
create policy "admins read their own permissions" on public.admin_permissions for select
  to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'super_admin'));
drop policy if exists "super admins manage permissions" on public.admin_permissions;
create policy "super admins manage permissions" on public.admin_permissions for all
  to authenticated using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- products ---------------------------------------------------------------
drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products for select
  using (status = 'published');
drop policy if exists "admins read all products" on public.products;
create policy "admins read all products" on public.products for select
  to authenticated using (public.is_any_admin(auth.uid()));
drop policy if exists "admins insert products" on public.products;
create policy "admins insert products" on public.products for insert
  to authenticated with check (public.has_admin_permission(auth.uid(), 'products'));
drop policy if exists "admins update products" on public.products;
create policy "admins update products" on public.products for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'products'));
drop policy if exists "admins delete products" on public.products;
create policy "admins delete products" on public.products for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'products'));

-- blog_posts -------------------------------------------------------------
drop policy if exists "public read published posts" on public.blog_posts;
create policy "public read published posts" on public.blog_posts for select
  using (status = 'published');
drop policy if exists "admins read all posts" on public.blog_posts;
create policy "admins read all posts" on public.blog_posts for select
  to authenticated using (public.is_any_admin(auth.uid()));
drop policy if exists "admins insert posts" on public.blog_posts;
create policy "admins insert posts" on public.blog_posts for insert
  to authenticated with check (public.has_admin_permission(auth.uid(), 'blog'));
drop policy if exists "admins update posts" on public.blog_posts;
create policy "admins update posts" on public.blog_posts for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'blog'));
drop policy if exists "admins delete posts" on public.blog_posts;
create policy "admins delete posts" on public.blog_posts for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'blog'));

-- orders -----------------------------------------------------------------
drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders" on public.orders for select
  to authenticated using (auth.uid() = user_id);
drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders" on public.orders for select
  to authenticated using (public.has_admin_permission(auth.uid(), 'orders'));
drop policy if exists "authenticated place own orders" on public.orders;
create policy "authenticated place own orders" on public.orders for insert
  to authenticated with check (auth.uid() = user_id);
drop policy if exists "guests place orders" on public.orders;
create policy "guests place orders" on public.orders for insert
  to anon with check (user_id is null);
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'orders'));

-- product_reviews --------------------------------------------------------
drop policy if exists "anyone reads approved reviews" on public.product_reviews;
create policy "anyone reads approved reviews" on public.product_reviews for select
  using (status = 'approved');
drop policy if exists "authenticated leave review" on public.product_reviews;
create policy "authenticated leave review" on public.product_reviews for insert
  to authenticated with check (auth.uid() = user_id);
drop policy if exists "admins update reviews" on public.product_reviews;
create policy "admins update reviews" on public.product_reviews for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'reviews'));
drop policy if exists "admins delete reviews" on public.product_reviews;
create policy "admins delete reviews" on public.product_reviews for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'reviews'));

-- newsletter_subscribers -------------------------------------------------
drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe" on public.newsletter_subscribers for insert
  with check (true);
drop policy if exists "admins read subscribers" on public.newsletter_subscribers;
create policy "admins read subscribers" on public.newsletter_subscribers for select
  to authenticated using (public.has_admin_permission(auth.uid(), 'subscribers'));
drop policy if exists "admins delete subscribers" on public.newsletter_subscribers;
create policy "admins delete subscribers" on public.newsletter_subscribers for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'subscribers'));

-- contact_messages -------------------------------------------------------
drop policy if exists "anyone can send message" on public.contact_messages;
create policy "anyone can send message" on public.contact_messages for insert
  with check (true);
drop policy if exists "admins read messages" on public.contact_messages;
create policy "admins read messages" on public.contact_messages for select
  to authenticated using (public.has_admin_permission(auth.uid(), 'messages'));
drop policy if exists "admins update messages" on public.contact_messages;
create policy "admins update messages" on public.contact_messages for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'messages'));
drop policy if exists "admins delete messages" on public.contact_messages;
create policy "admins delete messages" on public.contact_messages for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'messages'));

-- promo_codes ------------------------------------------------------------
drop policy if exists "public read active promos" on public.promo_codes;
create policy "public read active promos" on public.promo_codes for select
  using (active = true);
drop policy if exists "admins read all promos" on public.promo_codes;
create policy "admins read all promos" on public.promo_codes for select
  to authenticated using (public.is_any_admin(auth.uid()));
drop policy if exists "admins insert promos" on public.promo_codes;
create policy "admins insert promos" on public.promo_codes for insert
  to authenticated with check (public.has_admin_permission(auth.uid(), 'promos'));
drop policy if exists "admins update promos" on public.promo_codes;
create policy "admins update promos" on public.promo_codes for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'promos'));
drop policy if exists "admins delete promos" on public.promo_codes;
create policy "admins delete promos" on public.promo_codes for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'promos'));

-- site_settings ----------------------------------------------------------
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
drop policy if exists "admins write settings" on public.site_settings;
create policy "admins write settings" on public.site_settings for all
  to authenticated using (public.has_admin_permission(auth.uid(), 'settings'))
  with check (public.has_admin_permission(auth.uid(), 'settings'));

-- notifications ----------------------------------------------------------
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select
  to authenticated using (auth.uid() = user_id);
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update
  to authenticated using (auth.uid() = user_id);
drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications" on public.notifications for delete
  to authenticated using (auth.uid() = user_id);

-- notification_events ----------------------------------------------------
drop policy if exists "Users can view own notification events" on public.notification_events;
create policy "Users can view own notification events" on public.notification_events for select
  to authenticated using (auth.uid() = user_id);
drop policy if exists "Admins can insert notification events" on public.notification_events;
create policy "Admins can insert notification events" on public.notification_events for insert
  to authenticated with check (public.is_any_admin(auth.uid()));
drop policy if exists "Admins can update notification events" on public.notification_events;
create policy "Admins can update notification events" on public.notification_events for update
  to authenticated using (public.is_any_admin(auth.uid()));

-- notification_preferences ----------------------------------------------
drop policy if exists "Users manage own preferences" on public.notification_preferences;
create policy "Users manage own preferences" on public.notification_preferences for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- refund_requests --------------------------------------------------------
drop policy if exists "users read own refund requests" on public.refund_requests;
create policy "users read own refund requests" on public.refund_requests for select
  to authenticated using (auth.uid() = user_id);
drop policy if exists "users create own refund requests" on public.refund_requests;
create policy "users create own refund requests" on public.refund_requests for insert
  to authenticated with check (auth.uid() = user_id);
drop policy if exists "admins update refund requests" on public.refund_requests;
create policy "admins update refund requests" on public.refund_requests for update
  to authenticated using (public.has_admin_permission(auth.uid(), 'refunds'));
drop policy if exists "admins delete refund requests" on public.refund_requests;
create policy "admins delete refund requests" on public.refund_requests for delete
  to authenticated using (public.has_admin_permission(auth.uid(), 'refunds'));

-- inventory_adjustments --------------------------------------------------
drop policy if exists "admins read adjustments" on public.inventory_adjustments;
create policy "admins read adjustments" on public.inventory_adjustments for select
  to authenticated using (public.has_admin_permission(auth.uid(), 'inventory'));
drop policy if exists "admins insert adjustments" on public.inventory_adjustments;
create policy "admins insert adjustments" on public.inventory_adjustments for insert
  to authenticated with check (public.has_admin_permission(auth.uid(), 'inventory'));

-- audit_logs -------------------------------------------------------------
drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs for select
  to authenticated using (public.has_admin_permission(auth.uid(), 'audit'));

-- --- 6. STORAGE BUCKET (optional; run in Storage dashboard or via SDK) ------
-- insert into storage.buckets (id, name, public) values ('media', 'media', false)
--   on conflict (id) do nothing;
-- Storage RLS policies for 'media' bucket:
--   - authenticated admins can insert/update/delete objects under 'media'
--   - authenticated users can read objects (bucket is private; signed URLs)

-- --- 7. FIRST-ADMIN CLAIM ---------------------------------------------------
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); admin_count int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select count(*) into admin_count from public.user_roles where role in ('admin','super_admin');
  if admin_count > 0 then return false; end if;
  insert into public.user_roles(user_id, role) values (uid, 'super_admin')
    on conflict (user_id, role) do nothing;
  return true;
end;
$$;
grant execute on function public.claim_first_admin() to authenticated;

-- Done. Enable email confirmations in Auth settings (auto_confirm_email = false)
-- and configure Google as a social provider if desired.
