import type { LeaderboardTeam } from "./leaderboard-overlay";

// Pure ranking helper kept out of the client component file so Jest can
// import it without pulling in next-intl's ESM module graph.
export function rankTeams(teams: LeaderboardTeam[]): LeaderboardTeam[] {
  // Stable copy: keep tied scores in their original order so the podium
  // stays deterministic across re-renders.
  return [...teams].sort((a, b) => b.totalScore - a.totalScore);
}
