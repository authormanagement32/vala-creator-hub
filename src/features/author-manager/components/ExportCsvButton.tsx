import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportAuditCsv, exportNotificationsCsv } from "@/lib/author-manager.functions";

type Source = "audit" | "notifications";

const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "bulk-publish",
  "bulk-suspend",
  "bulk-archive",
  "link",
  "security-scan",
  "release",
];
const SEVERITIES = ["info", "warn", "danger", "success"] as const;

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildFilename(opts: {
  source: Source;
  entity?: string;
  entityId?: string;
  from?: string;
  to?: string;
}): string {
  const parts: string[] = [opts.source];
  if (opts.entity) parts.push(opts.entity);
  if (opts.entityId) parts.push(opts.entityId.slice(0, 8));
  const range =
    opts.from && opts.to
      ? `${opts.from}_to_${opts.to}`
      : opts.from
      ? `from_${opts.from}`
      : opts.to
      ? `to_${opts.to}`
      : new Date().toISOString().slice(0, 10);
  parts.push(range);
  return parts.join("_").replace(/[^a-zA-Z0-9._-]/g, "-") + ".csv";
}

export function ExportCsvButton({
  source,
  entity,
  entityId,
  label,
}: {
  source: Source;
  entity?: string;
  entityId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auditFn = useServerFn(exportAuditCsv);
  const notifFn = useServerFn(exportNotificationsCsv);

  const rangeInvalid =
    !!from && !!to && new Date(from).getTime() > new Date(to).getTime();

  function toggle(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function run() {
    setBusy(true);
    try {
      const fromIso = from ? new Date(from).toISOString() : undefined;
      const toIso = to ? new Date(to + "T23:59:59").toISOString() : undefined;
      const res: any =
        source === "audit"
          ? await auditFn({
              data: {
                from: fromIso,
                to: toIso,
                entity,
                entityId,
                actions: actions.length ? actions : undefined,
                severities: severities.length ? (severities as any) : undefined,
              },
            })
          : await notifFn({
              data: {
                from: fromIso,
                to: toIso,
                severities: severities.length ? (severities as any) : undefined,
                unreadOnly: unreadOnly || undefined,
              },
            });
      if (!res.count) {
        toast.info("No rows for the selected filters.");
      } else {
        const name = buildFilename({ source, entity, entityId, from, to });
        downloadCsv(name, res.csv);
        toast.success(`Exported ${res.count} row${res.count === 1 ? "" : "s"}`);
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid={`export-${source}-btn`}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-hairline px-2 text-[11px] hover:bg-surface-2"
      >
        <Download className="h-3 w-3" /> {label ?? "Export CSV"}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          data-testid={`export-${source}-dialog`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-hairline bg-surface p-5 shadow-xl"
          >
            <div className="mb-3 text-sm font-semibold">
              Export {source === "audit" ? "audit events" : "notifications"}
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">From</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    data-testid="export-from"
                    className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">To</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    data-testid="export-to"
                    className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2"
                  />
                </label>
              </div>

              {source === "audit" && (
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Actions</div>
                  <div className="flex flex-wrap gap-1" data-testid="export-actions">
                    {AUDIT_ACTIONS.map((a) => {
                      const on = actions.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          data-testid={`export-action-${a}`}
                          data-active={on}
                          onClick={() => toggle(actions, setActions, a)}
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-mono transition ${
                            on
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-hairline text-muted-foreground hover:bg-surface-2"
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1 text-xs text-muted-foreground">Severity</div>
                <div className="flex flex-wrap gap-1">
                  {SEVERITIES.map((s) => {
                    const on = severities.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        data-testid={`export-severity-${s}`}
                        data-active={on}
                        onClick={() => toggle(severities, setSeverities, s)}
                        className={`rounded-full border px-2 py-0.5 text-[11px] capitalize transition ${
                          on
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-hairline text-muted-foreground hover:bg-surface-2"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {source === "notifications" && (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                    data-testid="export-unread-only"
                  />
                  Unread only
                </label>
              )}

              {(entity || entityId) && (
                <div className="rounded-md border border-hairline bg-surface-2 px-2 py-1.5 text-[11px] text-muted-foreground">
                  Scoped to {entity}
                  {entityId ? ` · ${entityId.slice(0, 8)}…` : ""}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={run}
                  data-testid="export-download-btn"
                  className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Exporting…" : "Download"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
