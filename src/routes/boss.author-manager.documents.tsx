import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/documents")({
  head: () => ({ meta: [{ title: "Documents — Author Manager" }] }),
  component: () => <StubWall title="Documents" subtitle="Author agreements, NDA, KYC, tax documents, certificates, copyright, and digital signatures." />,
});
