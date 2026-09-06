-- Natio — Database Webhook for report alerts, set up via SQL instead of the
-- Dashboard UI (Database → Webhooks has moved/is hard to find in some
-- dashboard versions — this does the exact same thing).
--
-- BEFORE RUNNING: replace YOUR_REPORT_ALERT_SECRET below with the exact same
-- value you set via `supabase secrets set REPORT_ALERT_SECRET=...`. Never
-- commit this file to git with the real secret filled in — fill it in only
-- in the SQL Editor when you run it.
--
-- Run this ONCE in the SQL Editor. Safe to re-run (drops and recreates the
-- trigger) if you ever need to change the secret or the function URL.

create extension if not exists pg_net with schema extensions;

drop trigger if exists send_report_alert on reports;
create trigger send_report_alert
  after insert on reports
  for each row execute function supabase_functions.http_request(
    'https://prjamttotolkgdirwhel.supabase.co/functions/v1/send-report-alert',
    'POST',
    '{"Content-Type":"application/json","x-report-alert-secret":"YOUR_REPORT_ALERT_SECRET"}',
    '{}',
    '5000'
  );
