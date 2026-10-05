-- 001: extensions + shared helper functions.
-- Everything here is table-agnostic and reused by later migrations.

create extension if not exists pgcrypto with schema extensions;

-- Keeps updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the caller is a row in admin_users (any role).
-- SECURITY DEFINER so policies on admin_users itself do not recurse.
-- plpgsql (late-bound) because admin_users is created in 006.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (select 1 from public.admin_users where id = (select auth.uid()));
end;
$$;

-- True only for role = 'owner' (used to guard admin_users management).
create or replace function public.is_owner()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and role = 'owner'
  );
end;
$$;

-- Generic audit trigger: records admin-made INSERT/UPDATE/DELETE into
-- admin_activity_log. Writes by non-admins (e.g. seed, service role) are ignored.
create or replace function public.log_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_old   jsonb;
  v_new   jsonb;
  v_row   jsonb;
begin
  if v_admin is not null and public.is_admin() then
    if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
    if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
    v_row := coalesce(v_new, v_old);

    insert into public.admin_activity_log (admin_id, table_name, record_id, action, diff)
    values (
      v_admin,
      tg_table_name,
      coalesce(v_row->>'id', v_row->>'key'),
      tg_op,
      jsonb_strip_nulls(jsonb_build_object('old', v_old, 'new', v_new))
    );
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- One-call setup for a table: updated_at trigger, optional audit trigger.
--   select public.attach_standard_triggers('public.my_table', true);
create or replace function public.attach_standard_triggers(p_table regclass, p_audit boolean default false)
returns void
language plpgsql
as $$
begin
  execute format('drop trigger if exists set_updated_at on %s', p_table);
  execute format(
    'create trigger set_updated_at before update on %s
       for each row execute function public.set_updated_at()', p_table);

  if p_audit then
    execute format('drop trigger if exists log_admin_activity on %s', p_table);
    execute format(
      'create trigger log_admin_activity after insert or update or delete on %s
         for each row execute function public.log_admin_activity()', p_table);
  end if;
end;
$$;

revoke execute on function public.attach_standard_triggers(regclass, boolean) from public, anon, authenticated;
