import { rankTeams } from "./podium-rank";

const team = (
  id: string,
  totalScore: number
): {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  totalScore: number;
} => ({
  id,
  name: id,
  color: "#fff",
  avatarEmoji: "🎵",
  totalScore,
});

describe("rankTeams", () => {
  it("sorts teams by total score descending", () => {
    const result = rankTeams([team("a", 5), team("b", 12), team("c", 3)]);
    expect(result.map((t) => t.id)).toEqual(["b", "a", "c"]);
  });

  it("keeps original order on tied scores so the podium stays deterministic", () => {
    // Adi joined before Boris, so on ties Adi should stay above Boris.
    const result = rankTeams([
      team("adi", 10),
      team("boris", 10),
      team("ceci", 4),
    ]);
    expect(result.map((t) => t.id)).toEqual(["adi", "boris", "ceci"]);
  });

  it("returns an empty array unchanged", () => {
    expect(rankTeams([])).toEqual([]);
  });
});
