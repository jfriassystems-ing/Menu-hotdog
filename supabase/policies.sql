ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_site_settings"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_active_categories"
  ON public.categories FOR SELECT TO anon, authenticated USING (is_active = TRUE);

CREATE POLICY "public_read_active_available_products"
  ON public.products FOR SELECT TO anon, authenticated USING (is_active = TRUE AND is_available = TRUE);

CREATE POLICY "admin_update_site_settings"
  ON public.site_settings FOR UPDATE TO authenticated USING (id = 1) WITH CHECK (id = 1);

CREATE POLICY "admin_insert_categories"
  ON public.categories FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "admin_update_categories"
  ON public.categories FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "admin_delete_categories"
  ON public.categories FOR DELETE TO authenticated USING (TRUE);

CREATE POLICY "admin_insert_products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "admin_update_products"
  ON public.products FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "admin_delete_products"
  ON public.products FOR DELETE TO authenticated USING (TRUE);
