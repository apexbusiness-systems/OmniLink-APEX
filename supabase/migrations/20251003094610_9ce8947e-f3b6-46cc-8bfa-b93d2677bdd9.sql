-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  unique (user_id, role)
);

-- Create links table
create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  description text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create files table
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz default now()
);

-- Create integrations table
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  status text default 'active',
  config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create automations table
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trigger_type text not null,
  action_type text not null,
  config jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create health_checks table
create table public.health_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  status text not null default 'ok'
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.links enable row level security;
alter table public.files enable row level security;
alter table public.integrations enable row level security;
alter table public.automations enable row level security;
alter table public.health_checks enable row level security;

-- Profiles RLS policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- User roles RLS policies
create policy "Users can view own roles" on public.user_roles
  for select using (auth.uid() = user_id);

-- Links RLS policies
create policy "Users can view own links" on public.links
  for select using (auth.uid() = user_id);

create policy "Users can insert own links" on public.links
  for insert with check (auth.uid() = user_id);

create policy "Users can update own links" on public.links
  for update using (auth.uid() = user_id);

create policy "Users can delete own links" on public.links
  for delete using (auth.uid() = user_id);

-- Files RLS policies
create policy "Users can view own files" on public.files
  for select using (auth.uid() = user_id);

create policy "Users can insert own files" on public.files
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own files" on public.files
  for delete using (auth.uid() = user_id);

-- Integrations RLS policies
create policy "Users can view own integrations" on public.integrations
  for select using (auth.uid() = user_id);

create policy "Users can insert own integrations" on public.integrations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own integrations" on public.integrations
  for update using (auth.uid() = user_id);

create policy "Users can delete own integrations" on public.integrations
  for delete using (auth.uid() = user_id);

-- Automations RLS policies
create policy "Users can view own automations" on public.automations
  for select using (auth.uid() = user_id);

create policy "Users can insert own automations" on public.automations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own automations" on public.automations
  for update using (auth.uid() = user_id);

create policy "Users can delete own automations" on public.automations
  for delete using (auth.uid() = user_id);

-- Health checks RLS policies
create policy "Users can insert own health checks" on public.health_checks
  for insert with check (auth.uid() = user_id);

create policy "Users can read own health checks" on public.health_checks
  for select using (auth.uid() = user_id);

-- Create storage bucket for user files
insert into storage.buckets (id, name, public) 
values ('user-files', 'user-files', false)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Users can view own files" on storage.objects
  for select using (bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own files" on storage.objects
  for insert with check (bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files" on storage.objects
  for delete using (bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-create profile and role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

-- Trigger to execute function on user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();