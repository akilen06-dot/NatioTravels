-- Natio — Database Webhook for report alerts, set up via SQL instead of the
-- Dashboard UI (Database → Webhooks has moved/is hard to find in some
-- dashboard versions, and its underlying `supabase_functions` schema is only
-- provisioned once you've used that UI at least once — since this project
-- hasn't, this uses the pg_net extension directly instead, which every
-- Supabase project has available).
--
-- BEFORE RUNNING: replace YOUR_REPORT_ALERT_SECRET below with the exact same
-- value you set via `supabase secrets set REPORT_ALERT_SECRET=...`. Never
-- commit this file to git with the real secret filled in — fill it in only
-- in the SQL Editor when you run it.
--
-- Run this ONCE in the SQL Editor. Safe to re-run (drops and recreates the
-- trigger) if you ever need to change the secret or the function URL.

create extension if not exists pg_net with schema extensions;

create or replace function trigger_report_alert()
returns trigger
language plpgsql
as $$
begin
  perform net.http_post(
    url := 'https://prjamttotolkgdirwhel.supabase.co/functions/v1/send-report-alert',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'reports',
      'record', to_jsonb(new)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-report-alert-secret', 'YOUR_REPORT_ALERT_SECRET'
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

drop trigger if exists send_report_alert on reports;
create trigger send_report_alert
  after insert on reports
  for each row execute function trigger_report_alert();
