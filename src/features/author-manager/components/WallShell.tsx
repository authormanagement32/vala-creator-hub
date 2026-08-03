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
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[34px]">
            {title}
            {count !== undefined && (
              <span className="ml-3 align-middle rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                {count}
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
