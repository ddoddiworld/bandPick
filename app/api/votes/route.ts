import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { roundMembers, songs, votes } from "@/db/schema";
import { authenticateMember } from "@/lib/auth/member";
import { getCurrentRound } from "@/lib/services/current-round";

type VoteInput = {
  songId?: number;
  voter?: string;
  pin?: string;
  value?: "like" | "dislike";
};

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const input = await request.json() as VoteInput;
    if (!Number.isSafeInteger(input.songId)) throw new Error("투표할 곡을 찾지 못했어요.");
    if (input.value !== "like" && input.value !== "dislike") throw new Error("좋아요 또는 싫어요만 선택할 수 있어요.");

    const member = await authenticateMember(input.voter ?? "", input.pin ?? "");
    const round = await getCurrentRound();
    if (!round || round.status !== "voting") {
      throw new Error("현재는 투표할 수 있는 단계가 아니에요.");
    }

    const participant = await db.query.roundMembers.findFirst({
      where: and(eq(roundMembers.roundId, round.id), eq(roundMembers.memberId, member.id)),
    });
    if (!participant) throw new Error("이번 달 참여자만 투표할 수 있어요.");

    const song = await db.query.songs.findFirst({
      where: and(eq(songs.id, input.songId!), eq(songs.roundId, round.id)),
    });
    if (!song) throw new Error("투표할 곡을 찾지 못했어요.");

    // One row per (song, member): a repeat vote just changes the value.
    await db
      .insert(votes)
      .values({ songId: song.id, memberId: member.id, value: input.value })
      .onConflictDoUpdate({
        target: [votes.songId, votes.memberId],
        set: { value: input.value, updatedAt: new Date() },
      });
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청을 처리하지 못했어요.";
    return Response.json({ error: message }, { status: 400 });
  }
}
