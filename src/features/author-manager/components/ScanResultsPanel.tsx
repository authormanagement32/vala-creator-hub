import { useMemo } from "react";
import { ShieldAlert, ShieldCheck, Package } from "lucide-react";
import { fmtDate } from "@/features/author-manager/format";

export type ScanFinding = {
  id?: string;
  rule?: string;
  severity: "critical" | "high" | "medium" | "low" | string;
  dependency?: string;
  version?: string;
  summary?: string;
  cve?: string;
  fixed_in?: string;
};

type Props = {
  findings: ScanFinding[];
  lastScanAt: string | null;
};

const SEV_ORDER = ["critical", "high", "medium", "low"] as const;
const SEV_TONE: Record<string, string> = {
  critical: "bg-danger/15 text-danger border-danger/30",
  high: "bg-danger/10 text-danger border-danger/20",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-hairline",
};

export function ScanResultsPanel({ findings, lastScanAt }: Props) {
  const breakdown = useMemo(() => {
    const b: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      const k = (f.severity ?? "").toLowerCase();
      if (k in b) b[k] += 1;
    }
    return b;
  }, [findings]);

  const affectedDeps = useMemo(() => {
    const m = new Map<string, { count: number; worst: string }>();
    for (const f of findings) {
      if (!f.dependency) continue;
      const cur = m.get(f.dependency) ?? { count: 0, worst: "low" };
      cur.count += 1;
      if (SEV_ORDER.indexOf(f.severity as any) >= 0 && SEV_ORDER.indexOf(f.severity as any) < SEV_ORDER.indexOf(cur.worst as any)) {
        cur.worst = f.severity;
      }
      m.set(f.dependency, cur);
    }
    return Array.from(m.entries()).map(([dep, v]) => ({ dep, ...v }));
  }, [findings]);

  const total = findings.length;

  if (!lastScanAt && total === 0) {
    return (
      <div className="rounded-md border border-dashed border-hairline p-4 text-center text-xs text-muted-foreground">
        No scan has been run yet. Click "Run security scan" to populate findings.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="scan-results-panel">
      <div className="flex items-center justify-between rounded-md border border-hairline bg-surface-2 p-2.5">
        <div className="flex items-center gap-2 text-xs">
          {total === 0 ? (
            <>
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="font-medium text-success">Clean</span>
              <span className="text-muted-foreground">— no findings</span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4 text-danger" />
              <span className="font-medium">{total} finding{total === 1 ? "" : "s"}</span>
              <span className="text-muted-foreground">across {affectedDeps.length} dependenc{affectedDeps.length === 1 ? "y" : "ies"}</span>
            </>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">Scanned {fmtDate(lastScanAt)}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {SEV_ORDER.map((s) => (
          <div key={s} className={`rounded-md border p-2 text-center ${SEV_TONE[s]}`}>
            <div className="text-base font-semibold">{breakdown[s]}</div>
            <div className="text-[10px] uppercase tracking-wide">{s}</div>
          </div>
        ))}
      </div>

      {affectedDeps.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Affected dependencies</div>
          <ul className="space-y-1">
            {affectedDeps.slice(0, 8).map((d) => (
              <li key={d.dep} className="flex items-center justify-between rounded-md border border-hairline bg-surface-2 px-2 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 font-mono"><Package className="h-3 w-3 text-muted-foreground" />{d.dep}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${SEV_TONE[d.worst] ?? SEV_TONE.low}`}>{d.worst} · {d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {total > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Findings ({total})</div>
          <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {findings.map((f, i) => (
              <li key={f.id ?? `${f.rule}-${i}`} className="rounded-md border border-hairline bg-surface-2 p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{f.rule ?? f.cve ?? "Finding"}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${SEV_TONE[(f.severity ?? "low").toLowerCase()] ?? SEV_TONE.low}`}>{f.severity}</span>
                </div>
                {f.summary && <div className="mt-1 text-muted-foreground">{f.summary}</div>}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  {f.dependency && <span>dep: <span className="font-mono">{f.dependency}{f.version ? `@${f.version}` : ""}</span></span>}
                  {f.cve && <span>{f.cve}</span>}
                  {f.fixed_in && <span>fixed in {f.fixed_in}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
