import { expect, test } from "@playwright/test";

test.describe("public and auth smoke flow", () => {
  test("home CTAs navigate between auth screens", async ({ page }) => {
    await page.goto("/en");

    await expect(
      page.getByRole("heading", { name: "MELOMAN" })
    ).toBeVisible();
    await expect(
      page.getByText("Music quiz and daily entertainment")
    ).toBeVisible();

    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByText("Sign in to your account")).toBeVisible();

    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/en\/register$/);
    await expect(page.getByText("Create a new account")).toBeVisible();

    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test("auth forms show client-side validation before server submission", async ({
    page,
  }) => {
    await page.goto("/en/login");

    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();

    await page.goto("/en/register");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(
      page.getByText("Name must be at least 2 characters")
    ).toBeVisible();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(
      page.getByText("Password must be at least 8 characters")
    ).toBeVisible();

    await page.getByLabel("Display name").fill("Adi");
    await page.getByLabel("Email").fill("adi@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("different123");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("protected admin route redirects anonymous users to login", async ({
    page,
  }) => {
    await page.goto("/en/admin");

    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByText("Sign in to your account")).toBeVisible();
  });
});
