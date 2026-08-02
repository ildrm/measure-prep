import { MatchStrategy } from "@prisma/client";
import { ScoringService } from "./scoring.service";
describe("ScoringService", () => {
  const service = new ScoringService({} as never);
  it("grades case-insensitive and numeric answers", () => {
    expect(service.grade(MatchStrategy.CASE_INSENSITIVE, ["Storm"], { value: " storm " })).toEqual({ correct: true, pointsFactor: 1 });
    expect(service.grade(MatchStrategy.NUMERIC_TOLERANCE, [3.14], { value: "3.141" }, 0.01).correct).toBe(true);
  });
  it("awards partial multi-select credit without rewarding guessing", () => {
    expect(service.grade(MatchStrategy.MULTI_PARTIAL, ["A", "C"], { value: ["A"] }).pointsFactor).toBe(0.5);
    expect(service.grade(MatchStrategy.MULTI_PARTIAL, ["A", "C"], { value: ["A", "B"] }).pointsFactor).toBe(0);
  });
});
