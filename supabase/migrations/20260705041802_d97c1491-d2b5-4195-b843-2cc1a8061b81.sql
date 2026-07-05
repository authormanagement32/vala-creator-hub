
-- Enums
DO $$ BEGIN
  CREATE TYPE public.author_status AS ENUM ('verified','pending','suspended','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.application_stage AS ENUM ('registration','identity','kyc','portfolio','interview','agreement','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- authors
CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  company text,
  country text,
  status public.author_status NOT NULL DEFAULT 'pending',
  verified boolean NOT NULL DEFAULT false,
  products_count integer NOT NULL DEFAULT 0,
  rating numeric(3,2),
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  royalties numeric(14,2) NOT NULL DEFAULT 0,
  health_score integer NOT NULL DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boss can read authors" ON public.authors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss can insert authors" ON public.authors FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss can update authors" ON public.authors FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'boss')) WITH CHECK (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss can delete authors" ON public.authors FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

CREATE TRIGGER trg_authors_updated_at BEFORE UPDATE ON public.authors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- applications
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  email text NOT NULL,
  country text,
  stage public.application_stage NOT NULL DEFAULT 'registration',
  reviewer_email text,
  notes text,
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boss can read applications" ON public.applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss can insert applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss can update applications" ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'boss')) WITH CHECK (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss can delete applications" ON public.applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));

CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_applications_stage ON public.applications(stage);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON public.applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_authors_status ON public.authors(status);
CREATE INDEX IF NOT EXISTS idx_authors_updated_at ON public.authors(updated_at DESC);
