import { desc, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PaginationNav } from "@/components/pagination-nav";
import { getPageParams, pageMeta } from "@/lib/pagination";
import {
  changeUserRoleAction,
  sendPasswordResetEmailAction,
  toggleBanAction,
} from "./actions";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminUsers");

  const session = await auth();
  if (session?.user?.role !== "super_admin") {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">{t("forbidden")}</p>
      </div>
    );
  }
  const currentUserId = session.user.id;

  // Server-side paging — the users table can hold 10k+ rows; never
  // select them all (SoftUni Scalability).
  const pageParams = getPageParams(await searchParams);
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(users),
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(pageParams.limit)
      .offset(pageParams.offset),
  ]);
  const meta = pageMeta(pageParams, Number(total));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
        {t("title")}
      </h1>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">{t("name")}</th>
                <th className="px-4 py-3 font-medium">{t("email")}</th>
                <th className="px-4 py-3 font-medium">{t("role")}</th>
                <th className="px-4 py-3 font-medium">{t("status")}</th>
                <th className="px-4 py-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">{u.displayName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.bannedAt ? (
                        <span className="text-red-400">{t("banned")}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("active")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {u.role !== "admin" && (
                            <form
                              action={async () => {
                                "use server";
                                await changeUserRoleAction(u.id, "admin");
                              }}
                            >
                              <Button type="submit" size="sm" variant="secondary">
                                {t("makeAdmin")}
                              </Button>
                            </form>
                          )}
                          {u.role !== "player" && (
                            <form
                              action={async () => {
                                "use server";
                                await changeUserRoleAction(u.id, "player");
                              }}
                            >
                              <Button type="submit" size="sm" variant="secondary">
                                {t("makePlayer")}
                              </Button>
                            </form>
                          )}
                          {u.role !== "super_admin" && (
                            <form
                              action={async () => {
                                "use server";
                                await changeUserRoleAction(
                                  u.id,
                                  "super_admin"
                                );
                              }}
                            >
                              <Button type="submit" size="sm" variant="secondary">
                                {t("makeSuperAdmin")}
                              </Button>
                            </form>
                          )}
                          <form
                            action={async () => {
                              "use server";
                              await toggleBanAction(u.id);
                            }}
                          >
                            <Button
                              type="submit"
                              size="sm"
                              variant={u.bannedAt ? "secondary" : "destructive"}
                            >
                              {u.bannedAt ? t("unban") : t("ban")}
                            </Button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await sendPasswordResetEmailAction(u.id);
                            }}
                          >
                            <Button type="submit" size="sm" variant="secondary">
                              {t("resetPassword")}
                            </Button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PaginationNav
        basePath="/admin/users"
        page={meta.page}
        totalPages={meta.totalPages}
      />
    </div>
  );
}
