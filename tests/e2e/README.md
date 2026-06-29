# End-to-end tests

Playwright tests for the Boss Panel · Author Manager.

## Install

```bash
bun add -D @playwright/test
bunx playwright install chromium
```

## Run

```bash
# Default: against http://localhost:8080 (Vite dev server)
bunx playwright test

# Or against the deployed preview / production URL
PLAYWRIGHT_BASE_URL=https://your-app.lovable.app bunx playwright test
```

## What it covers

`boss-author-manager.spec.ts`
- Signs up a fresh user (auto-confirm email is on)
- Claims the boss role (skipped if a boss already exists)
- **Products:** create → publish (update) → delete, asserts a sonner toast
  and a matching `audit_events` row (`create`, `update`, `delete`) in the
  right-panel audit timeline
- **Source Code:** link repo → run security scan → release v1.0.0, asserts
  toasts and `audit_events` rows (`link`, `security-scan`, `release`) plus
  the scan results details panel

Findings rendered by `ScanResultsPanel` come from `source_repos.scan_findings`
populated by an external scanner integration. The test only asserts the
panel mounts and the audit/notification side-effects fire — it does not
hardcode finding counts.
