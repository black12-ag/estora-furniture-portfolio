
-- 1) Async CSV export jobs for audit_logs (and future large exports)
CREATE TABLE public.audit_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_email text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  row_count integer,
  file_path text,
  file_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.audit_export_jobs TO authenticated;
GRANT ALL ON public.audit_export_jobs TO service_role;
ALTER TABLE public.audit_export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view export jobs" ON public.audit_export_jobs
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE INDEX audit_export_jobs_created_at_idx ON public.audit_export_jobs (created_at DESC);

-- 2) Admin impersonation audit
CREATE TABLE public.impersonation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  target_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.impersonation_events TO authenticated;
GRANT ALL ON public.impersonation_events TO service_role;
ALTER TABLE public.impersonation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view impersonation events" ON public.impersonation_events
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE INDEX impersonation_events_created_at_idx ON public.impersonation_events (created_at DESC);
