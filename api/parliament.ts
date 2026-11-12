// Vercel function with the Dewan Rakyat's sitting calendar, latest order paper and recent bills, read from
// parlimen.gov.my. The site has no API, so this reads its pages. Vercel's CDN keeps the result for an hour.
import { request } from "node:https";
import { rootCertificates } from "node:tls";
import { json } from "./_groq.js";

// parlimen.gov.my does not send the intermediate certificate that browsers fetch on their own, so Node cannot
// verify it. This is Sectigo's public intermediate (Sectigo Public Server Authentication CA DV R36, valid until
// March 2036), from http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt. The connection is still
// fully verified against the usual root certificates.
const sectigoIntermediate = `-----BEGIN CERTIFICATE-----
MIIGTDCCBDSgAwIBAgIQOXpmzCdWNi4NqofKbqvjsTANBgkqhkiG9w0BAQwFADBf
MQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQD
Ey1TZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYw
HhcNMjEwMzIyMDAwMDAwWhcNMzYwMzIxMjM1OTU5WjBgMQswCQYDVQQGEwJHQjEY
MBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTcwNQYDVQQDEy5TZWN0aWdvIFB1Ymxp
YyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gQ0EgRFYgUjM2MIIBojANBgkqhkiG9w0B
AQEFAAOCAY8AMIIBigKCAYEAljZf2HIz7+SPUPQCQObZYcrxLTHYdf1ZtMRe7Yeq
RPSwygz16qJ9cAWtWNTcuICc++p8Dct7zNGxCpqmEtqifO7NvuB5dEVexXn9RFFH
12Hm+NtPRQgXIFjx6MSJcNWuVO3XGE57L1mHlcQYj+g4hny90aFh2SCZCDEVkAja
EMMfYPKuCjHuuF+bzHFb/9gV8P9+ekcHENF2nR1efGWSKwnfG5RawlkaQDpRtZTm
M64TIsv/r7cyFO4nSjs1jLdXYdz5q3a4L0NoabZfbdxVb+CUEHfB0bpulZQtH1Rv
38e/lIdP7OTTIlZh6OYL6NhxP8So0/sht/4J9mqIGxRFc0/pC8suja+wcIUna0HB
pXKfXTKpzgis+zmXDL06ASJf5E4A2/m+Hp6b84sfPAwQ766rI65mh50S0Di9E3Pn
2WcaJc+PILsBmYpgtmgWTR9eV9otfKRUBfzHUHcVgarub/XluEpRlTtZudU5xbFN
xx/DgMrXLUAPaI60fZ6wA+PTAgMBAAGjggGBMIIBfTAfBgNVHSMEGDAWgBRWc1hk
lfmSGrASKgRieaFAFYghSTAdBgNVHQ4EFgQUaMASFhgOr872h6YyV6NGUV3LBycw
DgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYI
KwYBBQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgEw
VAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC5zZWN0aWdvLmNvbS9TZWN0aWdv
UHVibGljU2VydmVyQXV0aGVudGljYXRpb25Sb290UjQ2LmNybDCBhAYIKwYBBQUH
AQEEeDB2ME8GCCsGAQUFBzAChkNodHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3Rp
Z29QdWJsaWNTZXJ2ZXJBdXRoZW50aWNhdGlvblJvb3RSNDYucDdjMCMGCCsGAQUF
BzABhhdodHRwOi8vb2NzcC5zZWN0aWdvLmNvbTANBgkqhkiG9w0BAQwFAAOCAgEA
YtOC9Fy+TqECFw40IospI92kLGgoSZGPOSQXMBqmsGWZUQ7rux7cj1du6d9rD6C8
ze1B2eQjkrGkIL/OF1s7vSmgYVafsRoZd/IHUrkoQvX8FZwUsmPu7amgBfaY3g+d
q1x0jNGKb6I6Bzdl6LgMD9qxp+3i7GQOnd9J8LFSietY6Z4jUBzVoOoz8iAU84OF
h2HhAuiPw1ai0VnY38RTI+8kepGWVfGxfBWzwH9uIjeooIeaosVFvE8cmYUB4TSH
5dUyD0jHct2+8ceKEtIoFU/FfHq/mDaVnvcDCZXtIgitdMFQdMZaVehmObyhRdDD
4NQCs0gaI9AAgFj4L9QtkARzhQLNyRf87Kln+YU0lgCGr9HLg3rGO8q+Y4ppLsOd
unQZ6ZxPNGIfOApbPVf5hCe58EZwiWdHIMn9lPP6+F404y8NNugbQixBber+x536
WrZhFZLjEkhp7fFXf9r32rNPfb74X/U90Bdy4lzp3+X1ukh1BuMxA/EEhDoTOS3l
7ABvc7BYSQubQ2490OcdkIzUh3ZwDrakMVrbaTxUM2p24N6dB+ns2zptWCva6jzW
r8IWKIMxzxLPv5Kt3ePKcUdvkBU/smqujSczTzzSjIoR5QqQA6lN1ZRSnuHIWCvh
JEltkYnTAH41QJ6SAWO66GrrUESwN/cgZzL4JLEqz1Y=
-----END CERTIFICATE-----`;
const ca = [...rootCertificates, sectigoIntermediate];
const site = "https://www.parlimen.gov.my";

