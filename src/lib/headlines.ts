import type { Topic } from "./topics.js";

export interface Headline {
  title: string;
  description: string;
  source: string;
  link: string;
  published: Date;
  image?: string;
  // Set once the AI has labelled the headline. Until then keyword guesses are used.
  tone?: Tone;
  topics?: Topic[];
}

export type Tone = "positive" | "negative" | "neutral";

const entities: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "\u2014", ndash: "\u2013",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d", hellip: "\u2026",
};

const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] !== "#") return entities[code.toLowerCase()] ?? match;
    return String.fromCodePoint(code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1)));
  });

// Text inside the first <tag>, without CDATA wrappers or HTML tags.
function tagText(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  const inner = (match?.[1] ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  // Some feeds escape the HTML in descriptions, so tags are removed again after decoding.
  return decode(inner.replace(/<[^>]+>/g, "")).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// A small regular-expression parser rather than DOMParser, so the same code runs in the browser and on the server.
// Feeds without a <source> tag take the outlet name passed in.
export function parseRss(xml: string, outlet = ""): Headline[] {
  return (xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []).map((item) => {
    const source = tagText(item, "source") || outlet;
    const title = tagText(item, "title");
    const suffix = ` - ${source}`;
    // A media tag or enclosure when there is one, otherwise the first photo in the description.
    const image = (item.match(/<(?:media:thumbnail|media:content|enclosure)[^>]*\surl="([^"]+)"/) ?? item.match(/<img[^>]*\ssrc="([^"]+)"/))?.[1];
    return {
      title: source && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title,
      description: tagText(item, "description"),
      source,
      link: tagText(item, "link"),
      published: new Date(tagText(item, "pubDate")),
      image: image && decode(image),
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
