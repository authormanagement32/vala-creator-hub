import { useEffect, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Centralized auth-gate for the Author Manager (Boss Panel).
 *
 * Every gated API call that comes back as 401/Unauthorized or 403/Forbidden
 * is funneled through here and mapped to a single visible UI state so walls
 * never render blank on auth failure.
 */
export type AuthGateState = "ok" | "signin" | "forbidden";

let current: AuthGateState = "ok";
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function setState(next: AuthGateState) {
  // Forbidden is stickier than signin (a real 403 shouldn't be masked by a
  // later missing-header 401 racing in from another background query).
  if (current === "forbidden" && next === "signin") return;
  if (current === next) return;
  current = next;
  emit();
}

/** Classify an unknown error/message into a gate state (or 'ok' if unrelated). */
export function classifyAuthError(err: unknown): AuthGateState {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  if (!msg) return "ok";
  if (/Forbidden/i.test(msg)) return "forbidden";
  if (/Unauthorized|No authorization header/i.test(msg)) return "signin";
  return "ok";
}

/** Report an error from anywhere (mutation onError, ad-hoc catch). */
export function reportAuthError(err: unknown): AuthGateState {
  const next = classifyAuthError(err);
  if (next !== "ok") setState(next);
  return next;
}

export function resetAuthGate() {
  setState("ok");
}

export function useAuthGate(): AuthGateState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

/**
 * Subscribe a QueryClient so every query/mutation error is classified once
 * and reflected in the shared gate state. Idempotent per client.
 */
const wired = new WeakSet<QueryClient>();
export function wireQueryClientAuthGate(qc: QueryClient) {
  if (wired.has(qc)) return () => {};
  wired.add(qc);
  const unsubQ = qc.getQueryCache().subscribe((ev) => {
    if (ev.type === "updated" && ev.action.type === "error") {
      reportAuthError(ev.action.error);
    }
  });
  const unsubM = qc.getMutationCache().subscribe((ev) => {
    if (ev.type === "updated" && ev.action.type === "error") {
      reportAuthError(ev.action.error);
    }
  });
  return () => {
    unsubQ();
    unsubM();
  };
}

/** React hook wrapper for wiring the current QueryClient. */
export function useAuthGateBridge(qc: QueryClient) {
  useEffect(() => wireQueryClientAuthGate(qc), [qc]);
}

/**
 * Banner shown on every Author Manager wall when the gate is not 'ok'.
 * Uses aria-live so screen readers announce the change, and stable
 * data-testid attributes so end-to-end tests can assert on it.
 */
export function AuthGateBanner() {
  const state = useAuthGate();
  if (state === "ok") return null;
  const signin = state === "signin";
  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="auth-gate-banner"
      data-state={state}
      className={
        "border-b px-4 py-3 text-sm " +
        (signin
          ? "border-hairline bg-surface-2 text-foreground"
          : "border-danger/40 bg-danger/10 text-foreground")
      }
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold" data-testid="auth-gate-title">
            {signin ? "Sign in required" : "Access denied"}
          </p>
          <p className="text-muted-foreground" data-testid="auth-gate-message">
            {signin
              ? "You need to sign in to load this data. Some panels will stay empty until you do."
              : "Your account doesn't have permission to view this data. Ask an administrator to grant the boss role."}
          </p>
        </div>
        {signin ? (
          <Link
            to="/auth"
            data-testid="auth-gate-signin"
            className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:opacity-90"
          >
            Sign in
          </Link>
        ) : (
          <Link
            to="/boss/author-manager/dashboard"
            data-testid="auth-gate-back"
            className="shrink-0 rounded-md border border-hairline px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2"
          >
            Back to dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
