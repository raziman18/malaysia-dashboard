import type { Headline } from "./headlines.js";

// Keywords matched at the start of words in the title and description. English and common Malay terms.
export const topics = {
  flood: /\b(flood|banjir|kepala air|evacuat|relief cent|landslide|tanah runtuh)/i,
  health: /\b(health|hospital|dengue|clinic|KKM|disease|vaccin|patient|medic|outbreak|kesihatan)/i,
  safety: /\b(police|polis|accident|crash|crime|fire|murder|arrest|robbery|drown|scam|kemalangan)/i,
  economy: /\b(econom|ringgit|Bursa|inflation|GDP|trade|invest|export|budget|subsid|price|tariff)/i,
  politics: /\b(parliament|Dewan|cabinet|minister|Anwar|PKR|UMNO|PAS\b|Bersatu|DAP|Pakatan|Perikatan|Barisan|election|MPs?\b|assemblyman|state assembly|pilihan raya)/i,
  borneo: /\b(Sabah|Sarawak|Kota Kinabalu|Kuching|Labuan|Sandakan|Miri)/i,
  cabinet: /\b(Cabinet|Kabinet|Jemaah Menteri|reshuffle|rombakan)\b/i,
};

// Topics the AI labels. The others are always found by keywords: places, and the narrow Cabinet topic.
const aiTopics = new Set<Topic>(["flood", "health", "safety", "economy", "politics"]);

export type Topic = keyof typeof topics;

// Uses the AI's topics once a headline has them.
export const filterByTopic = (headlines: Headline[], topic: Topic) =>
  headlines.filter((headline) => {
    if (headline.topics && aiTopics.has(topic)) return headline.topics.includes(topic);
    return topics[topic].test(`${headline.title} ${headline.description}`);
  });
