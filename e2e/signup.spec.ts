import { expect, test, type Page } from "@playwright/test";

// Matches JOIN_CODE in .dev.vars (README) and the CI e2e job.
const JOIN_CODE = "local-join-code";

async function openSignup(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("본인 이름 선택").selectOption({ label: "➕ 처음 왔어요 (가입하기)" });
  return page.getByRole("dialog", { name: "멤버 가입" });
}

async function fillSignup(page: Page, values: { name: string; pin?: string; pinConfirm?: string; joinCode?: string }) {
  const dialog = page.getByRole("dialog", { name: "멤버 가입" });
  await dialog.getByLabel("이름 또는 별명").fill(values.name);
  await dialog.getByLabel("주 포지션").selectOption("드럼");
  await dialog.getByLabel("개인 PIN", { exact: true }).fill(values.pin ?? "135790");
  await dialog.getByLabel("PIN 확인").fill(values.pinConfirm ?? values.pin ?? "135790");
  await dialog.getByLabel("밴드 참여 코드").fill(values.joinCode ?? JOIN_CODE);
  await dialog.getByRole("button", { name: "가입하기" }).click();
}

async function closeAlert(page: Page, message: string | RegExp) {
  const alert = page.getByRole("alertdialog").filter({ has: page.locator("#alert-dialog-title") });
  await expect(alert).toContainText(message);
  await alert.getByRole("button", { name: "확인" }).click();
}

test("참여 코드로 가입하면 바로 본인으로 선택되고 곡 등록 창을 열 수 있다", async ({ page }, testInfo) => {
  const name = `E2E${testInfo.project.name.slice(0, 1)}${Date.now() % 1_000_000_000}`;
  await openSignup(page);
  await fillSignup(page, { name });
  await closeAlert(page, "가입을 환영해요");

  await expect(page.getByLabel("본인 이름 선택")).toHaveValue(name);
  await page.getByRole("button", { name: "+ 곡 등록하기" }).click();
  await expect(page.getByRole("dialog", { name: "새로운 곡 제안" }).getByLabel(`${name}님의 개인 PIN`)).toBeVisible();
});

test("참여 코드가 틀리면 가입되지 않는다", async ({ page }) => {
  const dialog = await openSignup(page);
  await fillSignup(page, { name: `E2Ebad${Date.now() % 1_000_000}`, joinCode: "wrong-code" });
  await closeAlert(page, "밴드 참여 코드가 맞지 않아요");
  await expect(dialog).toBeVisible();
});

test("PIN 확인이 다르면 서버에 보내지 않는다", async ({ page }) => {
  await openSignup(page);
  await fillSignup(page, { name: "E2Emismatch", pin: "111111", pinConfirm: "222222" });
  await closeAlert(page, "PIN 확인이 일치하지 않아요");
});

test("이미 있는 이름으로는 가입할 수 없다", async ({ page }) => {
  await openSignup(page);
  await fillSignup(page, { name: "mina" });
  await closeAlert(page, "이미 가입된 이름이에요");
});
