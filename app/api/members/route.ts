import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members, roundMembers } from "@/db/schema";
import { normalizeMemberName } from "@/lib/auth/member";
import { hashPin } from "@/lib/auth/pin";
import { positionCodeFromLabel } from "@/lib/members";
import { ensureCurrentRound } from "@/lib/services/current-round";

type SignupInput = {
  name?: unknown;
  position?: unknown;
  pin?: unknown;
  joinCode?: unknown;
};

class SignupError extends Error {}

async function getJoinCode(): Promise<string | undefined> {
  const { env } = await import("cloudflare:workers");
  // Secret: `wrangler secret put JOIN_CODE` in production, `.dev.vars` locally.
  return env.JOIN_CODE || undefined;
}

function validate(input: SignupInput) {
  const name = typeof input.name === "string" ? input.name.normalize("NFKC").trim() : "";
  const pin = typeof input.pin === "string" ? input.pin : "";
  const position = positionCodeFromLabel(input.position);

  if (name.length < 1 || name.length > 20) throw new SignupError("이름은 1~20자로 입력해주세요.");
  if (!position) throw new SignupError("포지션을 선택해주세요.");
  if (pin.length < 6 || pin.length > 32) throw new SignupError("PIN은 6자 이상 32자 이하로 입력해주세요.");
  return { name, pin, position };
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as SignupInput;
    const joinCode = await getJoinCode();
    if (!joinCode) {
      return Response.json({ error: "가입 기능이 아직 설정되지 않았어요. 관리자에게 문의해주세요." }, { status: 503 });
    }
    if (input.joinCode !== joinCode) throw new SignupError("밴드 참여 코드가 맞지 않아요.");

    const { name, pin, position } = validate(input);
    const db = await getDb();
    const normalizedName = normalizeMemberName(name);
    const duplicate = await db.query.members.findFirst({ where: eq(members.normalizedName, normalizedName) });
    if (duplicate) throw new SignupError("이미 가입된 이름이에요. 다른 이름이나 별명을 써주세요.");

    // The very first member runs the band space.
    const [{ total }] = await db.select({ total: count() }).from(members);
    const [member] = await db.insert(members).values({
      displayName: name,
      normalizedName,
      position,
      pinHash: await hashPin(pin),
      role: total === 0 ? "OWNER" : "MEMBER",
    }).returning({ id: members.id, role: members.role });

    // Roster is locked once voting starts, so only join a round that is still nominating.
    const round = await ensureCurrentRound();
    if (round?.status === "nominating") {
      await db.insert(roundMembers).values({ roundId: round.id, memberId: member.id }).onConflictDoNothing();
    }

    return Response.json({ ok: true, name, role: member.role }, { status: 201 });
  } catch (error) {
    if (error instanceof SignupError) return Response.json({ error: error.message }, { status: 400 });
    console.error(error);
    return Response.json({ error: "가입을 처리하지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
