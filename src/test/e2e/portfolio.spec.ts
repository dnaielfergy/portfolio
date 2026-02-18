import { expect, test } from "@playwright/test";

test.describe("portfolio overworld", () => {
  test("intro to first checkpoint journey", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /start journey/i })).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: /start journey/i }).click();

    await expect(page.getByTestId("tutorial-overlay")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.waitForTimeout(1_300);
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("checkpoint-panel")).toBeVisible({ timeout: 4_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("checkpoint-panel")).toBeHidden({ timeout: 4_000 });
  });
});
