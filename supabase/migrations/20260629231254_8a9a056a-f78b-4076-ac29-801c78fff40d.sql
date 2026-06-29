
-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('boss','admin','reviewer','author');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ===== Products =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'software',
  type text NOT NULL DEFAULT 'software',
  version text NOT NULL DEFAULT '1.0.0',
  price numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  downloads bigint NOT NULL DEFAULT 0,
  rating numeric(3,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss read products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'boss'));
CREATE POLICY "boss write products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

CREATE TABLE public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version text NOT NULL,
  changelog text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  released_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_versions TO authenticated;
GRANT ALL ON public.product_versions TO service_role;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss rw product_versions" ON public.product_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- ===== Source repos =====
CREATE TABLE public.source_repos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  provider text NOT NULL DEFAULT 'github',
  url text NOT NULL,
  default_branch text NOT NULL DEFAULT 'main',
  latest_version text,
  build_status text NOT NULL DEFAULT 'unknown',
  last_build_at timestamptz,
  dependency_count int NOT NULL DEFAULT 0,
  outdated_dependencies int NOT NULL DEFAULT 0,
  vuln_critical int NOT NULL DEFAULT 0,
  vuln_high int NOT NULL DEFAULT 0,
  vuln_medium int NOT NULL DEFAULT 0,
  vuln_low int NOT NULL DEFAULT 0,
  license_valid boolean NOT NULL DEFAULT true,
  last_scan_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_repos TO authenticated;
GRANT ALL ON public.source_repos TO service_role;
ALTER TABLE public.source_repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss rw repos" ON public.source_repos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'boss')) WITH CHECK (public.has_role(auth.uid(),'boss'));

-- ===== Audit + Notifications =====
CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_entity_idx ON public.audit_events(entity, entity_id, created_at DESC);
CREATE INDEX audit_events_created_idx ON public.audit_events(created_at DESC);
GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss read audit" ON public.audit_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'boss'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users mark own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER set_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_repos_updated BEFORE UPDATE ON public.source_repos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
