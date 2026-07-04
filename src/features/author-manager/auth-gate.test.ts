import { describe, it, expect, beforeEach } from "vitest";
import {
  classifyAuthError,
  reportAuthError,
  resetAuthGate,
} from "./auth-gate";

// State snapshot uses the same window hook the app exposes so we test the
// public surface, not internals.
function currentState() {
  return (window as unknown as {
    __lovableAuthGate: { getState: () => "ok" | "signin" | "forbidden" | "rate_limited" };
  }).__lovableAuthGate.getState();
}

describe("auth-gate · classifyAuthError", () => {
  it.each([
    // --- signin (401 / missing header shapes) ---
    ["Unauthorized", "signin"],
    ["Unauthorized: No authorization header provided", "signin"],
    ["No authorization header provided", "signin"],
    ["unauthorized: token expired", "signin"],
    ["Error: UNAUTHORIZED request", "signin"],
    // --- forbidden (403 shapes) ---
    ["Forbidden", "forbidden"],
    ["Forbidden: boss role required", "forbidden"],
    ["forbidden — role missing", "forbidden"],
    // --- forbidden wins over signin when both words appear ---
    ["Unauthorized and Forbidden combined", "forbidden"],
    // --- unrelated errors stay 'ok' ---
    ["Network error", "ok"],
    ["ECONNREFUSED", "ok"],
    ["", "ok"],
  ])("maps %j -> %s", (msg, expected) => {
    expect(classifyAuthError(new Error(msg as string))).toBe(expected);
  });

  it("accepts a raw string as well as Error instances", () => {
    expect(classifyAuthError("Forbidden: nope")).toBe("forbidden");
    expect(classifyAuthError("Unauthorized")).toBe("signin");
  });

  it("returns 'ok' for null/undefined/non-error values", () => {
    expect(classifyAuthError(null)).toBe("ok");
    expect(classifyAuthError(undefined)).toBe("ok");
    expect(classifyAuthError(42)).toBe("ok");
    expect(classifyAuthError({})).toBe("ok");
  });
});

describe("auth-gate · reportAuthError state transitions", () => {
  beforeEach(() => resetAuthGate());

  it("starts at 'ok'", () => {
    expect(currentState()).toBe("ok");
  });

  it("a 401-shaped error moves to 'signin'", () => {
    reportAuthError(new Error("Unauthorized: No authorization header provided"));
    expect(currentState()).toBe("signin");
  });

  it("a 403-shaped error moves to 'forbidden'", () => {
    reportAuthError(new Error("Forbidden: boss role required"));
    expect(currentState()).toBe("forbidden");
  });

  it("forbidden is stickier than signin — later 401 does not downgrade", () => {
    reportAuthError(new Error("Forbidden: boss role required"));
    expect(currentState()).toBe("forbidden");
    reportAuthError(new Error("Unauthorized"));
    expect(currentState()).toBe("forbidden");
  });

  it("signin CAN be upgraded to forbidden", () => {
    reportAuthError(new Error("Unauthorized"));
    expect(currentState()).toBe("signin");
    reportAuthError(new Error("Forbidden"));
    expect(currentState()).toBe("forbidden");
  });

  it("unrelated errors do not change state", () => {
    reportAuthError(new Error("Network error"));
    expect(currentState()).toBe("ok");
    reportAuthError(new Error("Forbidden"));
    reportAuthError(new Error("Something else broke"));
    expect(currentState()).toBe("forbidden");
  });

  it("resetAuthGate returns to 'ok' from any state", () => {
    reportAuthError(new Error("Forbidden"));
    resetAuthGate();
    expect(currentState()).toBe("ok");
    reportAuthError(new Error("Unauthorized"));
    resetAuthGate();
    expect(currentState()).toBe("ok");
  });

  it("reportAuthError returns the classified state", () => {
    expect(reportAuthError(new Error("Unauthorized"))).toBe("signin");
    expect(reportAuthError(new Error("Forbidden"))).toBe("forbidden");
    expect(reportAuthError(new Error("nope"))).toBe("ok");
  });
});
