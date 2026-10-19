import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members, roundMembers, songs, votes } from "@/db/schema";
import { getCurrentRound } from "@/lib/services/current-round";

const positionLabels = {
  VOCAL: "보컬",
  GUITAR: "기타",
  BASS: "베이스",
  DRUMS: "드럼",
  KEYBOARD: "키보드",
} as const;

export async function GET() {
  const db = await getDb();
  const round = await getCurrentRound();

  if (!round) {
    return Response.json({ round: null, members: [], songs: [] });
  }

  const participantRows = await db
    .select({
      id: members.id,
      name: members.displayName,
      position: members.position,
      role: members.role,
      isActive: members.isActive,
      pinReady: members.pinHash,
    })
    .from(roundMembers)
    .innerJoin(members, eq(roundMembers.memberId, members.id))
    .where(eq(roundMembers.roundId, round.id))
    .orderBy(asc(members.id));

  const songRows = await db
    .select({
      id: songs.id,
      artist: songs.artist,
      title: songs.title,
      songType: songs.songType,
      url: songs.url,
      note: songs.note,
      proposer: members.displayName,
    })
    .from(songs)
    .innerJoin(members, eq(songs.createdByMemberId, members.id))
    .where(eq(songs.roundId, round.id))
    .orderBy(asc(songs.id));

  const voteRows = await db
    .select({ songId: votes.songId, value: votes.value })
    .from(votes)
    .innerJoin(songs, eq(votes.songId, songs.id))
    .where(eq(songs.roundId, round.id));

  const totals = new Map<number, { likes: number; dislikes: number }>();
  for (const vote of voteRows) {
    const total = totals.get(vote.songId) ?? { likes: 0, dislikes: 0 };
    if (vote.value === "like") total.likes += 1;
    else total.dislikes += 1;
    totals.set(vote.songId, total);
  }

  return Response.json({
    round: {
      id: round.id,
      year: round.year,
      month: round.month,
      status: round.status,
      heroTitle: round.heroTitle,
      heroDescription: round.heroDescription ?? "",
      nominationDeadline: round.nominationDeadline.toISOString(),
      votingDeadline: round.votingDeadline.toISOString(),
      selectedSongId: round.selectedSongId,
    },
    members: participantRows.map((member) => ({
      id: member.id,
      name: member.name,
      position: positionLabels[member.position],
      role: member.role,
      isActive: member.isActive,
      inviteStatus: member.pinReady ? "가입 완료" : "초대 대기",
    })),
    songs: songRows.map((song) => ({
      ...song,
      songType: song.songType === "MALE" ? "남성곡" : "여성곡",
      url: song.url ?? "",
      note: song.note ?? "",
      ...(totals.get(song.id) ?? { likes: 0, dislikes: 0 }),
    })),
  });
}
