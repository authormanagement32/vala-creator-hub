const tones: Record<string, string> = {
  verified: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  published: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  review: "bg-warning/15 text-warning",
  registration: "bg-info/15 text-info",
  identity: "bg-info/15 text-info",
  kyc: "bg-info/15 text-info",
  portfolio: "bg-info/15 text-info",
  interview: "bg-info/15 text-info",
  agreement: "bg-info/15 text-info",
  suspended: "bg-danger/15 text-danger",
  rejected: "bg-danger/15 text-danger",
  revoked: "bg-danger/15 text-danger",
  expired: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = tones[status.toLowerCase()] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
