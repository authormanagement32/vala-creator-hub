import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/products")({
  head: () => ({ meta: [{ title: "Products — Author Manager" }] }),
  component: () => <StubWall title="Products" subtitle="Every author product across software, SaaS, APK, source code, templates, themes, plugins, and AI." />,
});
