
CREATE TABLE public.auth_gate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NULL,
  email TEXT NULL,
  wall_route TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('signin','forbidden','rate_limited')),
  status_code INT NULL,
  message TEXT NULL,
  user_agent TEXT NULL,
  ip TEXT NULL
);

CREATE INDEX auth_gate_events_occurred_at_idx ON public.auth_gate_events (occurred_at DESC);
CREATE INDEX auth_gate_events_wall_route_idx ON public.auth_gate_events (wall_route);
CREATE INDEX auth_gate_events_state_idx ON public.auth_gate_events (state);

GRANT SELECT ON public.auth_gate_events TO authenticated;
GRANT ALL ON public.auth_gate_events TO service_role;

ALTER TABLE public.auth_gate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boss can read auth gate events"
  ON public.auth_gate_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'boss'));
