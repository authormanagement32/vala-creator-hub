export const fmtNumber = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US").format(n);

/**
 * Money is stored with 2 decimals in the database (numeric(12,2)), so the UI
 * shows cents by default. Pass `compact` for KPI tiles where whole units read
 * better (e.g. "$1.2M").
 */
export const fmtMoney = (
  n: number | null | undefined,
  currency = "USD",
  opts: { compact?: boolean } = {},
) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        ...(opts.compact
          ? { notation: "compact", maximumFractionDigits: 1 }
          : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      }).format(n);

export const fmtPercent = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toFixed(1)}%`;

/** Stable, unambiguous date: 07 Aug 2026 */
export const fmtDate = (iso: string | null | undefined) =>
  iso == null
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(iso));

/** Date + 24h time + timezone abbreviation: 07 Aug 2026, 23:41 UTC */
export const fmtDateTime = (iso: string | null | undefined) =>
  iso == null
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).format(new Date(iso));

/** Machine-readable value for <time dateTime=…> pairing with fmtDateTime. */
export const isoAttr = (iso: string | null | undefined) => iso ?? undefined;
