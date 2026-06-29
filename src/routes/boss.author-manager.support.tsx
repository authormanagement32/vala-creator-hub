import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/support")({
  head: () => ({ meta: [{ title: "Support — Author Manager" }] }),
  component: () => <StubWall title="Support" subtitle="Tickets, live chat, WhatsApp, email, bug reports, feature requests, and SLA tracking." />,
});
