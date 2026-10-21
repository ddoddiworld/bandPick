import { expect, test, type Page } from "@playwright/test";

const DEMO_PIN = "021302";

async function closeAlert(page: Page, message: string | RegExp) {
  const alert = page.getByRole("alertdialog").filter({ has: page.locator("#alert-dialog-title") });
  await expect(alert).toContainText(message);
  await alert.getByRole("button", { name: "확인" }).click();
}

test("상태 API는 선택한 멤버의 투표와 곡별 집계를 돌려준다", async ({ request }) => {
  const state = await (await request.get("/api/state?member=Mina")).json();
  // Seed: Mina liked songs 1 and 3; song 2 has five likes.
  expect(state.myVotes).toEqual({ 1: "like", 3: "like" });
  expect(state.songs.find((song: { id: number }) => song.id === 2)).toMatchObject({ likes: 5, dislikes: 0 });
  expect(state.members.find((member: { name: string }) => member.name === "Mina").votedCount).toBe(2);
});

test("투표 API는 PIN과 진행 단계를 확인한다", async ({ request }) => {
  const wrongPin = await request.post("/api/votes", { data: { songId: 1, voter: "Mina", pin: "000000", value: "like" } });
  expect(wrongPin.status()).toBe(400);
  expect((await wrongPin.json()).error).toContain("이름 또는 PIN");

  // Seeded round is still nominating, so a correct PIN is rejected by the phase guard.
  const wrongPhase = await request.post("/api/votes", { data: { songId: 1, voter: "Mina", pin: DEMO_PIN, value: "like" } });
  expect(wrongPhase.status()).toBe(400);
  expect((await wrongPhase.json()).error).toContain("투표할 수 있는 단계가 아니에요");
});

test("투표 버튼은 PIN을 묻고 서버 응답을 그대로 안내한다", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("본인 이름 선택").selectOption("Mina");
  await page.getByRole("button", { name: "투표", exact: true }).click();
  await closeAlert(page, "투표 단계 미리보기");

  const card = page.locator("article").filter({ has: page.getByRole("heading", { name: "NO PAIN" }) });
  await expect(card.getByRole("button", { name: "👍 좋아요 5" })).toBeVisible();
  await card.getByRole("button", { name: /👎 싫어요/ }).click();
  await expect(page.getByRole("alertdialog", { name: "싫어요로 투표할까요?" })).toBeVisible();
  await page.locator("#vote-pin").fill(DEMO_PIN);
  await page.getByRole("button", { name: "투표하기" }).click();
  await closeAlert(page, "투표할 수 있는 단계가 아니에요");
});
