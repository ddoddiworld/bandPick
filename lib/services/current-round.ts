import { and, desc, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { monthlyRounds } from "@/db/schema";

export async function getCurrentRound() {
  const db = await getDb();
  return db.query.monthlyRounds.findFirst({
    where: and(isNull(monthlyRounds.invalidatedAt)),
    orderBy: [
      desc(monthlyRounds.year),
      desc(monthlyRounds.month),
      desc(monthlyRounds.revision),
    ],
  });
}

// Bootstraps this month's round (KST) when none exists yet, e.g. on the first sign-up.
// ponytail: fixed default deadlines (21st/28th 22:00 KST); admin round settings replace this later.
export async function ensureCurrentRound() {
  const existing = await getCurrentRound();
  if (existing) return existing;

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const db = await getDb();
  await db.insert(monthlyRounds).values({
    year,
    month,
    nominationDeadline: new Date(Date.UTC(year, month - 1, 21, 13)),
    votingDeadline: new Date(Date.UTC(year, month - 1, 28, 13)),
    heroTitle: "피자 한 판 고르듯,\n이번 달 합주곡을 골라요.",
    heroDescription: "피자집브레이크타임 멤버들이 한 조각씩 의견을 더해요. 전원이 좋아요를 누르면 이번 달 셋리스트 후보가 됩니다.",
  }).onConflictDoNothing();
  return getCurrentRound();
}
