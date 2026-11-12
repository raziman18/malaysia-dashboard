import { expect, it } from "vitest";
import type { Headline } from "./headlines";
import { filterByTopic } from "./topics";

const story = (title: string, description = ""): Headline => ({ title, description, source: "", link: title, published: new Date() });

it("matches topics in the title or description", () => {
  const stories = [story("Banjir di Kelantan"), story("Residents moved", "Over 300 evacuated in Kuantan"), story("Ringgit steady")];
  expect(filterByTopic(stories, "flood").map((item) => item.title)).toEqual(["Banjir di Kelantan", "Residents moved"]);
});

it("prefers the AI's topics once a headline has them, except for Sabah and Sarawak", () => {
  const houseArrest = { ...story("Najib's house arrest conditions set"), topics: ["politics" as const] };
  const kuching = { ...story("Kuching hospital opens new wing"), topics: ["health" as const] };
  expect(filterByTopic([houseArrest], "safety")).toEqual([]);
  expect(filterByTopic([houseArrest], "politics")).toEqual([houseArrest]);
  expect(filterByTopic([kuching], "borneo")).toEqual([kuching]);
});

it("finds Cabinet stories by keyword even when the AI has labelled them", () => {
  const reshuffle = { ...story("Minor Cabinet reshuffle expected after Loke's exit"), topics: ["politics" as const] };
  expect(filterByTopic([reshuffle, story("Ringgit steady")], "cabinet")).toEqual([reshuffle]);
});

it("matches party names as whole words only", () => {
  const stories = [story("PAS names Melaka candidates"), story("Passenger numbers rise at KLIA")];
  expect(filterByTopic(stories, "politics").map((item) => item.title)).toEqual(["PAS names Melaka candidates"]);
});
