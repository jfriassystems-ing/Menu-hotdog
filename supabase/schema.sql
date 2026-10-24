CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TABLE public.site_settings (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  site_name           TEXT NOT NULL,
  logo_url            TEXT,
  logo_public_id      TEXT,
  description         TEXT,
  contact_information JSONB DEFAULT '{}'::jsonb,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description     TEXT,
  image_url       TEXT,
  image_public_id TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description     TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url       TEXT,
  image_public_id TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_products_category_id    ON public.products(category_id);
CREATE INDEX idx_products_active_order   ON public.products(is_active, sort_order);
CREATE INDEX idx_products_available      ON public.products(is_active, is_available);
CREATE INDEX idx_categories_active_order ON public.categories(is_active, sort_order);

CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (id, site_name, logo_url, description, contact_information)
VALUES (
  1,
  'D''Ambiorix Hotdog S.R.L.',
  NULL,
  'Higiene, Calidad y Sabor!! Sabor que te hace volver.',
  '{"phone": "829-986-1701"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
