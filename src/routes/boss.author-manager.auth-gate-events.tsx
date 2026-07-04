import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, RefreshCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { WALLS } from "@/features/author-manager/nav";
import {
  exportAuthGateEventsCsv,
  listAuthGateEvents,
  summarizeAuthGateEvents,
} from "@/lib/author-manager.functions";

export const Route = createFileRoute("/boss/author-manager/auth-gate-events")({
  head: () => ({
    meta: [
      { title: "Auth Gate Events — Author Manager" },
      {
        name: "description",
        content:
          "Admin reporting for auth-gate events across every wall: totals by day, wall route, and status code, with CSV export and timeframe filters.",
      },
    ],
  }),
  component: AuthGateEventsWall,
});

const STATES = [
  { value: "signin", label: "Sign in (401)" },
  { value: "forbidden", label: "Forbidden (403)" },
  { value: "rate_limited", label: "Rate limited (429)" },
] as const;

type TimeframeKey = "24h" | "7d" | "30d" | "90d" | "custom";
const TIMEFRAMES: { key: TimeframeKey; label: string; hours?: number }[] = [
  { key: "24h", label: "Last 24 hours", hours: 24 },
  { key: "7d", label: "Last 7 days", hours: 24 * 7 },
  { key: "30d", label: "Last 30 days", hours: 24 * 30 },
  { key: "90d", label: "Last 90 days", hours: 24 * 90 },
  { key: "custom", label: "Custom range" },
];

function computeRange(tf: TimeframeKey, from: string, to: string) {
  if (tf === "custom") {
    return {
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
    };
  }
  const preset = TIMEFRAMES.find((t) => t.key === tf);
  if (!preset?.hours) return {};
  const now = new Date();
  const start = new Date(now.getTime() - preset.hours * 3600 * 1000);
  return { from: start.toISOString(), to: now.toISOString() };
}

