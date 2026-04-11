export const AGENTS = [
  'rafters',
  'legion',
  'kelex',
  'courses',
  'platform',
  'huttspawn',
  'veneer',
  'vault',
  'shingle',
] as const;

export type Agent = (typeof AGENTS)[number];

export const agentColor: Record<Agent, string> = {
  rafters: 'var(--agent-rafters)',
  legion: 'var(--agent-legion)',
  kelex: 'var(--agent-kelex)',
  courses: 'var(--agent-courses)',
  platform: 'var(--agent-platform)',
  huttspawn: 'var(--agent-huttspawn)',
  veneer: 'var(--agent-veneer)',
  vault: 'var(--agent-vault)',
  shingle: 'var(--agent-shingle)',
};

export function isPublicEntry({
  data,
}: {
  data: { published: boolean; visibility: "public" | "team" | "private" };
}): boolean {
  return data.published && data.visibility === "public";
}
