import { and, eq, inArray } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  gameSessions,
  quizzes,
  teamMembers,
  teams,
} from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { JoinForm } from "./join-form";
import { TeamSelection } from "./team-selection";

export default async function PlayLandingPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Play");

  const upperCode = code.toUpperCase();

  const [session, userSession] = await Promise.all([
    db
      .select({
        id: gameSessions.id,
        status: gameSessions.status,
        quizTitle: quizzes.title,
        maxTeamSize: quizzes.maxTeamSize,
      })
      .from(gameSessions)
      .innerJoin(quizzes, eq(quizzes.id, gameSessions.quizId))
      .where(eq(gameSessions.joinCode, upperCode))
      .limit(1),
    auth(),
  ]);

  const row = session[0];

  if (!row) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("invalidEyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-black uppercase tracking-wider">
          {t("invalidTitle", { code: upperCode })}
        </h1>
        <p className="text-sm text-muted-foreground">{t("invalidHint")}</p>
      </div>
    );
  }

  if (userSession?.user?.id) {
    const sessionTeamIds = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.sessionId, row.id));

    if (sessionTeamIds.length > 0) {
      const [existing] = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, userSession.user.id),
            inArray(
              teamMembers.teamId,
              sessionTeamIds.map((t) => t.id)
            )
          )
        )
        .limit(1);
      if (existing) {
        redirect({ href: `/play/${upperCode}/lobby`, locale });
      }
    }
  }

  if (row.status !== "lobby") {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("closedEyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-black uppercase tracking-wider">
          {row.quizTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t("closedHint")}</p>
      </div>
    );
  }

  // Not signed in → ask for a name first.
  if (!userSession?.user?.id) {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-12">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("eyebrow", { code: upperCode })}
          </p>
          <h1 className="font-heading text-3xl font-black uppercase tracking-wider">
            {row.quizTitle}
          </h1>
        </header>
        <JoinForm code={upperCode} />
      </div>
    );
  }

  // Signed in, but no team yet → team selection.
  const existingTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      color: teams.color,
      avatarEmoji: teams.avatarEmoji,
    })
    .from(teams)
    .where(eq(teams.sessionId, row.id));

  // Member counts per team — single query, grouped client-side.
  const allMembers =
    existingTeams.length > 0
      ? await db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(
            inArray(
              teamMembers.teamId,
              existingTeams.map((tm) => tm.id)
            )
          )
      : [];
  const memberCountByTeam = allMembers.reduce<Record<string, number>>(
    (acc, m) => {
      acc[m.teamId] = (acc[m.teamId] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("eyebrow", { code: upperCode })}
        </p>
        <h1 className="font-heading text-3xl font-black uppercase tracking-wider">
          {row.quizTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("welcomePlayer", {
            name: userSession.user.name ?? t("joinedFallback"),
          })}
        </p>
      </header>

      <TeamSelection
        code={upperCode}
        maxTeamSize={row.maxTeamSize ?? null}
        teams={existingTeams.map((tm) => ({
          ...tm,
          memberCount: memberCountByTeam[tm.id] ?? 0,
        }))}
      />
    </div>
  );
}
