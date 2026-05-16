import { expect, test } from "@playwright/test";

// Validates the authed harness end-to-end: the setup project logged in
// as super-admin and saved the session; this reuses it (no re-login)
// and confirms the admin area + every nav section is reachable.
test.describe("admin authed smoke", () => {
  test("super-admin reaches the admin area and all sections", async ({
    page,
  }) => {
    await page.goto("/en/admin");
    // /en/admin redirects to the quizzes list.
    await expect(page).toHaveURL(/\/en\/admin\/quizzes/);
    await expect(
      page.getByRole("heading", { name: "Quizzes" })
    ).toBeVisible();

    for (const [name, urlPart] of [
      ["Sponsors", "/en/admin/sponsors"],
      ["Stories", "/en/admin/stories"],
      ["Users", "/en/admin/users"],
      ["Quizzes", "/en/admin/quizzes"],
    ] as const) {
      await page.getByRole("link", { name, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(urlPart.replace(/\//g, "\\/")));
    }

    // Users is super-admin only — reaching it proves the role.
    await page.goto("/en/admin/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("Super admin only.")).toHaveCount(0);
  });
});
