"use client";

import { FormEvent, useMemo, useState } from "react";

type RoundStatus = "nominating" | "voting";
type VoteValue = "like" | "dislike";
const positions = ["보컬", "기타", "베이스", "드럼", "키보드"] as const;
type Position = (typeof positions)[number];

type Member = {
  name: string;
  position: Position;
};

type Song = {
  id: number;
  artist: string;
  title: string;
  url: string;
  note: string;
  proposer: string;
  likes: number;
  dislikes: number;
};

const initialMembers: Member[] = [
  { name: "Emily", position: "기타" },
  { name: "Jin", position: "보컬" },
  { name: "Mina", position: "키보드" },
  { name: "Noah", position: "베이스" },
  { name: "Sora", position: "드럼" },
  { name: "Jun", position: "기타" },
];

const initialSongs: Song[] = [
  {
    id: 1,
    artist: "Oasis",
    title: "Don't Look Back in Anger",
    url: "https://www.youtube.com/results?search_query=Oasis+Don%27t+Look+Back+in+Anger",
    note: "다 같이 후렴을 부르면 공연 마지막 곡으로 좋을 것 같아요.",
    proposer: "Emily",
    likes: 4,
    dislikes: 0,
  },
  {
    id: 2,
    artist: "Silica Gel",
    title: "NO PAIN",
    url: "https://www.youtube.com/results?search_query=Silica+Gel+NO+PAIN",
    note: "신스와 기타 톤을 맞춰보는 재미가 있을 것 같아요.",
    proposer: "Mina",
    likes: 5,
    dislikes: 0,
  },
  {
    id: 3,
    artist: "DAY6",
    title: "한 페이지가 될 수 있게",
    url: "https://www.youtube.com/results?search_query=DAY6+한+페이지가+될+수+있게",
    note: "각 파트가 고르게 돋보이고 합주 에너지가 좋아요.",
    proposer: "Jin",
    likes: 3,
    dislikes: 1,
  },
];

