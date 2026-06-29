import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/ai-models")({
  head: () => ({ meta: [{ title: "AI Models — Author Manager" }] }),
  component: () => <StubWall title="AI Models" subtitle="AI models, agents, and prompts published by creators." />,
});
