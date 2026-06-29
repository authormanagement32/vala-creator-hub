import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No data yet",
  description = "Connect Lovable Cloud to populate this wall with live records.",
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-card px-6 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 max-w-md text-xs text-muted-foreground">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
