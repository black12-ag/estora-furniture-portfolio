
-- Inventory adjustment log
CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant text,
  actor_id uuid,
  actor_email text,
  delta integer NOT NULL,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_adjustments TO authenticated;
GRANT ALL ON public.inventory_adjustments TO service_role;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read adjustments" ON public.inventory_adjustments FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'inventory'));
CREATE POLICY "admins insert adjustments" ON public.inventory_adjustments FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_permission(auth.uid(), 'inventory') AND actor_id = auth.uid());
CREATE INDEX inventory_adjustments_product_idx ON public.inventory_adjustments (product_id, created_at DESC);
CREATE INDEX inventory_adjustments_created_idx ON public.inventory_adjustments (created_at DESC);

-- In-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- Refund request notification trigger
CREATE OR REPLACE FUNCTION public.notify_refund_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order text;
  v_link text;
  v_title text;
  v_body text;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT order_number INTO v_order FROM public.orders WHERE id = NEW.order_id;
  v_link := '/account/orders/' || NEW.order_id::text;

  IF TG_OP = 'INSERT' THEN
    v_title := 'Request received';
    v_body := 'We received your ' || NEW.request_type || ' request for order ' || COALESCE(v_order, '') || '. We will review it shortly.';
    INSERT INTO public.notifications(user_id, kind, title, body, link)
      VALUES (NEW.user_id, 'refund_' || NEW.status, v_title, v_body, v_link);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'approved' THEN
      v_title := NEW.request_type || ' approved';
      v_body := 'Good news — your ' || NEW.request_type || ' for order ' || COALESCE(v_order, '') || ' was approved.'
        || CASE WHEN COALESCE(NEW.admin_note, '') <> '' THEN ' Note: ' || NEW.admin_note ELSE '' END;
    ELSIF NEW.status = 'rejected' THEN
      v_title := NEW.request_type || ' declined';
      v_body := 'Your ' || NEW.request_type || ' request for order ' || COALESCE(v_order, '') || ' was declined.'
        || CASE WHEN COALESCE(NEW.admin_note, '') <> '' THEN ' Note: ' || NEW.admin_note ELSE '' END;
    ELSE
      RETURN NEW;
    END IF;
    INSERT INTO public.notifications(user_id, kind, title, body, link)
      VALUES (NEW.user_id, 'refund_' || NEW.status, v_title, v_body, v_link);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER refund_requests_notify_ai AFTER INSERT ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_refund_change();
CREATE TRIGGER refund_requests_notify_au AFTER UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_refund_change();
