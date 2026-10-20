import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members, roundMembers, songs, votes } from "@/db/schema";
import { normalizeMemberName } from "@/lib/auth/member";
import { positionLabels } from "@/lib/members";
import { getCurrentRound } from "@/lib/services/current-round";

export async function GET(request: Request) {
  const db = await getDb();
  const round = await getCurrentRound();
  // ponytail: "me" is the name chosen in the header, unauthenticated; a server session replaces this later.
  const me = normalizeMemberName(new URL(request.url).searchParams.get("member") ?? "");

  if (!round) {
    return Response.json({ round: null, members: [], songs: [], myVotes: {} });
  }

  const participantRows = await db
    .select({
      id: members.id,
      name: members.displayName,
      position: members.position,
      role: members.role,
      isActive: members.isActive,
      pinReady: members.pinHash,
      normalizedName: members.normalizedName,
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
    .select({ songId: votes.songId, memberId: votes.memberId, value: votes.value })
    .from(votes)
    .innerJoin(songs, eq(votes.songId, songs.id))
    .where(eq(songs.roundId, round.id));

  const totals = new Map<number, { likes: number; dislikes: number }>();
  const votedCounts = new Map<number, number>();
  const myId = participantRows.find((member) => member.normalizedName === me)?.id;
  const myVotes: Record<number, "like" | "dislike"> = {};
  for (const vote of voteRows) {
    const total = totals.get(vote.songId) ?? { likes: 0, dislikes: 0 };
    if (vote.value === "like") total.likes += 1;
    else total.dislikes += 1;
    totals.set(vote.songId, total);
    votedCounts.set(vote.memberId, (votedCounts.get(vote.memberId) ?? 0) + 1);
    if (vote.memberId === myId) myVotes[vote.songId] = vote.value;
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
      votedCount: votedCounts.get(member.id) ?? 0,
    })),
    songs: songRows.map((song) => ({
      ...song,
      songType: song.songType === "MALE" ? "남성곡" : "여성곡",
      url: song.url ?? "",
      note: song.note ?? "",
      ...(totals.get(song.id) ?? { likes: 0, dislikes: 0 }),
    })),
    myVotes,
  });
}
