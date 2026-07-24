
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage permissions" ON public.admin_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "admins read their own permissions" ON public.admin_permissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _resource text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'super_admin')
    OR (
      public.has_role(_user_id, 'admin')
      AND (
        NOT EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id)
        OR EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND resource = _resource)
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'super_admin');
$$;

CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (request_type IN ('refund','cancellation')),
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  created_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refund_requests TO authenticated;
GRANT ALL ON public.refund_requests TO service_role;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own refund requests" ON public.refund_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_admin_permission(auth.uid(), 'orders'));
CREATE POLICY "users create own refund requests" ON public.refund_requests FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()))
    OR public.has_admin_permission(auth.uid(), 'orders')
  );
CREATE POLICY "admins update refund requests" ON public.refund_requests FOR UPDATE TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'orders'))
  WITH CHECK (public.has_admin_permission(auth.uid(), 'orders'));
CREATE POLICY "admins delete refund requests" ON public.refund_requests FOR DELETE TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'orders'));
CREATE TRIGGER refund_requests_updated_at BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_table_idx ON public.audit_logs (table_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_audit_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_record_id text;
BEGIN
  BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  EXCEPTION WHEN OTHERS THEN v_email := NULL;
  END;
  IF TG_OP = 'DELETE' THEN
    v_record_id := (row_to_json(OLD)->>'id');
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, record_id, action, old_data)
      VALUES (v_uid, v_email, TG_TABLE_NAME, v_record_id, 'delete', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := (row_to_json(NEW)->>'id');
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, record_id, action, old_data, new_data)
      VALUES (v_uid, v_email, TG_TABLE_NAME, v_record_id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    v_record_id := (row_to_json(NEW)->>'id');
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, record_id, action, new_data)
      VALUES (v_uid, v_email, TG_TABLE_NAME, v_record_id, 'create', to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();
CREATE TRIGGER audit_promo_codes AFTER INSERT OR UPDATE OR DELETE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();
CREATE TRIGGER audit_site_settings AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();
CREATE TRIGGER audit_blog_posts AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin'::app_role
FROM public.user_roles
WHERE role = 'admin'
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT DO NOTHING;
