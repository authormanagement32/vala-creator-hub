import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportAuditCsv, exportNotificationsCsv } from "@/lib/author-manager.functions";

type Source = "audit" | "notifications";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
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
  const [busy, setBusy] = useState(false);
  const auditFn = useServerFn(exportAuditCsv);
  const notifFn = useServerFn(exportNotificationsCsv);

  async function run() {
    setBusy(true);
    try {
      const fromIso = from ? new Date(from).toISOString() : undefined;
      const toIso = to ? new Date(to + "T23:59:59").toISOString() : undefined;
      const res: any = source === "audit"
        ? await auditFn({ data: { from: fromIso, to: toIso, entity, entityId } })
        : await notifFn({ data: { from: fromIso, to: toIso } });
      if (!res.count) {
        toast.info("No rows for the selected range.");
      } else {
        const name = `${source}-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-lg border border-hairline bg-surface p-5 shadow-xl">
            <div className="mb-3 text-sm font-semibold">Export {source === "audit" ? "audit events" : "notifications"}</div>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-xs text-muted-foreground">From</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">To</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" />
              </label>
              {(entity || entityId) && (
                <div className="rounded-md border border-hairline bg-surface-2 px-2 py-1.5 text-[11px] text-muted-foreground">
                  Scoped to {entity}{entityId ? ` · ${entityId.slice(0, 8)}…` : ""}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setOpen(false)} className="rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2">Cancel</button>
                <button disabled={busy} onClick={run} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Exporting…" : "Download"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
