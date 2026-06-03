import { expect, type Page } from "@playwright/test";

export async function openAboutInquiryTab(page: Page) {
  await page.goto("/about");
  await expect(page).toHaveURL(/\/about/, { timeout: 30_000 });
  await expect(page.getByText(/Vision & Legacy/i)).toBeVisible({ timeout: 30_000 });

  const inquiryTab = page.getByRole("tab", { name: /^Inquiry$/i });
  await expect(inquiryTab).toBeVisible({ timeout: 15_000 });
  await inquiryTab.click();

  await expect(page.getByRole("button", { name: /Send Inquiry/i })).toBeVisible();
}
