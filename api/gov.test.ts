import { expect, it } from "vitest";
import { upstreamUrl } from "./gov";

it("rebuilds the data.gov.my URL with the trailing slash and original query", () => {
  expect(upstreamUrl("https://site.app/api/gov?path=data-catalogue&id=fuelprice&filter=level%40series_type&limit=1")).toBe(
    "https://api.data.gov.my/data-catalogue/?id=fuelprice&filter=level%40series_type&limit=1",
  );
  expect(upstreamUrl("https://site.app/api/gov?path=weather/warning/earthquake/&limit=5")).toBe("https://api.data.gov.my/weather/warning/earthquake/?limit=5");
  expect(upstreamUrl("https://site.app/api/gov?path=flood-warning")).toBe("https://api.data.gov.my/flood-warning/");
});
