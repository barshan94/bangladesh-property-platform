-- Editable service-page content managed from the authenticated website admin workspace.
-- Public visitors can read published service descriptions; only active administrators can write.
CREATE TABLE IF NOT EXISTS public.service_pages (
  service_code text PRIMARY KEY CHECK (service_code IN (
    'title-and-record-review','buying-and-selling','transfer-and-mutation',
    'inheritance-and-succession','partition-and-co-ownership','property-disputes',
    'remote-property-support','property-tax-and-finance'
  )),
  long_description text NOT NULL DEFAULT '',
  youtube_url text,
  facebook_url text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_pages_youtube_url_check CHECK (
    youtube_url IS NULL OR (
      length(youtube_url) <= 500 AND
      youtube_url ~* '^https://(www\.)?(youtube\.com|youtu\.be)/'
    )
  ),
  CONSTRAINT service_pages_facebook_url_check CHECK (
    facebook_url IS NULL OR (
      length(facebook_url) <= 500 AND
      facebook_url ~* '^https://(www\.)?(facebook\.com|fb\.watch)/'
    )
  )
);

ALTER TABLE public.service_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read service page content" ON public.service_pages;
CREATE POLICY "Public can read service page content"
  ON public.service_pages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Administrators can insert service page content" ON public.service_pages;
CREATE POLICY "Administrators can insert service page content"
  ON public.service_pages FOR INSERT TO authenticated
  WITH CHECK (
    updated_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role_code = 'administrator'
        AND ur.revoked_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Administrators can update service page content" ON public.service_pages;
CREATE POLICY "Administrators can update service page content"
  ON public.service_pages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role_code = 'administrator'
      AND ur.revoked_at IS NULL
  ))
  WITH CHECK (
    updated_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role_code = 'administrator'
        AND ur.revoked_at IS NULL
    )
  );

REVOKE SELECT ON TABLE public.service_pages FROM anon, authenticated;
GRANT SELECT (service_code, long_description, youtube_url, facebook_url)
  ON TABLE public.service_pages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.service_pages TO authenticated;

INSERT INTO public.service_pages (service_code)
VALUES
  ('title-and-record-review'), ('buying-and-selling'), ('transfer-and-mutation'),
  ('inheritance-and-succession'), ('partition-and-co-ownership'),
  ('property-disputes'), ('remote-property-support'), ('property-tax-and-finance')
ON CONFLICT (service_code) DO NOTHING;
