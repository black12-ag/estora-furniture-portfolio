
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  pct numeric(5,4) NOT NULL DEFAULT 0,
  free_shipping boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active promos" ON public.promo_codes FOR SELECT USING (active = true);
CREATE POLICY "admins read all promos" ON public.promo_codes FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert promos" ON public.promo_codes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "admins update promos" ON public.promo_codes FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete promos" ON public.promo_codes FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER promo_codes_updated BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.promo_codes (code, label, pct, free_shipping) VALUES
  ('ESTORA20','20% off your order',0.20,false),
  ('WELCOME10','10% welcome discount',0.10,false),
  ('FREESHIP','Free shipping on any order',0,true);

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins write settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('announcement', '{"text":"Free delivery on orders over $200 · Ends this week","enabled":true,"href":"/sale"}'::jsonb),
  ('hero', '{"title":"Modern living, made to last","subtitle":"Curated furniture that feels like home."}'::jsonb),
  ('contact', '{"email":"muay01111@l.com","phone":"","address":""}'::jsonb);
