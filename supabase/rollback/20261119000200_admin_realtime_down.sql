-- ROLLBACK for 20261119000200_admin_realtime.sql
-- Live: supabase db query --linked -f supabase/rollback/20261119000200_admin_realtime_down.sql
begin;
alter publication supabase_realtime drop table public.orders;
delete from supabase_migrations.schema_migrations where version = '20261119000200';
commit;
