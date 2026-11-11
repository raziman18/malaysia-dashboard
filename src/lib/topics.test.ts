import { expect, it } from "vitest";
import type { Headline } from "./headlines";
import { filterByTopic } from "./topics";

const story = (title: string, description = ""): Headline => ({ title, description, source: "", link: title, published: new Date() });

it("matches topics in the title or description", () => {
  const stories = [story("Banjir di Kelantan"), story("Residents moved", "Over 300 evacuated in Kuantan"), story("Ringgit steady")];
  expect(filterByTopic(stories, "flood").map((item) => item.title)).toEqual(["Banjir di Kelantan", "Residents moved"]);
});

it("matches party names as whole words only", () => {
  const stories = [story("PAS names Melaka candidates"), story("Passenger numbers rise at KLIA")];
  expect(filterByTopic(stories, "politics").map((item) => item.title)).toEqual(["PAS names Melaka candidates"]);
});
