-- =====================================================================
-- ROLLBACK for PHASE A (20261118000100_lockdown_add_functions.sql)
-- Removes the new server functions. Run phase B's rollback FIRST if
-- phase B was applied. Only use together with redeploying the OLD website
-- (the new website needs these functions).
--
-- Live:  supabase db query --linked -f supabase/rollback/20261118000100_lockdown_add_functions_down.sql
-- =====================================================================
begin;

drop function if exists public.place_order(jsonb, jsonb, text, text, text, text, text, text);
drop function if exists public.check_voucher(text, numeric);
drop function if exists public.track_order(text);
drop function if exists public.check_rewards_card(text);
drop function if exists public.rewards_login(text, text);
drop function if exists public.activate_rewards_card(text, text, text, text, text);
drop function if exists public.public_feedback_ratings();
drop table    if exists public.rewards_catalog;
drop function if exists public.is_admin();

delete from supabase_migrations.schema_migrations where version = '20261118000100';

commit;
