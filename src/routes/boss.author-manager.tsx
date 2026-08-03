import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/features/author-manager/components/TopBar";
import { AppSidebar, useSidebarState } from "@/features/author-manager/components/AppSidebar";
import { CommandPalette } from "@/features/author-manager/components/CommandPalette";

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

function AuthorManagerLayout() {
  const [search, setSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
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
