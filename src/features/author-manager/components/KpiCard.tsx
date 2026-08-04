import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "brand";
}

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-primary-glow",
  success: "text-accent-emerald",
  warning: "text-accent-amber",
  danger: "text-accent-pink",
  info: "text-primary-glow",
  brand: "text-accent-pink",
};

/** KPI tile — same shape as the Creator's Launchpad dashboard KPI card. */
export function KpiCard({ label, value, hint, icon: Icon, tone = "default" }: Props) {
  const tint = toneMap[tone];
  return (
    <div className="bento-card !p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums">{value}</p>
        </div>
        {Icon && <Icon className={`h-4 w-4 shrink-0 ${tint}`} aria-hidden />}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{hint ?? "vs prev. —"}</div>
    </div>
  );
}
