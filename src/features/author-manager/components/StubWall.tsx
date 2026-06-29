import { WallShell } from "./WallShell";
import { EmptyState } from "./EmptyState";

export function StubWall({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle?: string;
  description?: string;
}) {
  return (
    <WallShell title={title} subtitle={subtitle}>
      <EmptyState
        title={`${title} comes online next phase`}
        description={
          description ??
          "This wall is scaffolded with full routing and shell. Live tables, filters, and actions activate when Lovable Cloud is connected and the wall's backend schema is deployed."
        }
      />
    </WallShell>
  );
}
