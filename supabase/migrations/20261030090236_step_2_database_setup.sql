-- Step 2 only. Apply once to a fresh, dedicated Supabase project.
begin;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.clinician_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (btrim(full_name) <> ''),
  department_id uuid not null references public.departments(id) on delete restrict
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique check (btrim(request_reference) <> ''),
  patient_name text not null check (btrim(patient_name) <> ''),
  patient_file_number text not null check (btrim(patient_file_number) <> ''),
  date_of_birth date not null,
  phone text not null check (btrim(phone) <> ''),
  email text check (email is null or btrim(email) <> ''),
  reason text not null check (btrim(reason) <> ''),
  description text not null check (btrim(description) <> ''),
  symptom_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(symptom_answers) = 'object'),
  department_id uuid not null references public.departments(id) on delete restrict,
  status text not null default 'nouveau' check (btrim(status) <> ''),
  priority text not null default 'normal' check (btrim(priority) <> ''),
  dentist_decision text check (dentist_decision is null or btrim(dentist_decision) <> ''),
  dentist_response text check (dentist_response is null or btrim(dentist_response) <> ''),
  proposed_appointment_at timestamptz,
  call_video_details text check (call_video_details is null or btrim(call_video_details) <> ''),
  tracking_token_hash text unique check (tracking_token_hash is null or btrim(tracking_token_hash) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  storage_path text not null unique check (btrim(storage_path) <> ''),
  created_at timestamptz not null default now()
);

-- Primary keys and unique constraints already create indexes.
create index clinician_profiles_department_id_idx on public.clinician_profiles(department_id);
create index requests_department_id_idx on public.requests(department_id);
create index requests_created_at_idx on public.requests(created_at);
create index request_photos_request_id_idx on public.request_photos(request_id);

create function public.set_request_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_request_updated_at() from public, anon, authenticated;

create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_request_updated_at();

insert into public.departments (name, slug) values
  ('Chirurgie bucco-dentaire', 'chirurgie-bucco-dentaire'),
  ('Parodontologie', 'parodontologie'),
  ('Endodontie', 'endodontie'),
  ('Dentisterie restauratrice / conjointe', 'dentisterie-restauratrice-conjointe'),
  ('Pédodontie', 'pedodontie'),
  ('Urgences', 'urgences');

alter table public.departments enable row level security;
alter table public.clinician_profiles enable row level security;
alter table public.requests enable row level security;
alter table public.request_photos enable row level security;

-- No client access in Step 2, including when older project defaults grant it.
-- Future authorization must deliberately add both privileges and RLS policies.
revoke all on table public.departments, public.clinician_profiles,
  public.requests, public.request_photos from public, anon, authenticated;

-- Explicit grants also support projects with automatic Data API grants disabled.
-- No service-role credential is used by the application in this step.
grant select, insert, update, delete on table public.departments,
  public.clinician_profiles, public.requests, public.request_photos to service_role;

-- Supabase manages storage.objects RLS. No object access policies are added.
insert into storage.buckets (id, name, public)
values ('patient-photos', 'patient-photos', false)
on conflict (id) do update set public = false;

commit;
