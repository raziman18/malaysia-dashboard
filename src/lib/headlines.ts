export interface Headline {
  title: string;
  description: string;
  source: string;
  link: string;
  published: Date;
  image?: string;
  // Set once the AI has labelled the headline. Until then the keyword guess is used.
  tone?: Tone;
}

export type Tone = "positive" | "negative" | "neutral";

// Feeds without a <source> tag take the outlet name passed in.
export function parseRss(xml: string, outlet = ""): Headline[] {
  const document = new DOMParser().parseFromString(xml, "text/xml");
  return [...document.querySelectorAll("item")].map((item) => {
    const text = (tag: string) => item.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
    const source = text("source") || outlet;
    const title = text("title");
    const suffix = ` - ${source}`;
    const media = item.getElementsByTagName("media:thumbnail")[0] ?? item.getElementsByTagName("media:content")[0];
    return {
      title: source && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title,
      description: new DOMParser().parseFromString(text("description"), "text/html").body.textContent ?? "",
      source,
      link: text("link"),
      published: new Date(text("pubDate")),
      image: media?.getAttribute("url") ?? undefined,
    };
  });
}

// A rough keyword score, matched at the start of words so "flood" also covers "floods" and "flooding".
const positiveWords = /\b(growth|grow|surge|record high|boost|wins\b|won\b|approv|launch|rise|rising|gain|improv|recover|success|award|invest|strong|aid\b|rescued|reopen|celebrat)/gi;
const negativeWords = /\b(flood|death|dead\b|dies\b|died\b|kill|crash|fall|drop|loss|crisis|fraud|scam|arrest|fire|injur|warn|protest|corrupt|declin|tragic|accident|murder|attack|shortage|outbreak|landslide|storm|missing|probe)/gi;

export function headlineTone(title: string): Tone {
  const score = (title.match(positiveWords)?.length ?? 0) - (title.match(negativeWords)?.length ?? 0);
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export const toneOf = (headline: Headline): Tone => headline.tone ?? headlineTone(headline.title);

export function toneSummary(headlines: Headline[]) {
  const counts: Record<Tone, number> = { positive: 0, negative: 0, neutral: 0 };
  headlines.forEach((headline) => counts[toneOf(headline)]++);
  return { ...counts, total: headlines.length, aiLabelled: headlines.filter((headline) => headline.tone).length };
}
