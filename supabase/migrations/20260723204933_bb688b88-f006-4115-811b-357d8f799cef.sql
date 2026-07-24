
CREATE TABLE public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL,
  ref_table text,
  ref_id uuid,
  channel text NOT NULL CHECK (channel IN ('inapp','email')),
  status text NOT NULL CHECK (status IN ('queued','sent','failed','skipped')),
  subject text,
  from_addr text,
  to_addr text,
  body_preview text,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification events"
  ON public.notification_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can insert notification events"
  ON public.notification_events FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can update notification events"
  ON public.notification_events FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

CREATE INDEX notification_events_user_idx ON public.notification_events(user_id, created_at DESC);
CREATE INDEX notification_events_ref_idx ON public.notification_events(ref_table, ref_id);
CREATE INDEX notification_events_status_idx ON public.notification_events(channel, status, created_at DESC);

-- Update the refund trigger to also log delivery events per channel.
CREATE OR REPLACE FUNCTION public.notify_refund_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order text;
  v_email text;
  v_link text;
  v_title text;
  v_body text;
  v_kind text;
  v_prefs record;
  v_email_active boolean;
  v_setting jsonb;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  SELECT order_number, email INTO v_order, v_email FROM public.orders WHERE id = NEW.order_id;
  v_link := '/account/orders/' || NEW.order_id::text;

  IF TG_OP = 'INSERT' THEN
    v_title := 'Request received';
    v_body := 'We received your ' || NEW.request_type || ' request for order ' || COALESCE(v_order, '') || '. We will review it shortly.';
    v_kind := 'refund_' || NEW.status;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
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
    v_kind := 'refund_' || NEW.status;
  ELSE
    RETURN NEW;
  END IF;

  SELECT refunds_inapp, refunds_email, cancellations_inapp, cancellations_email
    INTO v_prefs
    FROM public.notification_preferences WHERE user_id = NEW.user_id;

  SELECT value INTO v_setting FROM public.site_settings WHERE key = 'email_sending_active';
  v_email_active := COALESCE((v_setting)::text::boolean, false);

  -- In-app: create bell notification + event log entry
  IF COALESCE(
       CASE WHEN NEW.request_type = 'cancellation' THEN v_prefs.cancellations_inapp
            ELSE v_prefs.refunds_inapp END,
       true) THEN
    INSERT INTO public.notifications(user_id, kind, title, body, link)
      VALUES (NEW.user_id, v_kind, v_title, v_body, v_link);
    INSERT INTO public.notification_events(user_id, kind, ref_table, ref_id, channel, status, subject, to_addr, body_preview, sent_at)
      VALUES (NEW.user_id, v_kind, 'refund_requests', NEW.id, 'inapp', 'sent', v_title, v_email, LEFT(v_body, 240), now());
  ELSE
    INSERT INTO public.notification_events(user_id, kind, ref_table, ref_id, channel, status, subject, to_addr, body_preview, error)
      VALUES (NEW.user_id, v_kind, 'refund_requests', NEW.id, 'inapp', 'skipped', v_title, v_email, LEFT(v_body, 240), 'user preference off');
  END IF;

  -- Email: log queued (if sending active + user opted in) or skipped
  IF COALESCE(
       CASE WHEN NEW.request_type = 'cancellation' THEN v_prefs.cancellations_email
            ELSE v_prefs.refunds_email END,
       true) THEN
    IF v_email_active THEN
      INSERT INTO public.notification_events(user_id, kind, ref_table, ref_id, channel, status, subject, from_addr, to_addr, body_preview)
        VALUES (NEW.user_id, v_kind, 'refund_requests', NEW.id, 'email', 'queued', v_title, 'notify@estora', v_email, LEFT(v_body, 240));
    ELSE
      INSERT INTO public.notification_events(user_id, kind, ref_table, ref_id, channel, status, subject, to_addr, body_preview, error)
        VALUES (NEW.user_id, v_kind, 'refund_requests', NEW.id, 'email', 'skipped', v_title, v_email, LEFT(v_body, 240), 'email sender not active');
    END IF;
  ELSE
    INSERT INTO public.notification_events(user_id, kind, ref_table, ref_id, channel, status, subject, to_addr, body_preview, error)
      VALUES (NEW.user_id, v_kind, 'refund_requests', NEW.id, 'email', 'skipped', v_title, v_email, LEFT(v_body, 240), 'user preference off');
  END IF;

  RETURN NEW;
END;
$function$;
