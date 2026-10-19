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
