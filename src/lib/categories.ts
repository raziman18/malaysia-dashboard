export const categories = [
  { id: "hazards", name: "Disasters and weather" },
  { id: "economy", name: "Economy" },
  { id: "health", name: "Public health and safety" },
  { id: "news", name: "News and sentiment" },
  { id: "parliament", name: "Parliament and Cabinet" },
  { id: "trends", name: "Trends" },
  { id: "sources", name: "Source health" },
] as const;

export type Category = (typeof categories)[number]["id"] | "all";

// The chosen category lives in the address, such as #economy, so a filtered view can be bookmarked or shared.
export function categoryFromHash(hash: string): Category {
  const id = hash.replace(/^#/, "");
  return categories.find((category) => category.id === id)?.id ?? "all";
}