function downloadCsv(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function AuthGateEventsWall() {
  const [tf, setTf] = useState<TimeframeKey>("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [wallRoute, setWallRoute] = useState("");
  const [exporting, setExporting] = useState(false);

  const range = useMemo(() => computeRange(tf, from, to), [tf, from, to]);
  const rangeInvalid =
    tf === "custom" && !!from && !!to && new Date(from).getTime() > new Date(to).getTime();

  const filter = useMemo(
    () => ({
      from: rangeInvalid ? undefined : range.from,
      to: rangeInvalid ? undefined : range.to,
      states: states.length ? (states as any) : undefined,
      wallRoute: wallRoute || undefined,
    }),
    [range, states, wallRoute, rangeInvalid],
  );

  const listFn = useServerFn(listAuthGateEvents);
  const summarizeFn = useServerFn(summarizeAuthGateEvents);
  const exportFn = useServerFn(exportAuthGateEventsCsv);

  const summary = useQuery({
    queryKey: ["auth-gate-summary", filter],
    queryFn: () => summarizeFn({ data: filter }),
    enabled: !rangeInvalid,
  });
  const list = useQuery({
    queryKey: ["auth-gate-list", filter],
    queryFn: () => listFn({ data: { ...filter, limit: 200 } }),
    enabled: !rangeInvalid,
  });

  function toggleState(v: string) {
    setStates((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }

  async function runExport() {
    if (rangeInvalid) {
      toast.error("Fix the invalid date range before exporting.");
      return;
    }
    setExporting(true);
    try {
      const res = await exportFn({ data: filter });
      const label =
        tf === "custom" ? `${from || "any"}_to_${to || "any"}` : tf;
      const name = `auth-gate-events_${label}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCsv(name, res.csv);
      if (res.count) toast.success(`Exported ${res.count} event(s)`);
      else toast.info("No events for the selected filters — exported headers only.");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const disabledReason = rangeInvalid
    ? "Fix the invalid date range before exporting."
    : exporting
      ? "Export in progress…"
      : null;

  const kpi = summary.data;
  const routeOptions = WALLS.map((w) => w.to);

  return (
    <WallShell
      title="Auth Gate Events"
      subtitle="Every 401 / 403 / 429 surfaced by the auth-gate, grouped by day, wall route, and status."
      count={kpi?.total ?? undefined}
      actions={
        <>
          <button
            onClick={() => {
              summary.refetch();
              list.refetch();
            }}
            className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
          <span title={disabledReason ?? "Export current filters to CSV"}>
            <button
              onClick={runExport}
              disabled={!!disabledReason}
              data-testid="auth-gate-export-btn"
              className="flex h-9 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </span>
        </>
      }
    >
      {/* Filter bar */}
      <div className="mb-4 rounded-lg border border-hairline bg-card p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Timeframe</span>
            <select
              value={tf}
              onChange={(e) => setTf(e.target.value as TimeframeKey)}
              className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm"
              data-testid="timeframe-select"
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {tf === "custom" && (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  aria-invalid={rangeInvalid || undefined}
                  aria-describedby={rangeInvalid ? "auth-gate-range-error" : undefined}
                  className={`h-9 rounded-md border bg-surface-2 px-2 text-sm ${rangeInvalid ? "border-danger" : "border-hairline"}`}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-invalid={rangeInvalid || undefined}
                  aria-describedby={rangeInvalid ? "auth-gate-range-error" : undefined}
                  className={`h-9 rounded-md border bg-surface-2 px-2 text-sm ${rangeInvalid ? "border-danger" : "border-hairline"}`}
                />
              </label>
            </>
          )}
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Wall route</span>
            <select
              value={wallRoute}
              onChange={(e) => setWallRoute(e.target.value)}
              className="h-9 min-w-[220px] rounded-md border border-hairline bg-surface-2 px-2 text-sm"
            >
              <option value="">All routes</option>
              {routeOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">State</span>
            <div className="flex flex-wrap gap-1">
              {STATES.map((s) => {
                const active = states.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleState(s.value)}
                    className={`h-9 rounded-md border px-2.5 text-xs ${
                      active
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-hairline bg-surface-2 hover:bg-surface"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {rangeInvalid && (
          <p
            id="auth-gate-range-error"
            role="alert"
            aria-live="polite"
            className="mt-2 text-xs text-danger"
          >
            Invalid date range: "from" must be on or before "to".
          </p>
        )}
      </div>

      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Total events" value={kpi?.total ?? 0} loading={summary.isLoading} />
        <KpiTile
          label="401 · sign in"
          value={kpi?.byStatus.find((s) => s.status_code === "401")?.count ?? 0}
          loading={summary.isLoading}
        />
        <KpiTile
          label="403 · forbidden"
          value={kpi?.byStatus.find((s) => s.status_code === "403")?.count ?? 0}
          loading={summary.isLoading}
        />
        <KpiTile
          label="429 · rate limited"
          value={kpi?.byStatus.find((s) => s.status_code === "429")?.count ?? 0}
          loading={summary.isLoading}
        />
      </div>

      {/* Grouped summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard title="By day" items={kpi?.byDay.map((d) => ({ label: d.day, count: d.count })) ?? []} loading={summary.isLoading} />
        <SummaryCard title="By wall route" items={kpi?.byRoute.map((r) => ({ label: r.wall_route, count: r.count })) ?? []} loading={summary.isLoading} />
        <SummaryCard title="By status code" items={kpi?.byStatus.map((s) => ({ label: String(s.status_code), count: s.count })) ?? []} loading={summary.isLoading} />
      </div>

      {/* Grouped breakdown */}
      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-card">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
          <div className="text-sm font-semibold">Grouped breakdown — day × wall × state × status</div>
          <div className="text-xs text-muted-foreground">{kpi?.rows.length ?? 0} group(s)</div>
        </div>
        <div className="grid grid-cols-[110px_1fr_140px_90px_80px] gap-3 border-b border-hairline bg-surface-2 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div>Day</div>
          <div>Wall route</div>
          <div>State</div>
          <div>Status</div>
          <div className="text-right">Count</div>
        </div>
        <div className="max-h-[420px] overflow-auto">
          {summary.isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr_140px_90px_80px] gap-3 border-t border-hairline px-3 py-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-3 animate-pulse rounded bg-surface-2" />
                ))}
              </div>
            ))
          ) : (kpi?.rows.length ?? 0) === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No auth-gate events in range"
                description="Adjust the timeframe or filters. Events are recorded whenever the sign-in, access-denied, or rate-limit banner appears."
              />
            </div>
          ) : (
            kpi!.rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[110px_1fr_140px_90px_80px] gap-3 border-t border-hairline px-3 py-2 text-[13px]"
              >
                <div className="text-muted-foreground">{r.day}</div>
                <div className="truncate">{r.wall_route}</div>
                <div>
                  <StateBadge state={r.state} />
                </div>
                <div className="text-muted-foreground">{r.status_code ?? "—"}</div>
                <div className="text-right font-medium">{r.count}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent raw events */}
      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-card">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
          <div className="text-sm font-semibold">Recent events</div>
          <div className="text-xs text-muted-foreground">
            {list.data?.rows.length ?? 0} of {list.data?.total ?? 0}
          </div>
        </div>
        <div className="grid grid-cols-[170px_1fr_130px_70px_1fr] gap-3 border-b border-hairline bg-surface-2 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div>Occurred at</div>
          <div>Wall route</div>
          <div>State</div>
          <div>Status</div>
          <div>Actor</div>
        </div>
        <div className="max-h-[420px] overflow-auto">
          {list.isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[170px_1fr_130px_70px_1fr] gap-3 border-t border-hairline px-3 py-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-3 animate-pulse rounded bg-surface-2" />
                ))}
              </div>
            ))
          ) : (list.data?.rows.length ?? 0) === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <ShieldAlert className="mx-auto mb-2 h-6 w-6 opacity-60" />
              Nothing to show.
            </div>
          ) : (
            list.data!.rows.map((r: any) => (
              <div key={r.id} className="grid grid-cols-[170px_1fr_130px_70px_1fr] gap-3 border-t border-hairline px-3 py-2 text-[13px]">
                <div className="text-muted-foreground">{new Date(r.occurred_at).toLocaleString()}</div>
                <div className="truncate">{r.wall_route}</div>
                <div><StateBadge state={r.state} /></div>
                <div className="text-muted-foreground">{r.status_code ?? "—"}</div>
                <div className="truncate text-muted-foreground">{r.email ?? r.user_id ?? "anonymous"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </WallShell>
  );
}

function KpiTile({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-lg border border-hairline bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {loading ? <span className="inline-block h-6 w-16 animate-pulse rounded bg-surface-2" /> : value.toLocaleString()}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  items,
  loading,
}: {
  title: string;
  items: { label: string; count: number }[];
  loading: boolean;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0) || 1;
  return (
    <div className="rounded-lg border border-hairline bg-card">
      <div className="border-b border-hairline px-3 py-2 text-sm font-semibold">{title}</div>
      <div className="max-h-[220px] overflow-auto p-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-2 h-6 animate-pulse rounded bg-surface-2" />
          ))
        ) : items.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">No data.</div>
        ) : (
          items.slice(0, 12).map((it) => (
            <div key={it.label} className="mb-1 flex items-center gap-2 px-1 py-1 text-[12px]">
              <div className="w-24 shrink-0 truncate text-muted-foreground">{it.label}</div>
              <div className="relative h-2 flex-1 overflow-hidden rounded bg-surface-2">
                <div
                  className="absolute inset-y-0 left-0 bg-brand"
                  style={{ width: `${(it.count / max) * 100}%` }}
                />
              </div>
              <div className="w-10 shrink-0 text-right font-medium tabular-nums">{it.count}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const cls =
    state === "forbidden"
      ? "border-danger/40 bg-danger/10 text-foreground"
      : state === "rate_limited"
        ? "border-hairline bg-surface-2 text-muted-foreground"
        : "border-hairline bg-surface-2 text-foreground";
  return (
    <span className={`inline-flex h-5 items-center rounded border px-2 text-[11px] ${cls}`}>
      {state}
    </span>
  );
}