function fetchPage(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const page = request(`${site}/${path}`, { ca, headers: { "User-Agent": "Mozilla/5.0" }, timeout: 30_000 }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`parlimen.gov.my returned ${response.statusCode}`));
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => (body += chunk));
      response.on("end", () => resolve(body));
    });
    page.on("timeout", () => page.destroy(new Error("parlimen.gov.my did not respond")));
    page.on("error", reject);
    page.end();
  });
}

export interface Meeting {
  name: string;
  start: string;
  end: string;
  id: string;
}

export interface Sitting {
  date: string;
  business: string;
  note?: string;
}

export interface Bill {
  code: string;
  title: string;
  status: string;
  firstReading?: string;
  secondReading?: string;
  passed?: string;
  presenter?: string;
}

export interface Parliament {
  meeting?: Omit<Meeting, "id">;
  sittings: Sitting[];
  orderPaper?: { date: string; url: string };
  bills: Bill[];
}

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const text = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").replace(/\( /g, "(").trim();

// "5 October 2026" or "Monday, 05 October 2026" to "2026-10-05".
function isoDate(value: string) {
  const match = value.match(/(\d{1,2}) (\w+) (\d{4})/);
  const month = match && months.indexOf(match[2].toLowerCase());
  if (!match || month === null || month < 0) return undefined;
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

// "06/10/2026" to "2026-10-06". A dash means no date yet.
const slashDate = (value?: string) => value?.match(/(\d{2})\/(\d{2})\/(\d{4})/)?.slice(1).reverse().join("-");

// The year's meetings from the calendar page, such as "Third Meeting, 5 October 2026 - 8 December 2026".
export function parseMeetings(html: string): Meeting[] {
  return [...html.matchAll(/<b>\s*([^<]*Meeting)\s*<\/b>[\s\S]*?[?&]id=(-?\d+)&(?:amp;)?ssid=(\d+)[\s\S]*?<div align="center">([^<]+)<\/div>/g)].flatMap(
    ([, name, id, session, dates]) => {
      const [start, end = start] = dates.split(" - ").map(isoDate);
      return start && end ? [{ name: name.trim(), start, end, id: `id=${id}&ssid=${session}` }] : [];
    },
  );
}

// Each sitting day of one meeting, with its business and any note such as a public holiday.
export function parseSittings(html: string): Sitting[] {
  return [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].flatMap(([, row]) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, cell]) => text(cell));
    const date = cells.length === 4 && /^\w+day, /.test(cells[0]) ? isoDate(cells[0]) : undefined;
    if (!date) return [];
    const note = cells[3].replace(/^-\s*/, "");
    return [{ date, business: cells[1], ...(note && { note }) }];
  });
}

// The newest order paper is listed first, as a PDF named OPDR-DDMMYYYY.pdf.
export function parseOrderPaper(html: string) {
  const match = html.match(/'(\/files\/opindex\/pdf\/OPDR-(\d{2})(\d{2})(\d{4})\.pdf)'/);
  return match ? { date: `${match[4]}-${match[3]}-${match[2]}`, url: site + match[1] } : undefined;
}

export function parseBills(html: string): Bill[] {
  return [...html.matchAll(/(D\.R\.\d+\/\d{4})\s*<\/a>[\s\S]*?<td[^>]*class="maintd">\s*\d{4}\s*<\/td>\s*<td class="maintd">([\s\S]*?)<\/td>[\s\S]*?ruustatus\d*"[^>]*>([^<]*)<\/div>([\s\S]*?)Tutup<\/a>/g)].map(
    ([, code, title, status, details]) => {
      const detail = text(details);
      const field = (label: string) => detail.match(new RegExp(`${label} : (.+?)(?= The second reading| Presented by| Passed At|$)`))?.[1];
      return {
        code,
        title: text(title),
        status: status.trim(),
        firstReading: slashDate(field("First reading")),
        secondReading: slashDate(field("The second reading")),
        passed: slashDate(field("Passed At")),
        presenter: field("Presented by")?.replace(/^YB (Senator )?/, ""),
      };
    },
  );
}

const billCount = 8;

export async function GET(): Promise<Response> {
  const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
  const pages = await Promise.all([
    fetchPage("takwim-dewan-rakyat.html?uweb=dr&lang=en"),
    fetchPage("aum-dewan-rakyat.html?uweb=dr&lang=en").catch(() => ""),
    fetchPage("bills-dewan-rakyat.html?uweb=dr&lang=en").catch(() => ""),
  ]).catch((error: Error) => error);
  if (pages instanceof Error) return json({ error: `Could not read parlimen.gov.my: ${pages.message}` }, 502);
  const [calendar, orderPapers, bills] = pages;

  // The meeting under way, or the next one this year.
  const meeting = parseMeetings(calendar).find((item) => item.end >= today);
  const sittings = meeting ? parseSittings(await fetchPage(`takwim-dewan-rakyat.html?uweb=dr&lang=en&${meeting.id}`).catch(() => "")) : [];
  const parliament: Parliament = {
    meeting: meeting && { name: meeting.name, start: meeting.start, end: meeting.end },
    sittings,
    orderPaper: parseOrderPaper(orderPapers),
    bills: parseBills(bills).slice(0, billCount),
  };
  return json(parliament, 200, "public, s-maxage=3600, stale-while-revalidate=86400");
}
