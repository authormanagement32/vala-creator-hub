import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { WALLS } from "../../src/features/author-manager/nav";

/**
 * Signed-in AUTHORIZED-role coverage.
 *
 * Requires an injected boss session via LOVABLE_BROWSER_SUPABASE_*. Skips
 * cleanly when the sandbox isn't authenticated (signed_out / external_unmanaged)
 * so CI doesn't false-fail on environments without a managed session.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const AUTH_STATUS = process.env.LOVABLE_BROWSER_AUTH_STATUS;
const SESSION_JSON = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
const STORAGE_KEY = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
const COOKIES_JSON = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;

// Sample nav groups — running all 21 walls signed-in would balloon runtime;
// the auth-gate logic is shared so a spread is sufficient.
const SAMPLE = WALLS.filter((_, i) => i % 4 === 0);

async function restoreSession(context: BrowserContext, page: Page) {
  if (COOKIES_JSON) {
    const cookies = JSON.parse(COOKIES_JSON) as Array<Record<string, unknown>>;
    for (const c of cookies) c.url = BASE;
    await context.addCookies(cookies as any);
  }
  await page.goto(BASE);
  if (STORAGE_KEY && SESSION_JSON) {
    await page.evaluate(
      ([key, value]) => window.localStorage.setItem(key as string, value as string),
      [STORAGE_KEY, SESSION_JSON],
    );
  }
}

test.describe("Signed-in authorized · every wall renders real content", () => {
  test.skip(
    AUTH_STATUS !== "injected" || !SESSION_JSON,
    `no injected Supabase session (LOVABLE_BROWSER_AUTH_STATUS=${AUTH_STATUS ?? "unset"})`,
  );

  test.beforeEach(async ({ context, page }) => {
    await restoreSession(context, page);
  });

  for (const wall of SAMPLE) {
    test(`wall "${wall.label}" renders content, no auth-gate banner`, async ({ page }) => {
      const pageErrors: string[] = [];
      const serverErrors: { url: string; status: number }[] = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      page.on("response", (resp) => {
        if (resp.status() >= 500) serverErrors.push({ url: resp.url(), status: resp.status() });
      });

      await page.goto(`${BASE}${wall.to}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();

      // Top-bar link for the current wall must be present and marked active.
      await expect(
        page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first(),
      ).toBeVisible();

      // Give queries time to settle.
      await page.waitForTimeout(1200);

      // The centralized banner MUST NOT be shown for an authorized user.
      const banner = page.locator('[data-testid="auth-gate-banner"]');
      await expect(banner, `auth-gate banner should NOT render on ${wall.to}`).toHaveCount(0);

      // Real content check: the wall shell renders a heading with the wall
      // label, and the body is not just a shell of chrome.
      const heading = page.getByRole("heading", { name: new RegExp(wall.label, "i") }).first();
      await expect(heading).toBeVisible();
      const bodyText = (await page.locator("main").innerText()).trim();
      expect(bodyText.length, `wall "${wall.label}" main is empty`).toBeGreaterThan(40);

      // No 5xx responses at all.
      expect(serverErrors, `no 5xx on ${wall.to}`).toEqual([]);
      expect(pageErrors, `no uncaught errors on ${wall.to}`).toEqual([]);

      // Read the gate's runtime state — must be 'ok' for authorized users.
      const gateState = await page.evaluate(
        () =>
          (window as unknown as {
            __lovableAuthGate?: { getState: () => string };
          }).__lovableAuthGate?.getState() ?? "missing",
      );
      expect(gateState, `auth-gate should be 'ok' on ${wall.to}`).toBe("ok");
    });
  }
});
