import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Activity, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { listAudit } from "@/lib/author-manager.functions";
import { ExportCsvButton } from "./ExportCsvButton";

const ICON = {
  success: CheckCircle2,
  danger: AlertTriangle,
  warn: AlertTriangle,
  info: Info,
} as const;

const TONE = {
  success: "text-success",
  danger: "text-danger",
  warn: "text-warning",
  info: "text-muted-foreground",
} as const;

export function AuditTimeline({ entity, entityId }: { entity: string; entityId?: string }) {
  const fetcher = useServerFn(listAudit);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit", entity, entityId ?? null],
    queryFn: () => fetcher({ data: { entity, entityId, limit: 25 } }),
  });

  if (isLoading) {
    return <div className="rounded-md border border-hairline p-4 text-xs text-muted-foreground">Loading audit…</div>;
  }
  if (isError) {
    return <div className="rounded-md border border-danger/40 bg-danger/5 p-4 text-xs text-danger">Sign in as boss to see audit history.</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-hairline p-6 text-center text-xs text-muted-foreground">
        <Activity className="mx-auto mb-1 h-4 w-4" />
        No audit events yet for this {entity}.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="audit-timeline">
      <div className="flex items-center justify-end">
        <ExportCsvButton source="audit" entity={entity} entityId={entityId} />
      </div>
      <ol className="space-y-2">
        {data.map((e: any) => {
          const Icon = ICON[(e.severity as keyof typeof ICON) ?? "info"] ?? Info;
          const tone = TONE[(e.severity as keyof typeof TONE) ?? "info"] ?? TONE.info;
          return (
            <li key={e.id} data-testid="audit-event" data-action={e.action} className="flex gap-2 rounded-md border border-hairline bg-surface-2 p-2 text-xs">
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone}`} />
              <div className="flex-1">
                <div className="font-medium">{e.summary}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="font-mono">{e.action}</span>
                  <span>·</span>
                  <span>{e.actor_email ?? "system"}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

