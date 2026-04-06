export function isPublicEntry({
  data,
}: {
  data: { published: boolean; visibility: "public" | "team" | "private" };
}): boolean {
  return data.published && data.visibility === "public";
}
