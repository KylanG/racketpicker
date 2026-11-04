-- rls_auto_enable() is the event-trigger helper from the dashboard's "automatic RLS" option.
-- It must not be callable through the Data API (/rest/v1/rpc). Event triggers still run it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
