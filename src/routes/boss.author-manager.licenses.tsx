import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/licenses")({
  head: () => ({ meta: [{ title: "Licenses — Author Manager" }] }),
  component: () => <StubWall title="Licenses" subtitle="License generation, activation, renewal, expiry, and audit history." />,
});
