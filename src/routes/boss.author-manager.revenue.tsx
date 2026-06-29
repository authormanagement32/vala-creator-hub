import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/revenue")({
  head: () => ({ meta: [{ title: "Revenue — Author Manager" }] }),
  component: () => <StubWall title="Revenue" subtitle="Product revenue, invoices, taxes, payment history, and financial reports." />,
});
