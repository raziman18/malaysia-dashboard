// Vercel function that forwards data.gov.my requests. vercel.json rewrites /api/gov/<path>?<query> to
// /api/gov?path=<path>&<query>. Successful replies are cached by Vercel's CDN for 10 minutes, so all
// visitors share one upstream call, which keeps the dashboard under data.gov.my's rate limit.

// data.gov.my needs a trailing slash before the query string, but Vercel rewrites skip paths that end
// in one, so the browser leaves it off and it is added here. The Vite dev server uses this too.
export const dataGovUrl = (path: string, query: string) =>
  `https://api.data.gov.my/${path.replace(/^\/+|\/+$/g, "")}/${query ? `?${query}` : ""}`;

export function upstreamUrl(requestUrl: string): string {
  const { searchParams } = new URL(requestUrl);
  const path = searchParams.get("path") ?? "";
  searchParams.delete("path");
  return dataGovUrl(path, searchParams.toString());
}

export async function GET(request: Request): Promise<Response> {
  const token = process.env.DATA_GOV_MY_TOKEN;
  const response = await fetch(upstreamUrl(request.url), { headers: token ? { Authorization: `Token ${token}` } : {} });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (response.ok) headers["Cache-Control"] = "public, s-maxage=600, stale-while-revalidate=3600";
  return new Response(await response.text(), { status: response.status, headers });
}
