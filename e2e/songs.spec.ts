import { expect, test, type Page } from "@playwright/test";

const DEMO_PIN = "021302";

async function openHome(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

async function closeAlert(page: Page, message: string | RegExp) {
  const alert = page.getByRole("alertdialog").filter({ has: page.locator("#alert-dialog-title") });
  await expect(alert).toContainText(message);
  await alert.getByRole("button", { name: "확인" }).click();
}

test("멤버를 고르지 않으면 곡 등록 대신 안내한다", async ({ page }) => {
  await openHome(page);
  await page.getByRole("button", { name: "+ 곡 등록하기" }).click();
  await closeAlert(page, "본인 이름을 선택해주세요");
  await expect(page.getByRole("dialog", { name: "새로운 곡 제안" })).toHaveCount(0);
});

test("선택한 멤버로 곡을 등록하고 PIN 확인 후 삭제한다", async ({ page }, testInfo) => {
  const title = `E2E ${testInfo.project.name} ${Date.now()}`;
  await openHome(page);
  await page.getByLabel("본인 이름 선택").selectOption("Mina");

  await page.getByRole("button", { name: "+ 곡 등록하기" }).click();
  const form = page.getByRole("dialog", { name: "새로운 곡 제안" });
  await form.getByLabel("아티스트명").fill("Playwright");
  await form.getByLabel("곡 제목").fill(title);
  await form.getByText("여성곡").click();
  await form.getByLabel("Mina님의 개인 PIN").fill(DEMO_PIN);
  await form.getByRole("button", { name: "등록하기" }).click();
  await closeAlert(page, "등록했어요");

  const card = page.locator("article").filter({ has: page.getByRole("heading", { name: title }) });
  await expect(card).toContainText("Mina PICK");
  await expect(card).toContainText("여성곡");

  // A wrong PIN is rejected by the server and the song stays.
  await card.getByRole("button", { name: `${title} 삭제` }).click();
  await page.locator("#delete-pin").fill("000000");
  await page.getByRole("button", { name: "삭제하기" }).click();
  await closeAlert(page, "이름 또는 PIN을 확인해주세요");
  await expect(card).toBeVisible();

  await page.locator("#delete-pin").fill(DEMO_PIN);
  await page.getByRole("button", { name: "삭제하기" }).click();
  await closeAlert(page, "삭제했어요");
  await expect(card).toHaveCount(0);
});

test("선택한 멤버는 남의 곡을 수정·삭제할 수 없다", async ({ page }) => {
  await openHome(page);
  await page.getByLabel("본인 이름 선택").selectOption("Jun");

  // Seeded song proposed by Emily.
  const card = page.locator("article").filter({ has: page.getByRole("heading", { name: "Don't Look Back in Anger" }) });
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: /수정|삭제/ })).toHaveCount(0);
});

test("선택한 멤버는 새로고침 후에도 유지된다", async ({ page }) => {
  await openHome(page);
  await page.getByLabel("본인 이름 선택").selectOption("Hana");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("본인 이름 선택")).toHaveValue("Hana");
});
