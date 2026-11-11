import { expect, it } from "vitest";
import { airQualityBand } from "./status";

it("maps US AQI values to bands at the EPA boundaries", () => {
  expect(airQualityBand(50).status).toBe("good");
  expect(airQualityBand(51).status).toBe("warning");
  expect(airQualityBand(150).status).toBe("serious");
  expect(airQualityBand(151).status).toBe("critical");
});
