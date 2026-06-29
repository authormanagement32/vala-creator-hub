import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/royalties")({
  head: () => ({ meta: [{ title: "Royalties — Author Manager" }] }),
  component: () => <StubWall title="Royalties" subtitle="Royalty calculation, commissions, withdrawals, and payout status." />,
});
