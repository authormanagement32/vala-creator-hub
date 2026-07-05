import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reactive "is there a Supabase session" flag. Used to gate authenticated
 * server-fn queries so we don't fire guaranteed-401 requests when signed out.
 * The central auth-gate still handles late 401s; this just prevents needless
 * error noise on initial mount for signed-out users.
 */
export function useHasSession(): boolean | null {
  const [has, setHas] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setHas(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHas(!!session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return has;
}
