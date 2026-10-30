-- Run in the dedicated project's SQL Editor as postgres AFTER the migration.
-- This checks metadata and seed data; it does not read patient records.
begin transaction read only;

do $$
declare
  target_table_name text;
  table_id regclass;
  client_role text;
begin
  foreach target_table_name in array array['departments', 'clinician_profiles', 'requests', 'request_photos'] loop
    table_id := to_regclass('public.' || target_table_name);
    if table_id is null then
      raise exception 'Missing table: %', target_table_name;
    end if;
    if not (select relrowsecurity from pg_class where oid = table_id) then
      raise exception 'RLS is disabled on %', target_table_name;
    end if;
    if not exists (select 1 from pg_constraint where conrelid = table_id and contype = 'p') then
      raise exception 'Missing primary key on %', target_table_name;
    end if;
    if exists (select 1 from pg_policy where polrelid = table_id) then
      raise exception 'Unexpected access policy on %', target_table_name;
    end if;
    foreach client_role in array array['anon', 'authenticated'] loop
      if has_table_privilege(client_role, table_id, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
        raise exception 'Unexpected client privilege for % on %', client_role, target_table_name;
      end if;
    end loop;
  end loop;

  if (select count(*) from public.departments) <> 6 or exists (
    select 1 from (values
      ('Chirurgie bucco-dentaire', 'chirurgie-bucco-dentaire'),
      ('Parodontologie', 'parodontologie'),
      ('Endodontie', 'endodontie'),
      ('Dentisterie restauratrice / conjointe', 'dentisterie-restauratrice-conjointe'),
      ('Pédodontie', 'pedodontie'),
      ('Urgences', 'urgences')
    ) as expected(name, slug)
    where not exists (
      select 1 from public.departments d where d.name = expected.name and d.slug = expected.slug
    )
  ) then
    raise exception 'Expected the six exact department seeds';
  end if;

  if (select count(*) from pg_constraint where contype = 'f' and (
    (conrelid = 'public.clinician_profiles'::regclass and confrelid = 'auth.users'::regclass and conname = 'clinician_profiles_id_fkey' and confdeltype = 'c') or
    (conrelid = 'public.clinician_profiles'::regclass and confrelid = 'public.departments'::regclass and conname = 'clinician_profiles_department_id_fkey' and confdeltype = 'r') or
    (conrelid = 'public.requests'::regclass and confrelid = 'public.departments'::regclass and conname = 'requests_department_id_fkey' and confdeltype = 'r') or
    (conrelid = 'public.request_photos'::regclass and confrelid = 'public.requests'::regclass and conname = 'request_photos_request_id_fkey' and confdeltype = 'c')
  )) <> 4 then
    raise exception 'Missing or incorrect foreign-key relationship';
  end if;

  if (select count(*) from pg_constraint where contype = 'u' and (
    (conrelid = 'public.departments'::regclass and conname in ('departments_name_key', 'departments_slug_key')) or
    (conrelid = 'public.requests'::regclass and conname in ('requests_request_reference_key', 'requests_tracking_token_hash_key')) or
    (conrelid = 'public.request_photos'::regclass and conname = 'request_photos_storage_path_key')
  )) <> 5 then
    raise exception 'Missing unique constraints';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'requests' and column_name = 'status' and column_default = '''nouveau''::text') or
     not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'requests' and column_name = 'priority' and column_default = '''normal''::text') then
    raise exception 'Incorrect status or priority default';
  end if;

  if not exists (select 1 from pg_trigger where tgrelid = 'public.requests'::regclass and tgname = 'requests_set_updated_at' and tgenabled = 'O') then
    raise exception 'Missing updated_at trigger';
  end if;

  if not exists (select 1 from storage.buckets where id = 'patient-photos' and name = 'patient-photos' and public = false) then
    raise exception 'Missing or public patient-photos bucket';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'storage.objects'::regclass) then
    raise exception 'Storage object RLS is disabled';
  end if;
end;
$$;

select 'Step 2 metadata and seed checks passed' as result;

-- Review definitions: four primary keys, four foreign keys, five unique
-- constraints, and nonempty-text / JSON-object checks are expected.
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.departments'::regclass, 'public.clinician_profiles'::regclass,
  'public.requests'::regclass, 'public.request_photos'::regclass)
order by conrelid::regclass::text, conname;

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename in ('departments', 'clinician_profiles', 'requests', 'request_photos')
order by tablename, indexname;

-- A fresh project should return NO rows. Existing policies require review:
-- a broad policy on storage.objects can also apply to a new private bucket.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename in ('objects', 'buckets');

commit;
