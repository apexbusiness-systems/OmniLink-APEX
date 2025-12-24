-- OmniDash v1 schema
-- Safe enable note: gate with OMNIDASH_ENABLED and admin users only until stable.

-- Enums
create type public.omnidash_pipeline_stage as enum (
  'lead',
  'contacted',
  'meeting',
  'proposal',
  'negotiation',
  'paid',
  'live',
  'lost'
);

create type public.omnidash_incident_severity as enum ('sev1', 'sev2', 'sev3');
create type public.omnidash_incident_status as enum ('open', 'monitoring', 'resolved');

-- Settings per admin user/org
create table if not exists public.omnidash_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  demo_mode boolean not null default false,
  show_connected_ecosystem boolean not null default false,
  anonymize_kpis boolean not null default true,
  freeze_mode boolean not null default false,
  power_block_started_at timestamptz,
  power_block_duration_minutes int not null default 90,
  updated_at timestamptz not null default now()
);
alter table public.omnidash_settings enable row level security;

-- Today items (ADHD-friendly outcomes)
create table if not exists public.omnidash_today_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  next_action text,
  category text not null default 'outcome' check (category in ('outcome','outreach','metric')),
  order_index int not null default 0,
  is_active boolean not null default true,
  power_block_started_at timestamptz,
  power_block_duration_minutes int not null default 90,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.omnidash_today_items enable row level security;

-- Pipeline board
create table if not exists public.omnidash_pipeline_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_name text not null,
  product text not null,
  owner text not null,
  stage public.omnidash_pipeline_stage not null default 'lead',
  last_touch_at date,
  next_touch_at date,
  expected_mrr numeric(12,2),
  probability int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint omnidash_pipeline_next_touch_check check (stage = 'lost' or next_touch_at is not null)
);
alter table public.omnidash_pipeline_items enable row level security;

-- KPI daily scoreboard
create table if not exists public.omnidash_kpi_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day date not null default current_date,
  tradeline_paid_starts int not null default 0,
  tradeline_active_pilots int not null default 0,
  tradeline_churn_risks int not null default 0,
  flowbills_demos int not null default 0,
  flowbills_paid_accounts int not null default 0,
  cash_days_to_cash int,
  ops_sev1_incidents int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, day)
);
alter table public.omnidash_kpi_daily enable row level security;

-- Ops / reliability incidents
create table if not exists public.omnidash_incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  severity public.omnidash_incident_severity not null default 'sev2',
  status public.omnidash_incident_status not null default 'open',
  title text not null,
  description text,
  resolution_notes text,
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.omnidash_incidents enable row level security;

-- RLS: admin-only access
create policy "Admins manage omnidash_settings" on public.omnidash_settings
  for all to authenticated
  using (public.is_admin(auth.uid()) and user_id = auth.uid())
  with check (public.is_admin(auth.uid()) and user_id = auth.uid());

create policy "Admins manage today items" on public.omnidash_today_items
  for all to authenticated
  using (public.is_admin(auth.uid()) and user_id = auth.uid())
  with check (public.is_admin(auth.uid()) and user_id = auth.uid());

create policy "Admins manage pipeline items" on public.omnidash_pipeline_items
  for all to authenticated
  using (public.is_admin(auth.uid()) and user_id = auth.uid())
  with check (public.is_admin(auth.uid()) and user_id = auth.uid());

create policy "Admins manage KPI daily" on public.omnidash_kpi_daily
  for all to authenticated
  using (public.is_admin(auth.uid()) and user_id = auth.uid())
  with check (public.is_admin(auth.uid()) and user_id = auth.uid());

create policy "Admins manage incidents" on public.omnidash_incidents
  for all to authenticated
  using (public.is_admin(auth.uid()) and user_id = auth.uid())
  with check (public.is_admin(auth.uid()) and user_id = auth.uid());

-- Indexes for performance
create index if not exists idx_omnidash_today_user on public.omnidash_today_items(user_id);
create index if not exists idx_omnidash_pipeline_user on public.omnidash_pipeline_items(user_id);
create index if not exists idx_omnidash_pipeline_stage on public.omnidash_pipeline_items(stage);
create index if not exists idx_omnidash_pipeline_next_touch on public.omnidash_pipeline_items(next_touch_at);
create index if not exists idx_omnidash_kpi_user_day on public.omnidash_kpi_daily(user_id, day);
create index if not exists idx_omnidash_incidents_user on public.omnidash_incidents(user_id);
create index if not exists idx_omnidash_incidents_status on public.omnidash_incidents(status);

-- updated_at triggers
create trigger handle_omnidash_settings_updated_at
  before update on public.omnidash_settings
  for each row execute function public.handle_updated_at();

create trigger handle_omnidash_today_items_updated_at
  before update on public.omnidash_today_items
  for each row execute function public.handle_updated_at();

create trigger handle_omnidash_pipeline_items_updated_at
  before update on public.omnidash_pipeline_items
  for each row execute function public.handle_updated_at();

create trigger handle_omnidash_kpi_daily_updated_at
  before update on public.omnidash_kpi_daily
  for each row execute function public.handle_updated_at();

create trigger handle_omnidash_incidents_updated_at
  before update on public.omnidash_incidents
  for each row execute function public.handle_updated_at();

