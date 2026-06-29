export interface WallNavItem {
  to: string;
  label: string;
  group?: "core" | "catalog" | "operations" | "finance" | "ops" | "insights" | "admin";
}

export const WALLS: WallNavItem[] = [
  { to: "/boss/author-manager/dashboard", label: "Dashboard", group: "core" },
  { to: "/boss/author-manager/applications", label: "Applications", group: "core" },
  { to: "/boss/author-manager/authors", label: "Authors", group: "core" },
  { to: "/boss/author-manager/products", label: "Products", group: "catalog" },
  { to: "/boss/author-manager/source-code", label: "Source Code", group: "catalog" },
  { to: "/boss/author-manager/templates", label: "Templates", group: "catalog" },
  { to: "/boss/author-manager/plugins", label: "Plugins", group: "catalog" },
  { to: "/boss/author-manager/themes", label: "Themes", group: "catalog" },
  { to: "/boss/author-manager/ai-models", label: "AI Models", group: "catalog" },
  { to: "/boss/author-manager/reviews", label: "Reviews", group: "operations" },
  { to: "/boss/author-manager/approvals", label: "Approvals", group: "operations" },
  { to: "/boss/author-manager/royalties", label: "Royalties", group: "finance" },
  { to: "/boss/author-manager/revenue", label: "Revenue", group: "finance" },
  { to: "/boss/author-manager/licenses", label: "Licenses", group: "ops" },
  { to: "/boss/author-manager/versions", label: "Versions", group: "ops" },
  { to: "/boss/author-manager/downloads", label: "Downloads", group: "ops" },
  { to: "/boss/author-manager/support", label: "Support", group: "ops" },
  { to: "/boss/author-manager/documents", label: "Documents", group: "ops" },
  { to: "/boss/author-manager/analytics", label: "Analytics", group: "insights" },
  { to: "/boss/author-manager/reports", label: "Reports", group: "insights" },
  { to: "/boss/author-manager/settings", label: "Settings", group: "admin" },
];
