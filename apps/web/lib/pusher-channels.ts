// Pusher channel names may only use letters, numbers, underscores and hyphens.
// Keep these helpers shared by server and client so subscriptions and
// broadcasts never drift apart.
export function quizChannelName(joinCode: string): string {
  return `quiz-${joinCode}`;
}

export function quizHostChannelName(joinCode: string): string {
  return `quiz-${joinCode}-host`;
}

export function teamPresenceChannelName(teamId: string): string {
  return `presence-team-${teamId}`;
}
