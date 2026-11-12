import { expect, it } from "vitest";
import { malaysiaToday, orderPaperUrl, parseBills, parseMeetings, parseSittings, sittingOutlook, sittingSummary } from "./parliament";

// Trimmed from parlimen.gov.my pages saved on 12 Nov 2026.
const calendar = `
  <td colspan="3" class="webcolor"><div align="center"><b>
      Special Meeting
      </b></div></td></tr><tr>
  <td width="18%"><a href="https://www.parlimen.gov.my/takwim-dewan-rakyat.html?uweb=dr&lang=en&id=-1&ssid=5">More info</a>&nbsp;</td>
  <td width="68%"><div align="center">11 August 2026 &nbsp;</div></td>
  <td colspan="3" class="webcolor"><div align="center"><b>
      Third Meeting
      </b></div></td></tr><tr>
  <td width="18%"><a href="https://www.parlimen.gov.my/takwim-dewan-rakyat.html?uweb=dr&lang=en&id=3&ssid=5">More info</a>&nbsp;</td>
  <td width="68%"><div align="center">5 October 2026 - 8 December 2026 &nbsp;</div></td>`;

const meeting = `
  <tr><td colspan="4"><div align="center"><span class="MsoNormal"><b>6th Week</b></span></div></td></tr>
  <tr>
    <td width="30%" align="center"><span class="MsoNormal"><span class="SpellE">Monday, 09 November 2026</td>
    <td width="35%"><span class="MsoNormal">No Session</span></td>
    <td width="5%"><div align="center">0</div></td>
    <td width="25%"><span class="MsoNormal">- Cuti umum Hari Deepavali</span></td>
  </tr>
  <tr>
    <td width="30%" align="center"><span class="MsoNormal"><span class="SpellE">Wednesday, 11 November 2026</td>
    <td width="35%"><span class="MsoNormal">Debate on 2027 Budget at the Comittee-level</span></td>
    <td width="5%"><div align="center">1</div></td>
    <td width="25%"><span class="MsoNormal"></span></td>
  </tr>`;

const bills = `
<tr class="maintable">
  <td align="center" scope="row" class="maintd">
  <a href="#" onclick="loadResult('/files/billindex/pdf/2026/DR/RUU DR24 - BI.pdf','RUU DR24 - BI.pdf');">
        D.R.24/2026
        </a>
  </td>
  <td align="center" class="maintd">
2026
  </td>
  <td class="maintd">
    Sport Development (Amendment) Bill 2026
  </td>
  <td class="maintd" style="position: relative;">
    <div class="parent ruustatus3" id="row7760"> Passed</div>
    <table>
    <tr><td>First reading</td><td>:</td><td>05/10/2026</td></tr>
    <tr><td>The second reading</td><td>:</td><td>06/10/2026</td></tr>
    <tr><td>Presented by</td><td>:</td><td>YB Dr. Mohammed Taufiq Johari ( Menteri Belia dan Sukan)</td></tr>
    <tr><td>Passed At</td><td>:</td><td>06/10/2026</td></tr>
    </table>
    <a href="javascript:closeBox('ruudiv-row7760')" id="closeBtn" title="Tutup">Tutup</a>
  </td>
</tr>`;

it("reads the year's meetings with their dates", () => {
  expect(parseMeetings(calendar)).toEqual([
    { name: "Special Meeting", start: "2026-08-11", end: "2026-08-11", id: "id=-1&ssid=5" },
    { name: "Third Meeting", start: "2026-10-05", end: "2026-12-08", id: "id=3&ssid=5" },
  ]);
});

it("reads each sitting day with its business and note", () => {
  expect(parseSittings(meeting)).toEqual([
    { date: "2026-11-09", business: "No Session", note: "Cuti umum Hari Deepavali" },
    { date: "2026-11-11", business: "Debate on 2027 Budget at the Comittee-level" },
  ]);
});

it("reads bills with their stage, dates and presenter", () => {
  expect(parseBills(bills)).toEqual([
    {
      code: "D.R.24/2026",
      title: "Sport Development (Amendment) Bill 2026",
      status: "Passed",
      firstReading: "2026-10-05",
      secondReading: "2026-10-06",
      passed: "2026-10-06",
      presenter: "Dr. Mohammed Taufiq Johari (Menteri Belia dan Sukan)",
    },
  ]);
});

const sittings = [
  { date: "2026-11-09", business: "No Session", note: "Cuti umum Hari Deepavali" },
  { date: "2026-11-11", business: "Debate on 2027 Budget at the Comittee-level" },
  { date: "2026-11-12", business: "Debate on 2027 Budget at the Comittee-level" },
  { date: "2026-11-16", business: "Debate on 2027 Budget at the Comittee-level" },
];
const parliament = { meeting: { name: "Third Meeting", start: "2026-10-05", end: "2026-12-08" }, sittings, bills: [], updated: "2026-11-12" };

it("finds today's sitting and the next days that sit", () => {
  expect(sittingOutlook(sittings, "2026-11-08")).toEqual({ today: undefined, upcoming: sittings.slice(1) });
  expect(sittingOutlook(sittings, "2026-11-12", 1).upcoming).toEqual([sittings[3]]);
});

it("says whether the Dewan Rakyat sits today", () => {
  expect(sittingSummary(parliament, "2026-11-12")).toBe("The Dewan Rakyat sits today: Debate on 2027 Budget at the Comittee-level.");
  expect(sittingSummary(parliament, "2026-11-09")).toBe("The Dewan Rakyat does not sit today (Cuti umum Hari Deepavali).");
  expect(sittingSummary(parliament, "2026-11-14")).toBe("The Dewan Rakyat does not sit today.");
  expect(sittingSummary(parliament, "2026-10-01")).toBe("The Dewan Rakyat's Third Meeting starts on 2026-10-05.");
  expect(sittingSummary({ sittings: [], bills: [], updated: "2026-12-20" }, "2026-12-20")).toBe("No more Dewan Rakyat sittings are scheduled this year.");
});

it("uses the Malaysian date late in the UTC day", () => {
  expect(malaysiaToday(new Date("2026-11-12T17:00:00Z"))).toBe("2026-11-13");
});

it("links the order paper for a sitting day", () => {
  expect(orderPaperUrl("2026-11-12")).toBe("https://www.parlimen.gov.my/files/opindex/pdf/OPDR-12112026.pdf");
});
