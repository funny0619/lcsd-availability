create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_summary_log (
  summary_date date primary key,
  sent_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.daily_summary_log enable row level security;

-- The backend uses a Supabase secret key, which maps to service_role.
-- Keep these tables inaccessible to public/browser roles.
grant usage on schema public to service_role;
grant select, insert, update on table public.push_subscriptions to service_role;
grant select, insert, update on table public.daily_summary_log to service_role;

-- The application uses the Supabase secret key from server routes.
-- No public client policies are required for the single-user MVP.
