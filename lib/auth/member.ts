import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members } from "@/db/schema";
import { verifyPin } from "./pin";

const MAX_PIN_FAILURES = 5;
const PIN_LOCK_MILLISECONDS = 15 * 60 * 1000;

export function normalizeMemberName(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export async function authenticateMember(displayName: string, pin: string) {
  const db = await getDb();
  const normalizedName = normalizeMemberName(displayName);
  const member = await db.query.members.findFirst({
    where: eq(members.normalizedName, normalizedName),
  });

  if (!member || !member.isActive || !member.pinHash) {
    throw new Error("이름 또는 PIN을 확인해주세요.");
  }

  const now = new Date();
  if (member.pinLockedUntil && member.pinLockedUntil > now) {
    throw new Error("PIN 입력이 잠시 잠겼어요. 15분 뒤 다시 시도해주세요.");
  }

  if (!(await verifyPin(pin, member.pinHash))) {
    const failedCount = member.pinFailedCount + 1;
    await db
      .update(members)
      .set({
        pinFailedCount: failedCount >= MAX_PIN_FAILURES ? 0 : failedCount,
        pinLockedUntil: failedCount >= MAX_PIN_FAILURES
          ? new Date(Date.now() + PIN_LOCK_MILLISECONDS)
          : null,
        updatedAt: now,
      })
      .where(eq(members.id, member.id));
    throw new Error("이름 또는 PIN을 확인해주세요.");
  }

  if (member.pinFailedCount > 0 || member.pinLockedUntil) {
    await db
      .update(members)
      .set({ pinFailedCount: 0, pinLockedUntil: null, updatedAt: now })
      .where(eq(members.id, member.id));
  }

  return member;
}
