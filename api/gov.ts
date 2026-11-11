// Vercel function that forwards data.gov.my requests. vercel.json rewrites /api/gov/<path>?<query> to
// /api/gov?path=<path>&<query>. Successful replies are cached by Vercel's CDN for 10 minutes, so all
// visitors share one upstream call, which keeps the dashboard under data.gov.my's rate limit.

// data.gov.my needs the trailing slash before the query string.
export function upstreamUrl(requestUrl: string): string {
  const { searchParams } = new URL(requestUrl);
  const path = searchParams.get("path") ?? "";
  searchParams.delete("path");
  const query = searchParams.toString();
  return `https://api.data.gov.my/${path.replace(/\/+$/, "")}/${query ? `?${query}` : ""}`;
}

export async function GET(request: Request): Promise<Response> {
  const token = process.env.DATA_GOV_MY_TOKEN;
  const response = await fetch(upstreamUrl(request.url), { headers: token ? { Authorization: `Token ${token}` } : {} });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (response.ok) headers["Cache-Control"] = "public, s-maxage=600, stale-while-revalidate=3600";
  return new Response(await response.text(), { status: response.status, headers });
}
