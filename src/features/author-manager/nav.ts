import {
  LayoutDashboard, UserCheck, Users, Package, Code2, LayoutTemplate, Puzzle,
  Palette, Bot, Star, ClipboardCheck, Banknote, TrendingUp, KeyRound,
  GitBranch, Download, LifeBuoy, FileText, BarChart3, ShieldAlert, FileBarChart,
  Settings, type LucideIcon,
} from "lucide-react";

export interface WallNavItem {
  to: string;
  label: string;
  group?: "core" | "catalog" | "operations" | "finance" | "ops" | "insights" | "admin";
  icon?: LucideIcon;
}

export const WALLS: WallNavItem[] = [
  { to: "/boss/author-manager/dashboard", label: "Dashboard", group: "core", icon: LayoutDashboard },
  { to: "/boss/author-manager/applications", label: "Applications", group: "core", icon: UserCheck },
  { to: "/boss/author-manager/authors", label: "Authors", group: "core", icon: Users },
  { to: "/boss/author-manager/products", label: "Products", group: "catalog", icon: Package },
  { to: "/boss/author-manager/source-code", label: "Source Code", group: "catalog", icon: Code2 },
  { to: "/boss/author-manager/templates", label: "Templates", group: "catalog", icon: LayoutTemplate },
  { to: "/boss/author-manager/plugins", label: "Plugins", group: "catalog", icon: Puzzle },
  { to: "/boss/author-manager/themes", label: "Themes", group: "catalog", icon: Palette },
  { to: "/boss/author-manager/ai-models", label: "AI Models", group: "catalog", icon: Bot },
  { to: "/boss/author-manager/reviews", label: "Reviews", group: "operations", icon: Star },
  { to: "/boss/author-manager/approvals", label: "Approvals", group: "operations", icon: ClipboardCheck },
  { to: "/boss/author-manager/royalties", label: "Royalties", group: "finance", icon: Banknote },
  { to: "/boss/author-manager/revenue", label: "Revenue", group: "finance", icon: TrendingUp },
  { to: "/boss/author-manager/licenses", label: "Licenses", group: "ops", icon: KeyRound },
  { to: "/boss/author-manager/versions", label: "Versions", group: "ops", icon: GitBranch },
  { to: "/boss/author-manager/downloads", label: "Downloads", group: "ops", icon: Download },
  { to: "/boss/author-manager/support", label: "Support", group: "ops", icon: LifeBuoy },
  { to: "/boss/author-manager/documents", label: "Documents", group: "ops", icon: FileText },
  { to: "/boss/author-manager/analytics", label: "Analytics", group: "insights", icon: BarChart3 },
  { to: "/boss/author-manager/auth-gate-events", label: "Auth Gate Events", group: "insights", icon: ShieldAlert },
  { to: "/boss/author-manager/reports", label: "Reports", group: "insights", icon: FileBarChart },
  { to: "/boss/author-manager/settings", label: "Settings", group: "admin", icon: Settings },
];

/** Pinned items shown above the grouped sections in the sidebar. */
export const PRIMARY_WALLS: WallNavItem[] = WALLS.filter((w) => w.group === "core");

const GROUP_LABELS: Record<string, string> = {
  catalog: "Catalog",
  operations: "Operations",
  finance: "Finance",
  ops: "Lifecycle",
  insights: "Insights",
  admin: "Admin",
};

export interface WallNavGroup {
  label: string;
  items: WallNavItem[];
}

export const NAV_GROUPS: WallNavGroup[] = Object.entries(GROUP_LABELS).map(([key, label]) => ({
  label,
  items: WALLS.filter((w) => w.group === key),
})).filter((g) => g.items.length > 0);
