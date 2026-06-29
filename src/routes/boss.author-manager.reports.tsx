import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/reports")({
  head: () => ({ meta: [{ title: "Reports — Author Manager" }] }),
  component: () => <StubWall title="Reports" subtitle="Author, revenue, royalty, download, license, and security reports — exportable to PDF, Excel, and CSV." />,
});
