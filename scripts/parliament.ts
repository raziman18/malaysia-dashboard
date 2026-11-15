// Refreshes public/parliament.json from parlimen.gov.my. The site does not answer cloud servers such as Vercel
// or GitHub Actions, so run this from a computer in Malaysia: npm run parliament
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { request } from "node:https";
import { rootCertificates } from "node:tls";
import { extractText, getDocumentProxy } from "unpdf";
import { billFiles, explanatoryStatement, malaysiaToday, parliamentSite, parseBills, parseMeetings, parseSittings, type Parliament } from "../src/lib/parliament.js";

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
const billCount = 8;

// The site sets a session cookie on the bills page and serves bill PDFs only to requests that send it back.
let cookie = "";

function fetchFile(path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const page = request(`${parliamentSite}/${path}`, { ca, headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie }, timeout: 60_000 }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`parlimen.gov.my returned ${response.statusCode} for ${path}`));
        return;
      }
      cookie ||= (response.headers["set-cookie"] ?? []).map((value) => value.split(";")[0]).join("; ");
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });
    page.on("timeout", () => page.destroy(new Error("parlimen.gov.my did not respond")));
    page.on("error", reject);
    page.end();
  });
}

const fetchPage = async (path: string) => (await fetchFile(path)).toString("utf8");

// Bill PDFs do not change, so each one is read only once and its statement is kept from the last saved file.
async function explanation(code: string, file: string | undefined, saved: Parliament | undefined) {
  const known = saved?.bills.find((bill) => bill.code === code)?.explanation;
  if (known || !file) return known;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(await fetchFile(encodeURI(file.slice(1)))));
    return explanatoryStatement((await extractText(pdf, { mergePages: true })).text);
  } catch (error) {
    console.warn(`Could not read the PDF for ${code}: ${(error as Error).message}`);
    return undefined;
  }
}

const savedFile = "public/parliament.json";
const saved: Parliament | undefined = existsSync(savedFile) ? JSON.parse(readFileSync(savedFile, "utf8")) : undefined;
const today = malaysiaToday();
// The bills page comes first so its session cookie is set before the bill PDFs are requested.
const bills = await fetchPage("bills-dewan-rakyat.html?uweb=dr&lang=en");
const calendar = await fetchPage("takwim-dewan-rakyat.html?uweb=dr&lang=en");
// The meeting under way, or the next one this year.
const meeting = parseMeetings(calendar).find((item) => item.end >= today);
const files = billFiles(bills);
const recentBills = parseBills(bills).slice(0, billCount);
// One PDF at a time, to go easy on the site.
for (const bill of recentBills) bill.explanation = await explanation(bill.code, files.get(bill.code), saved);
const parliament: Parliament = {
  meeting: meeting && { name: meeting.name, start: meeting.start, end: meeting.end },
  sittings: meeting ? parseSittings(await fetchPage(`takwim-dewan-rakyat.html?uweb=dr&lang=en&${meeting.id}`)) : [],
  bills: recentBills,
  updated: today,
};
if (!parliament.bills.length) throw new Error("No bills found. The bills page layout may have changed.");
writeFileSync(savedFile, `${JSON.stringify(parliament, null, 1)}\n`);
const explained = parliament.bills.filter((bill) => bill.explanation).length;
console.log(`Saved ${parliament.meeting?.name ?? "no meeting"}, ${parliament.sittings.length} sitting days and ${parliament.bills.length} bills (${explained} with statements).`);