export default function Home() {
  const [status, setStatus] = useState<RoundStatus>("nominating");
  const [members, setMembers] = useState(initialMembers);
  const [songs, setSongs] = useState(initialSongs);
  const [votes, setVotes] = useState<Record<number, VoteValue>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [notice, setNotice] = useState("곡 등록 마감까지 5일 남았어요.");
  const currentUser = "Emily";
  const currentMember = members.find((member) => member.name === currentUser);

  const completedVoters = useMemo(
    () => (status === "voting" ? 4 : 0),
    [status],
  );

  function changeStatus(nextStatus: RoundStatus) {
    setStatus(nextStatus);
    setFormOpen(false);
    setEditingSong(null);
    if (nextStatus === "nominating") {
      setVotes({});
      setNotice("등록 단계로 돌아왔어요. 데모 투표는 초기화됐습니다.");
      return;
    }
    setNotice("투표 단계 미리보기예요. 곡 등록과 수정은 잠겨 있어요.");
  }

  function openCreateForm() {
    setEditingSong(null);
    setFormOpen(true);
  }

  function openEditForm(song: Song) {
    setEditingSong(song);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingSong(null);
  }

  function submitSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const artist = String(formData.get("artist") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const pin = String(formData.get("pin") ?? "").trim();

    if (!artist || !title || pin.length < 6) {
      setNotice("아티스트와 곡 제목, 6자리 이상의 PIN을 확인해주세요.");
      return;
    }

    if (editingSong) {
      setSongs((current) =>
        current.map((song) =>
          song.id === editingSong.id
            ? { ...song, artist, title, url, note }
            : song,
        ),
      );
      setNotice(`${title} 정보를 수정했어요. PIN은 저장하지 않았습니다.`);
    } else {
      setSongs((current) => [
        {
          id: Date.now(),
          artist,
          title,
          url,
          note,
          proposer: currentUser,
          likes: 0,
          dislikes: 0,
        },
        ...current,
      ]);
      setNotice(`${artist}의 ${title}을(를) 등록했어요.`);
    }

    event.currentTarget.reset();
    closeForm();
  }

  function deleteSong(song: Song) {
    const approved = window.confirm(
      `${song.artist} - ${song.title}을(를) 삭제할까요?\n실제 서비스에서는 PIN을 다시 확인합니다.`,
    );
    if (!approved) return;
    setSongs((current) => current.filter((item) => item.id !== song.id));
    setNotice(`${song.title}을(를) 목록에서 삭제했어요.`);
  }

  function vote(songId: number, value: VoteValue) {
    setVotes((current) => ({ ...current, [songId]: value }));
    setNotice(value === "like" ? "좋아요를 선택했어요." : "싫어요를 선택했어요.");
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const position = String(formData.get("position") ?? "") as Position;
    if (!positions.includes(position)) return;

    setMembers((current) =>
      current.map((member) =>
        member.name === currentUser ? { ...member, position } : member,
      ),
    );
    setProfileOpen(false);
    setNotice(`내 포지션을 ${position}(으)로 변경했어요.`);
  }

  return (
    <main className="min-h-screen bg-[#fff6df] text-[#2d2118]">
      <header className="border-b-2 border-[#2d2118] bg-[#fff6df]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#main-content" className="flex items-center gap-3">
            <span className="grid h-11 w-11 rotate-[-4deg] place-items-center rounded-xl border-2 border-[#2d2118] bg-[#ffd85c] text-xl shadow-[3px_3px_0_#2d2118]">
              🍕
            </span>
            <span>
              <strong className="block text-lg leading-none tracking-[-0.03em]">PIZZA BREAK TIME</strong>
              <span className="mt-1 block text-[10px] font-bold tracking-[0.18em] text-[#c7442c]">MONTHLY SETLIST CLUB</span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="rounded-full border border-[#1d201b]/15 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
          >
            {currentUser} · {currentMember?.position ?? "포지션 미정"}
          </button>
        </div>
      </header>

      <div id="main-content" className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <section className="pizza-hero relative overflow-hidden rounded-[2rem] border-2 border-[#2d2118] bg-[#c7442c] text-white shadow-[8px_8px_0_#2d2118]">
          <div className="pizza-checks h-4 border-b-2 border-[#2d2118]" aria-hidden="true" />
          <div className="grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border-2 border-[#2d2118] bg-[#ffd85c] px-3 py-1 text-xs font-black text-[#2d2118] shadow-[2px_2px_0_#2d2118]">
                  {status === "nominating" ? "곡 등록 중" : "투표 중"}
                </span>
                <span className="text-sm font-semibold text-white/75">2026년 8월 · SLICE OF THE MONTH</span>
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                피자 한 판 고르듯,
                <br />이번 달 합주곡을 골라요.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
                피자브레이크타임 멤버들이 한 조각씩 의견을 더해요. 전원이 좋아요를 누르면 이번 달 셋리스트 후보가 됩니다.
              </p>
            </div>
            <div className="min-w-56 rotate-[1deg] rounded-3xl border-2 border-[#2d2118] bg-[#fff6df] p-5 text-[#2d2118] shadow-[5px_5px_0_#2d2118]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c7442c]">
                {status === "nominating" ? "등록 마감" : "투표 현황"}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {status === "nominating" ? "D-5" : `${completedVoters}/${members.length}`}
              </p>
              <p className="mt-1 text-sm text-[#6e5848]">
                {status === "nominating" ? "8월 21일 오후 10시" : "2명이 아직 투표 전이에요"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-[#2d2118] bg-[#ffe9a7] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#787d70]">프로토타입 단계 미리보기</p>
            <p className="mt-1 text-sm text-[#51564c]">두 단계를 눌러 등록과 투표 화면을 확인해보세요.</p>
          </div>
          <div className="grid grid-cols-2 rounded-xl bg-[#e7e3da] p-1" aria-label="진행 단계 미리보기">
            <button
              type="button"
              onClick={() => changeStatus("nominating")}
              aria-pressed={status === "nominating"}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${status === "nominating" ? "bg-white text-[#1d201b] shadow-sm" : "text-[#6b7065]"}`}
            >
              곡 등록
            </button>
            <button
              type="button"
              onClick={() => changeStatus("voting")}
              aria-pressed={status === "voting"}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${status === "voting" ? "bg-white text-[#1d201b] shadow-sm" : "text-[#6b7065]"}`}
            >
              투표
            </button>
          </div>
        </section>

        <p className="sr-only" role="status" aria-live="polite">{notice}</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section aria-labelledby="songs-heading">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black tracking-[0.12em] text-[#c7442c]">ON THE MENU</p>
                <h2 id="songs-heading" className="mt-1 text-3xl font-semibold tracking-tight">이번 달 곡 메뉴 {songs.length}</h2>
              </div>
              <button
                type="button"
                onClick={openCreateForm}
                disabled={status !== "nominating"}
                className="rounded-full border-2 border-[#2d2118] bg-[#c7442c] px-5 py-3 text-sm font-bold text-white shadow-[4px_4px_0_#2d2118] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#b6b2a9] disabled:shadow-none"
              >
                + 곡 등록하기
              </button>
            </div>

            <div className="space-y-4">
              {songs.map((song, index) => {
                const myVote = votes[song.id];
                const isMine = song.proposer === currentUser;
                const likeCount = song.likes + (myVote === "like" ? 1 : 0);
                const dislikeCount = song.dislikes + (myVote === "dislike" ? 1 : 0);
                const unanimous = likeCount === members.length && dislikeCount === 0;

                return (
                  <article key={song.id} className="group rounded-3xl border-2 border-[#2d2118] bg-[#fffdf7] p-5 shadow-[5px_5px_0_#2d2118] transition hover:-translate-y-1 sm:p-6">
                    <div className="flex gap-4 sm:gap-6">
                      <div className="grid h-14 w-14 shrink-0 rotate-[-3deg] place-items-center rounded-2xl border-2 border-[#2d2118] bg-[#ffd85c] text-xl font-black text-[#c7442c] sm:h-16 sm:w-16">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#72776c]">{song.artist}</p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{song.title}</h3>
                          </div>
                          {unanimous && (
                            <span className="w-fit rounded-full border-2 border-[#2d2118] bg-[#ffd85c] px-3 py-1 text-xs font-black text-[#2d2118]">🍕 전원 동의</span>
                          )}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#62675d]">{song.note}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-full bg-[#f3f0e9] px-3 py-1.5 text-[#62675d]">제안 {song.proposer}</span>
                          {song.url && (
                            <a href={song.url} target="_blank" rel="noreferrer" className="rounded-full border border-[#1d201b]/10 px-3 py-1.5 font-semibold hover:bg-[#f3f0e9]">
                              ▶ 들어보기
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#1d201b]/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      {status === "nominating" ? (
                        <>
                          <p className="text-sm text-[#777c70]">투표가 시작되면 의견을 선택할 수 있어요.</p>
                          {isMine && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => openEditForm(song)} className="rounded-full border border-[#1d201b]/12 px-4 py-2 text-sm font-semibold hover:bg-[#f3f0e9]">수정</button>
                              <button type="button" onClick={() => deleteSong(song)} className="rounded-full border border-[#e65f3c]/30 px-4 py-2 text-sm font-semibold text-[#c9492b] hover:bg-[#fff1ed]">삭제</button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-[#777c70]">현재 선택은 마감 전까지 바꿀 수 있어요.</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => vote(song.id, "like")}
                              aria-pressed={myVote === "like"}
                              className={`rounded-full px-4 py-2 text-sm font-bold transition ${myVote === "like" ? "bg-[#20271f] text-white" : "bg-[#edf3e5] text-[#3d5734] hover:bg-[#dcebcf]"}`}
                            >
                              👍 좋아요 {likeCount}
                            </button>
                            <button
                              type="button"
                              onClick={() => vote(song.id, "dislike")}
                              aria-pressed={myVote === "dislike"}
                              className={`rounded-full px-4 py-2 text-sm font-bold transition ${myVote === "dislike" ? "bg-[#7b3023] text-white" : "bg-[#f7e9e5] text-[#884536] hover:bg-[#f1d7d0]"}`}
                            >
                              👎 싫어요 {dislikeCount}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-5" aria-label="이번 달 참여 현황">
            <section className="rounded-3xl border-2 border-[#2d2118] bg-[#ffe9a7] p-5 shadow-[5px_5px_0_#2d2118]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">멤버</h2>
                <span className="text-sm font-semibold text-[#686d62]">{members.length}명</span>
              </div>
              <ul className="mt-5 space-y-3">
                {members.map((member, index) => {
                  const voted = status === "voting" && index < completedVoters;
                  return (
                    <li key={member.name} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d9d3c7] text-xs font-bold">{member.name.slice(0, 1)}</span>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{member.name}</strong>
                          <span className="mt-0.5 block text-xs text-[#7a7f74]">{member.position}</span>
                        </span>
                      </span>
                      <span className={`text-xs font-bold ${voted ? "text-[#3f6b34]" : "text-[#979b91]"}`}>
                        {status === "nominating" ? "참여" : voted ? "완료" : "미투표"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-3xl border-2 border-[#2d2118] bg-[#c7442c] p-5 text-white shadow-[5px_5px_0_#2d2118]">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffd85c]">HOUSE RULE</p>
              <h2 className="mt-2 text-xl font-semibold">한 판에 모두의 좋아요를 담아요.</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">한 명이라도 미투표이거나 싫어요를 선택하면 아직 피자가 완성되지 않았어요.</p>
            </section>
          </aside>
        </div>
      </div>

      {profileOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#12150f]/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="profile-form-title" className="w-full rounded-t-[2rem] bg-[#faf8f3] p-6 shadow-2xl sm:max-w-md sm:rounded-[2rem] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#e65f3c]">MY PROFILE</p>
                <h2 id="profile-form-title" className="mt-1 text-3xl font-semibold tracking-tight">내 포지션</h2>
                <p className="mt-2 text-sm leading-6 text-[#6c7167]">멤버 목록에 보여줄 주 포지션 하나만 선택해요.</p>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)} aria-label="프로필 창 닫기" className="grid h-10 w-10 place-items-center rounded-full bg-[#ece7dc] text-xl">×</button>
            </div>

            <form onSubmit={submitProfile} className="mt-7">
              <fieldset>
                <legend className="text-sm font-semibold">악기 포지션</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {positions.map((position) => (
                    <label key={position} className="cursor-pointer">
                      <input
                        type="radio"
                        name="position"
                        value={position}
                        defaultChecked={currentMember?.position === position}
                        className="peer sr-only"
                      />
                      <span className="block rounded-2xl border border-[#1d201b]/12 bg-white px-4 py-3 text-center text-sm font-semibold transition peer-checked:border-[#20271f] peer-checked:bg-[#20271f] peer-checked:text-white">
                        {position}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-7 flex gap-3">
                <button type="button" onClick={() => setProfileOpen(false)} className="flex-1 rounded-full border border-[#1d201b]/15 px-5 py-3 font-bold">취소</button>
                <button type="submit" className="flex-1 rounded-full bg-[#e65f3c] px-5 py-3 font-bold text-white">저장하기</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {formOpen && status === "nominating" && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#12150f]/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="song-form-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-[#faf8f3] p-6 shadow-2xl sm:max-w-xl sm:rounded-[2rem] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#e65f3c]">MONTHLY PICK</p>
                <h2 id="song-form-title" className="mt-1 text-3xl font-semibold tracking-tight">{editingSong ? "곡 정보 수정" : "새로운 곡 제안"}</h2>
              </div>
              <button type="button" onClick={closeForm} aria-label="곡 등록 창 닫기" className="grid h-10 w-10 place-items-center rounded-full bg-[#ece7dc] text-xl">×</button>
            </div>

            <form key={editingSong?.id ?? "new"} onSubmit={submitSong} className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  아티스트명
                  <input name="artist" required maxLength={80} defaultValue={editingSong?.artist} placeholder="예: Oasis" className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#e65f3c] focus:ring-2 focus:ring-[#e65f3c]/15" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  곡 제목
                  <input name="title" required maxLength={120} defaultValue={editingSong?.title} placeholder="예: Wonderwall" className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#e65f3c] focus:ring-2 focus:ring-[#e65f3c]/15" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                YouTube 또는 음원 링크 <span className="font-normal text-[#7a7f74]">선택</span>
                <input name="url" type="url" defaultValue={editingSong?.url} placeholder="https://" className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#e65f3c] focus:ring-2 focus:ring-[#e65f3c]/15" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                추천 메모 <span className="font-normal text-[#7a7f74]">선택</span>
                <textarea name="note" rows={3} maxLength={240} defaultValue={editingSong?.note} placeholder="이 곡을 함께 연주하고 싶은 이유를 적어주세요." className="resize-none rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#e65f3c] focus:ring-2 focus:ring-[#e65f3c]/15" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                개인 PIN
                <input name="pin" type="password" inputMode="numeric" minLength={6} required autoComplete="off" placeholder="6자리 이상" className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#e65f3c] focus:ring-2 focus:ring-[#e65f3c]/15" />
                <span className="text-xs font-normal leading-5 text-[#7a7f74]">프로토타입에서는 PIN을 저장하거나 검증하지 않습니다.</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 rounded-full border border-[#1d201b]/15 px-5 py-3 font-bold">취소</button>
                <button type="submit" className="flex-1 rounded-full bg-[#20271f] px-5 py-3 font-bold text-white">{editingSong ? "수정하기" : "등록하기"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
