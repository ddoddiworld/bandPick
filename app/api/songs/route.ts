import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { songs } from "@/db/schema";
import { authenticateMember } from "@/lib/auth/member";
import { getCurrentRound } from "@/lib/services/current-round";

type SongInput = {
  id?: number;
  artist?: string;
  title?: string;
  songType?: "남성곡" | "여성곡";
  url?: string;
  note?: string;
  proposer?: string;
  pin?: string;
};

function cleanSongInput(input: SongInput) {
  const artist = input.artist?.trim() ?? "";
  const title = input.title?.trim() ?? "";
  const url = input.url?.trim() ?? "";
  const note = input.note?.trim() ?? "";

  if (!artist || artist.length > 80 || !title || title.length > 120) {
    throw new Error("아티스트와 곡 제목의 길이를 확인해주세요.");
  }
  if (input.songType !== "남성곡" && input.songType !== "여성곡") {
    throw new Error("곡 구분을 확인해주세요.");
  }
  if (url.length > 500 || note.length > 240) {
    throw new Error("링크 또는 추천 메모가 너무 길어요.");
  }
  if (url) {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("올바른 음원 링크를 입력해주세요.");
    }
  }

  return {
    artist,
    title,
    songType: input.songType === "남성곡" ? "MALE" as const : "FEMALE" as const,
    url: url || null,
    note: note || null,
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "요청을 처리하지 못했어요.";
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const input = await request.json() as SongInput;
    const member = await authenticateMember(input.proposer ?? "", input.pin ?? "");
    const round = await getCurrentRound();
    if (!round || round.status !== "nominating") {
      throw new Error("현재는 곡을 등록할 수 있는 단계가 아니에요.");
    }

    const values = cleanSongInput(input);
    await db.insert(songs).values({
      ...values,
      roundId: round.id,
      createdByMemberId: member.id,
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getDb();
    const input = await request.json() as SongInput;
    if (!Number.isSafeInteger(input.id)) throw new Error("수정할 곡을 찾지 못했어요.");
    const member = await authenticateMember(input.proposer ?? "", input.pin ?? "");
    const round = await getCurrentRound();
    if (!round || round.status !== "nominating") {
      throw new Error("현재는 곡을 수정할 수 있는 단계가 아니에요.");
    }

    const existing = await db.query.songs.findFirst({
      where: and(eq(songs.id, input.id!), eq(songs.roundId, round.id)),
    });
    if (!existing || existing.createdByMemberId !== member.id) {
      throw new Error("본인이 등록한 곡만 수정할 수 있어요.");
    }

    await db
      .update(songs)
      .set({ ...cleanSongInput(input), updatedAt: new Date() })
      .where(eq(songs.id, existing.id));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDb();
    const input = await request.json() as SongInput;
    if (!Number.isSafeInteger(input.id)) throw new Error("삭제할 곡을 찾지 못했어요.");
    const member = await authenticateMember(input.proposer ?? "", input.pin ?? "");
    const round = await getCurrentRound();
    if (!round || round.status !== "nominating") {
      throw new Error("현재는 곡을 삭제할 수 있는 단계가 아니에요.");
    }

    const existing = await db.query.songs.findFirst({
      where: and(eq(songs.id, input.id!), eq(songs.roundId, round.id)),
    });
    if (!existing || existing.createdByMemberId !== member.id) {
      throw new Error("본인이 등록한 곡만 삭제할 수 있어요.");
    }

    await db.delete(songs).where(eq(songs.id, existing.id));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
