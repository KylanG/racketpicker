-- RP-19 fix: the project was created with "Automatically expose new tables" off, so
-- tables owned by postgres give service_role no privileges. service_role bypasses RLS
-- but still needs table grants; the feed import (secret key) failed with
-- "permission denied for table feed_sources".
-- anon/authenticated keep only the explicit SELECT grants from earlier migrations.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Same for every table/sequence created later by postgres (our migrations).
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;
