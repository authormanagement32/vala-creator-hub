import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  count?: number | string;
  actions?: ReactNode;
  children: ReactNode;
}

export function WallShell({ title, subtitle, count, actions, children }: Props) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {title}
            {count !== undefined && (
              <span className="ml-2 rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            )}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
