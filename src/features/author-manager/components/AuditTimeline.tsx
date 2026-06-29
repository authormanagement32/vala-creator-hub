export function AuditTimeline({ entity, entityId }: { entity: string; entityId?: string }) {
  return (
    <div className="rounded-md border border-dashed border-hairline p-6 text-center text-xs text-muted-foreground">
      Audit history for <span className="font-mono">{entity}</span>
      {entityId && <span className="font-mono"> · {entityId}</span>} will appear here once Lovable
      Cloud is connected.
    </div>
  );
}
