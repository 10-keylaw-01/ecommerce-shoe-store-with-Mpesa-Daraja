-- One-off repair for projects seeded before 008 set the token columns.
-- Run in Dashboard > SQL Editor. Fixes "Database error finding users" in the Auth API
-- and removes the two placeholder admins (your real admin stays).
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''), recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''), email_change = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''), phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''), reauthentication_token = coalesce(reauthentication_token, '')
where id::text like 'c1000000%' or id::text like 'ad000000%';

delete from public.admin_users where id::text like 'ad000000%';
delete from auth.users where id::text like 'ad000000%';
