import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { listNotifications, markNotificationRead } from "@/lib/author-manager.functions";
import { ExportCsvButton } from "./ExportCsvButton";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fetcher = useServerFn(listNotifications);
  const marker = useServerFn(markNotificationRead);
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetcher(),
    refetchInterval: 15_000,
    retry: false,
  });
  const mark = useMutation({
    mutationFn: (id: string) => marker({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const unread = (data as any[]).filter((n) => !n.read_at).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread"}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-hairline text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white"
          >
            {unread}
          </span>
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {unread > 0 ? `${unread} unread notifications` : "No unread notifications"}
      </span>
      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-md border border-hairline bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-2">Notifications
              {unread > 0 && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] text-brand">{unread} new</span>}
            </span>
            <ExportCsvButton source="notifications" label="Export" />
          </div>
          <div className="max-h-96 overflow-auto">

            {(data as any[]).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</div>
            ) : (
              (data as any[]).map((n) => (
                <div key={n.id} className={`flex gap-2 border-b border-hairline p-3 text-xs ${n.read_at ? "opacity-60" : ""}`}>
                  <div className="flex-1">
                    <div className="font-medium">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-muted-foreground">{n.body}</div>}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={() => mark.mutate(n.id)}
                      className="self-start rounded p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
