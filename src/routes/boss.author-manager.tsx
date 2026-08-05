import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/features/author-manager/components/TopBar";
import { AppSidebar, useSidebarState } from "@/features/author-manager/components/AppSidebar";
import { CommandPalette } from "@/features/author-manager/components/CommandPalette";
import { WALLS } from "@/features/author-manager/nav";

export const Route = createFileRoute("/boss/author-manager")({
  head: () => ({
    meta: [
      { title: "Author Manager — Software Vala Boss Panel" },
      {
        name: "description",
        content:
          "Global control center for managing software authors, source code publishers, template creators, plugin developers, and AI creators across Software Vala.",
      },
    ],
  }),
  component: AuthorManagerLayout,
});

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function AuthorManagerLayout() {
  const [search, setSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const focusModuleSearch = () => {
      const focus = () => {
        const el =
          (document.getElementById("sidebar-module-search") as HTMLInputElement | null) ??
          (document.getElementById("global-search") as HTMLInputElement | null);
        el?.focus();
        el?.select?.();
      };
      if (collapsed) {
        toggleCollapsed();
        requestAnimationFrame(() => requestAnimationFrame(focus));
      } else {
        focus();
      }
    };

    const step = (delta: number) => {
      const idx = WALLS.findIndex((w) => pathname === w.to || pathname.startsWith(w.to + "/"));
      const next = WALLS[(((idx === -1 ? 0 : idx) + delta) + WALLS.length) % WALLS.length];
      if (next) navigate({ to: next.to });
    };

    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
        return;
      }
      // Wall navigation: Alt + ArrowDown/ArrowUp (or Alt + ] / [)
      if (e.altKey && !meta) {
        if (e.key === "ArrowDown" || e.key === "]") {
          e.preventDefault();
          step(1);
          return;
        }
        if (e.key === "ArrowUp" || e.key === "[") {
          e.preventDefault();
          step(-1);
          return;
        }
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === "/") {
        e.preventDefault();
        focusModuleSearch();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, toggleCollapsed, navigate, pathname]);

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          search={search}
          onSearch={setSearch}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
