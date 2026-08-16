"use client";

import { FormEvent, useEffect, useState } from "react";

type RoundStatus = "nominating" | "voting" | "closed";
type VoteValue = "like" | "dislike";
type SongType = "남성곡" | "여성곡";
type SongFilter = "전체" | SongType | "내가 올린 곡" | "인기순" | "전원 투표" | "전원 동의";
const positions = ["보컬", "기타", "베이스", "드럼", "키보드"] as const;
type Position = (typeof positions)[number];
type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

type Member = {
  id: number;
  name: string;
  position: Position;
  role: MemberRole;
  isActive: boolean;
  inviteStatus: "가입 완료" | "초대 대기";
};

type Song = {
  id: number;
  artist: string;
  title: string;
  url: string;
  note: string;
  proposer: string;
  songType: SongType;
  likes: number;
  dislikes: number;
};

type PersistedState = {
  round: null | {
    heroTitle: string;
    heroDescription: string;
  };
  members: Member[];
  songs: Song[];
};

async function fetchPersistedState(): Promise<PersistedState> {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) throw new Error("저장된 데이터를 불러오지 못했어요.");
  return response.json() as Promise<PersistedState>;
}

const initialMembers: Member[] = [
  { id: 1, name: "Emily", position: "기타", role: "OWNER", isActive: true, inviteStatus: "가입 완료" },
  { id: 2, name: "Jin", position: "보컬", role: "ADMIN", isActive: true, inviteStatus: "가입 완료" },
  { id: 3, name: "Mina", position: "키보드", role: "MEMBER", isActive: true, inviteStatus: "가입 완료" },
  { id: 4, name: "Noah", position: "베이스", role: "MEMBER", isActive: true, inviteStatus: "가입 완료" },
  { id: 5, name: "Sora", position: "드럼", role: "MEMBER", isActive: true, inviteStatus: "가입 완료" },
  { id: 6, name: "Jun", position: "기타", role: "MEMBER", isActive: true, inviteStatus: "가입 완료" },
  { id: 7, name: "Hana", position: "보컬", role: "MEMBER", isActive: true, inviteStatus: "가입 완료" },
];

const initialSongs: Song[] = [
  {
    id: 1,
    artist: "Oasis",
    title: "Don't Look Back in Anger",
    url: "https://www.youtube.com/results?search_query=Oasis+Don%27t+Look+Back+in+Anger",
    note: "다 같이 후렴을 부르면 공연 마지막 곡으로 좋을 것 같아요.",
    proposer: "Emily",
    songType: "남성곡",
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
    songType: "남성곡",
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
    songType: "여성곡",
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
  const [memberManagementOpen, setMemberManagementOpen] = useState(false);
  const [memberEditorOpen, setMemberEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [heroSettingsOpen, setHeroSettingsOpen] = useState(false);
  const [heroTitle, setHeroTitle] = useState("피자 한 판 고르듯,\n이번 달 합주곡을 골라요.");
  const [heroDescription, setHeroDescription] = useState("피자집브레이크타임 멤버들이 한 조각씩 의견을 더해요. 전원이 좋아요를 누르면 이번 달 셋리스트 후보가 됩니다.");
  const [songFilter, setSongFilter] = useState<SongFilter>("전체");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [notice, setNotice] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const currentUser = "Emily";
  const activeMembers = members.filter((member) => member.isActive);

  function applyPersistedState(state: PersistedState) {
    if (!state.round) return;
    setMembers(state.members);
    setSongs(state.songs);
    setHeroTitle(state.round.heroTitle);
    setHeroDescription(state.round.heroDescription);
  }

  async function refreshPersistedState() {
    try {
      applyPersistedState(await fetchPersistedState());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "저장된 데이터를 불러오지 못했어요.");
    }
  }

  useEffect(() => {
    void fetchPersistedState()
      .then((state) => {
        if (!state.round) return;
        setMembers(state.members);
        setSongs(state.songs);
        setHeroTitle(state.round.heroTitle);
        setHeroDescription(state.round.heroDescription);
      })
      .catch(() => setNotice("저장된 데이터를 불러오지 못했어요."));
  }, []);

  function getSongMetrics(song: Song) {
    const myVote = votes[song.id];
    const isDemoSelectedSong = status === "closed" && song.id === 2;
    const likeCount = isDemoSelectedSong ? activeMembers.length : song.likes + (myVote === "like" ? 1 : 0);
    const dislikeCount = isDemoSelectedSong ? 0 : song.dislikes + (myVote === "dislike" ? 1 : 0);
    return {
      myVote,
      likeCount,
      dislikeCount,
      everyoneVoted: likeCount + dislikeCount === activeMembers.length,
      unanimous: likeCount === activeMembers.length && dislikeCount === 0,
    };
  }

  const visibleSongs = songs
    .filter((song) => {
      if (songFilter === "전체" || songFilter === "인기순") return true;
      if (songFilter === "내가 올린 곡") return song.proposer === currentUser;
      if (songFilter === "전원 투표") return getSongMetrics(song).everyoneVoted;
      if (songFilter === "전원 동의") return getSongMetrics(song).unanimous;
      return song.songType === songFilter;
    })
    .sort((first, second) =>
      songFilter === "인기순"
        ? getSongMetrics(second).likeCount - getSongMetrics(first).likeCount
        : 0,
    );
  const maleSongCount = songs.filter((song) => song.songType === "남성곡").length;
  const femaleSongCount = songs.filter((song) => song.songType === "여성곡").length;
  const mySongCount = songs.filter((song) => song.proposer === currentUser).length;
  const completedNominators = activeMembers.filter(
    (member) => songs.filter((song) => song.proposer === member.name).length >= 2,
  ).length;
  const everyoneVotedCount = songs.filter((song) => getSongMetrics(song).everyoneVoted).length;
  const unanimousSongCount = songs.filter((song) => getSongMetrics(song).unanimous).length;
  const highestLikeCount = Math.max(0, ...songs.map((song) => getSongMetrics(song).likeCount));
  const selectedSong = status === "closed" ? songs.find((song) => song.id === 2) : null;

  const completedVoters = status === "closed"
    ? activeMembers.length
    : status === "voting"
      ? Math.min(4, activeMembers.length)
      : 0;

  function showAlert(message: string) {
    setNotice(message);
    setAlertMessage(message);
  }

  function changeStatus(nextStatus: RoundStatus) {
    setStatus(nextStatus);
    setSongFilter("전체");
    setFormOpen(false);
    setEditingSong(null);
    if (nextStatus === "nominating") {
      setVotes({});
      showAlert("등록 단계로 돌아왔어요. 데모 투표는 초기화됐습니다.");
      return;
    }
    if (nextStatus === "closed") {
      showAlert("마감 화면 미리보기예요. 모든 곡과 투표 결과는 읽기 전용으로 잠겼어요.");
      return;
    }
    showAlert("투표 단계 미리보기예요. 곡 등록과 수정은 잠겨 있어요.");
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

  async function submitSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const artist = String(formData.get("artist") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const songType = String(formData.get("songType") ?? "남성곡") as SongType;
    const pin = String(formData.get("pin") ?? "").trim();

    if (!artist || !title || pin.length < 6) {
      showAlert("아티스트와 곡 제목, 6자리 이상의 PIN을 확인해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/songs", {
        method: editingSong ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editingSong?.id,
          artist,
          title,
          url,
          note,
          songType,
          proposer: currentUser,
          pin,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "곡 정보를 저장하지 못했어요.");

      await refreshPersistedState();
      form.reset();
      closeForm();
      showAlert(editingSong ? `${title} 정보를 수정했어요.` : `${artist}의 ${title}을(를) 등록했어요.`);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "곡 정보를 저장하지 못했어요.");
    }
  }

  function deleteSong(song: Song) {
    setDeleteTarget(song);
  }

  async function confirmDeleteSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteTarget) return;
    const pin = String(new FormData(event.currentTarget).get("deletePin") ?? "");
    try {
      const response = await fetch("/api/songs", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id, proposer: currentUser, pin }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "곡을 삭제하지 못했어요.");

      const deletedTitle = deleteTarget.title;
      setDeleteTarget(null);
      await refreshPersistedState();
      showAlert(`${deletedTitle}을(를) 목록에서 삭제했어요.`);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "곡을 삭제하지 못했어요.");
    }
  }

  function vote(songId: number, value: VoteValue) {
    setVotes((current) => ({ ...current, [songId]: value }));
    showAlert(value === "like" ? "좋아요를 선택했어요." : "싫어요를 선택했어요.");
  }

  function submitHeroSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("heroTitle") ?? "").trim();
    const description = String(formData.get("heroDescription") ?? "").trim();

    if (!title) {
      showAlert("메인 문구를 입력해주세요.");
      return;
    }

    setHeroTitle(title);
    setHeroDescription(description);
    setHeroSettingsOpen(false);
    showAlert("이번 달 메인 문구를 변경했어요.");
  }

  function openNewMemberForm() {
    setEditingMember(null);
    setMemberEditorOpen(true);
  }

  function openMemberEditForm(member: Member) {
    setEditingMember(member);
    setMemberEditorOpen(true);
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("memberName") ?? "").trim();
    const position = String(formData.get("memberPosition") ?? "") as Position;
    const role = editingMember?.role === "OWNER"
      ? "OWNER"
      : String(formData.get("memberRole") ?? "MEMBER") as MemberRole;

    if (!name || !positions.includes(position)) {
      showAlert("멤버 이름과 포지션을 확인해주세요.");
      return;
    }

    const duplicated = members.some(
      (member) => member.name.toLowerCase() === name.toLowerCase() && member.name !== editingMember?.name,
    );
    if (duplicated) {
      showAlert("이미 등록된 이름이에요.");
      return;
    }

    if (editingMember) {
      setMembers((current) => current.map((member) => member.name === editingMember.name ? { ...member, name, position, role } : member));
      setSongs((current) => current.map((song) => song.proposer === editingMember.name ? { ...song, proposer: name } : song));
      showAlert(`${name} 멤버 정보를 수정했어요.`);
    } else {
      setMembers((current) => [...current, { id: Date.now(), name, position, role, isActive: true, inviteStatus: "초대 대기" }]);
      showAlert(`${name} 멤버를 등록하고 초대 대기 상태로 추가했어요.`);
    }
    setMemberEditorOpen(false);
    setEditingMember(null);
  }

  function toggleMemberActive(member: Member) {
    if (status !== "nominating") {
      showAlert("투표 중에는 참여자 상태를 변경할 수 없어요.");
      return;
    }
    if (member.role === "OWNER") {
      showAlert("최고 관리자는 비활성화할 수 없어요.");
      return;
    }
    setMembers((current) => current.map((item) => item.name === member.name ? { ...item, isActive: !item.isActive } : item));
    showAlert(`${member.name} 멤버를 ${member.isActive ? "비활성" : "활성"} 상태로 변경했어요.`);
  }

  function issueInvite(member: Member) {
    const mockCode = `${member.name.slice(0, 2).toUpperCase()}-${String(member.name.length * 731).padStart(4, "0")}`;
    showAlert(`${member.name}님의 데모 초대 코드는 ${mockCode}입니다.`);
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
              <strong className="block text-lg leading-none tracking-[-0.03em]">피자집브레이크타임</strong>
              {/* <span className="mt-1 block text-[10px] font-bold tracking-[0.18em] text-[#c7442c]">MONTHLY SETLIST CLUB</span> */}
            </span>
          </a>
          <button type="button" onClick={() => setMemberManagementOpen(true)} className="rounded-full border-2 border-[#2d2118] bg-[#ffd85c] px-3 py-2 text-xs font-black shadow-[2px_2px_0_#2d2118] transition hover:-translate-y-0.5 sm:px-4 sm:text-sm">
            ⚙ 멤버 관리
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
                  {status === "nominating" ? "곡 등록 중" : status === "voting" ? "투표 중" : "마감 완료"}
                </span>
                <span className="text-sm font-semibold text-white/75">2026년 8월 · SLICE OF THE MONTH</span>
                <button type="button" onClick={() => setHeroSettingsOpen(true)} className="rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20">
                  ✎ 관리자 문구 편집
                </button>
              </div>
              <h1 className="max-w-3xl whitespace-pre-line text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">{heroTitle}</h1>
              {heroDescription && <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-white/65">{heroDescription}</p>}
            </div>
            <div className="min-w-56 rotate-[1deg] rounded-3xl border-2 border-[#2d2118] bg-[#fff6df] p-5 text-[#2d2118] shadow-[5px_5px_0_#2d2118]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c7442c]">
                {status === "nominating" ? "등록 마감" : status === "voting" ? "투표 현황" : "최종 결과"}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {status === "nominating" ? "D-5" : status === "voting" ? `${completedVoters}/${activeMembers.length}` : "CLOSED"}
              </p>
              <p className="mt-1 text-sm text-[#6e5848]">
                {status === "nominating" ? "8월 21일 오후 10시" : status === "voting" ? `${activeMembers.length - completedVoters}명이 아직 투표 전이에요` : "8월 28일 오후 10시 마감"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-[#2d2118] bg-[#ffe9a7] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#787d70]">프로토타입 단계 미리보기</p>
            <p className="mt-1 text-sm text-[#51564c]">세 단계를 눌러 등록부터 최종 결과까지 확인해보세요.</p>
          </div>
          <div className="grid grid-cols-3 rounded-xl bg-[#e7e3da] p-1" aria-label="진행 단계 미리보기">
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
            <button
              type="button"
              onClick={() => changeStatus("closed")}
              aria-pressed={status === "closed"}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${status === "closed" ? "bg-white text-[#1d201b] shadow-sm" : "text-[#6b7065]"}`}
            >
              마감
            </button>
          </div>
        </section>

        {status === "closed" && selectedSong && (
          <section className="mt-8 overflow-hidden rounded-[2rem] border-2 border-[#2d2118] bg-[#ffd85c] shadow-[7px_7px_0_#2d2118]" aria-labelledby="selected-song-title">
            <div className="pizza-checks h-3 border-b-2 border-[#2d2118]" aria-hidden="true" />
            <div className="grid gap-5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8">
              <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[#2d2118] bg-[#c7442c] text-3xl shadow-[4px_4px_0_#2d2118]" aria-hidden="true">🏆</span>
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-[#a13b29]">AUGUST FINAL PICK</p>
                <h2 id="selected-song-title" className="mt-2 text-3xl font-semibold tracking-tight">{selectedSong.title}</h2>
                <p className="mt-1 font-medium text-[#6e5848]">{selectedSong.artist} · {selectedSong.proposer} 추천</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2d2118] bg-[#fff6df] px-5 py-4 text-center">
                <strong className="block text-2xl">👍 {activeMembers.length}/{activeMembers.length}</strong>
                <span className="mt-1 block text-xs font-bold text-[#6e5848]">전원 동의로 선정</span>
              </div>
            </div>
          </section>
        )}

        <p className="sr-only" role="status" aria-live="polite">{notice}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section aria-labelledby="songs-heading">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black tracking-[0.12em] text-[#c7442c]">ON THE MENU</p>
                <h2 id="songs-heading" className="mt-1 text-3xl font-semibold tracking-tight">이번 달 등록된 곡 {songs.length}</h2>
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

            <div className="sticky top-3 z-20 mb-5 rounded-2xl border-2 border-[#2d2118] bg-[#fff6df]/95 p-3 shadow-[3px_3px_0_#2d2118] backdrop-blur">
              <div className="flex gap-2 overflow-x-auto pb-0.5" aria-label="곡 목록 필터">
                {([
                  "전체",
                  "남성곡",
                  "여성곡",
                  "내가 올린 곡",
                  ...(status !== "nominating" ? ["인기순", "전원 투표", "전원 동의"] : []),
                ] as SongFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSongFilter(filter)}
                    aria-pressed={songFilter === filter}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${songFilter === filter ? "bg-[#2d2118] text-white" : "bg-white text-[#6e5848] hover:bg-[#ffe9a7]"}`}
                  >
                    {filter}
                    {filter === "전체"
                      ? ` ${songs.length}`
                      : filter === "남성곡"
                        ? ` ${maleSongCount}`
                        : filter === "여성곡"
                          ? ` ${femaleSongCount}`
                          : filter === "내가 올린 곡"
                            ? ` ${mySongCount}`
                            : filter === "전원 투표"
                              ? ` ${everyoneVotedCount}`
                              : filter === "전원 동의"
                                ? ` ${unanimousSongCount}`
                                : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {visibleSongs.map((song) => {
                const { myVote, likeCount, dislikeCount, unanimous } = getSongMetrics(song);
                const isMine = song.proposer === currentUser;
                const isPopular = status !== "nominating" && highestLikeCount > 0 && likeCount === highestLikeCount;
                const isSelected = status === "closed" && song.id === selectedSong?.id;

                return (
                  <article key={song.id} className="group flex min-h-64 flex-col rounded-3xl border-2 border-[#2d2118] bg-[#fffdf7] p-4 shadow-[4px_4px_0_#2d2118] transition hover:-translate-y-1 sm:p-5">
                    <div className="flex-1">
                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className={`rounded-full px-2.5 py-1 ${song.songType === "남성곡" ? "bg-[#e4edf7] text-[#345477]" : "bg-[#f8e4e9] text-[#86485a]"}`}>{song.songType}</span>
                              <span className="text-[#8b7767]">{song.proposer} PICK</span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-[#72776c]">{song.artist}</p>
                            <h3 className="mt-0.5 line-clamp-2 text-xl font-semibold tracking-tight">{song.title}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isSelected && (
                              <span className="w-fit rounded-full border-2 border-[#2d2118] bg-[#2d2118] px-3 py-1 text-xs font-black text-white">🏆 최종 선정</span>
                            )}
                            {isPopular && (
                              <span className="w-fit rounded-full border-2 border-[#2d2118] bg-[#c7442c] px-3 py-1 text-xs font-black text-white">🔥 인기곡</span>
                            )}
                            {unanimous && (
                              <span className="w-fit rounded-full border-2 border-[#2d2118] bg-[#ffd85c] px-3 py-1 text-xs font-black text-[#2d2118]">🍕 전원 동의</span>
                            )}
                          </div>
                        </div>
                        {song.note && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#62675d]">{song.note}</p>}
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                          {song.url && (
                            <a href={song.url} target="_blank" rel="noreferrer" className="rounded-full border border-[#1d201b]/10 px-3 py-1.5 font-semibold hover:bg-[#f3f0e9]">
                              ▶ 들어보기
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-[#1d201b]/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      {status === "nominating" ? (
                        <>
                          <p className="text-sm text-[#777c70]">투표가 시작되면 의견을 선택할 수 있어요.</p>
                          {isMine && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(song)}
                                aria-label={`${song.title} 수정`}
                                title="수정"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#1d201b]/12 text-base hover:bg-[#f3f0e9]"
                              >
                                <span aria-hidden="true">✎</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSong(song)}
                                aria-label={`${song.title} 삭제`}
                                title="삭제"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e65f3c]/30 text-sm text-[#c9492b] hover:bg-[#fff1ed]"
                              >
                                <span aria-hidden="true">🗑</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : status === "voting" ? (
                        <>
                          <p className="text-sm text-[#777c70]">마감 전까지 바꿀 수 있어요.</p>
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
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#6e5848]">🔒 마감된 결과는 변경할 수 없어요.</p>
                          <div className="flex gap-2">
                            <span className="rounded-full bg-[#edf3e5] px-4 py-2 text-sm font-bold text-[#3d5734]">👍 좋아요 {likeCount}</span>
                            <span className="rounded-full bg-[#f7e9e5] px-4 py-2 text-sm font-bold text-[#884536]">👎 싫어요 {dislikeCount}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {visibleSongs.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-[#9a8776] px-6 py-16 text-center text-sm text-[#6e5848]">이 조건에 맞는 곡이 아직 없어요.</div>
            )}
          </section>

          <aside className="space-y-5" aria-label="이번 달 참여 현황">
            <section className="rounded-3xl border-2 border-[#2d2118] bg-[#ffe9a7] p-5 shadow-[5px_5px_0_#2d2118]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">멤버</h2>
                <span className="text-sm font-semibold text-[#686d62]">{activeMembers.length}명</span>
              </div>
              <ul className="mt-5 space-y-3">
                {activeMembers.map((member, index) => {
                  const voted = status === "closed" || (status === "voting" && index < completedVoters);
                  const registeredSongCount = songs.filter((song) => song.proposer === member.name).length;
                  const nominationComplete = registeredSongCount >= 2;
                  return (
                    <li key={member.name} className="flex items-center justify-between gap-2 rounded-2xl bg-white/70 px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d9d3c7] text-xs font-bold">{member.name.slice(0, 1)}</span>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm">{member.name}</strong>
                          <span className="mt-0.5 block text-xs text-[#7a7f74]">{member.position}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs font-bold text-[#6e5848]">{registeredSongCount}/2곡</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${status === "nominating" ? nominationComplete ? "bg-[#dcebcf] text-[#3f6b34]" : "bg-[#f3e7c7] text-[#856b2e]" : voted ? "bg-[#dcebcf] text-[#3f6b34]" : "bg-[#eee9df] text-[#777166]"}`}>
                          {status === "nominating" ? nominationComplete ? "등록 완료" : "등록 중" : status === "closed" ? "마감 완료" : voted ? "투표 완료" : "미투표"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-3xl border-2 border-[#2d2118] bg-white p-5 shadow-[5px_5px_0_#2d2118]">
              <p className="text-xs font-black tracking-[0.15em] text-[#c7442c]">2 PICKS EACH</p>
              <h2 className="mt-2 text-lg font-semibold">내 제출 현황</h2>
              <div className="mt-4 flex items-end justify-between">
                <strong className="text-4xl">{mySongCount}<span className="text-lg text-[#8b7767]"> / 2곡</span></strong>
                <span className="text-3xl" aria-hidden="true">{mySongCount >= 2 ? "🍕" : "🍕"}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee5d5]">
                <div className="h-full rounded-full bg-[#c7442c] transition-all" style={{ width: `${Math.min(100, (mySongCount / 2) * 100)}%` }} />
              </div>
              <p className="mt-3 text-sm text-[#6e5848]">{mySongCount >= 2 ? "이번 달 추천을 모두 채웠어요!" : `${2 - mySongCount}곡을 더 추천해주세요.`}</p>
            </section>

            <section className="rounded-3xl border-2 border-[#2d2118] bg-[#c7442c] p-5 text-white shadow-[5px_5px_0_#2d2118]">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffd85c]">MONTHLY STATUS</p>
              {status === "nominating" ? (
                <>
                  <h2 className="mt-2 text-xl font-semibold">곡 등록 현황</h2>
                  <div className="mt-4 flex items-end justify-between">
                    <strong className="text-4xl">{completedNominators}<span className="text-lg text-white/65"> / {activeMembers.length}명</span></strong>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">2곡 완료 기준</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">
                    <div className="h-full rounded-full bg-[#ffd85c] transition-all" style={{ width: `${activeMembers.length ? (completedNominators / activeMembers.length) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/75">{completedNominators === activeMembers.length ? "전원이 추천을 완료했어요. 투표를 시작해도 좋아요!" : `${activeMembers.length - completedNominators}명이 아직 2곡을 채우는 중이에요.`}</p>
                </>
              ) : status === "voting" ? (
                <>
                  <h2 className="mt-2 text-xl font-semibold">투표 현황</h2>
                  <div className="mt-4 flex items-end justify-between">
                    <strong className="text-4xl">{completedVoters}<span className="text-lg text-white/65"> / {activeMembers.length}명</span></strong>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">{unanimousSongCount > 0 ? `🍕 후보 ${unanimousSongCount}곡` : "후보 기다리는 중"}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20">
                    <div className="h-full rounded-full bg-[#ffd85c] transition-all" style={{ width: `${activeMembers.length ? (completedVoters / activeMembers.length) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/75">{unanimousSongCount > 0 ? "전원 동의 곡이 탄생했어요! 필터에서 바로 확인해보세요." : `${activeMembers.length - completedVoters}명이 아직 투표 전이에요. 전원이 좋아요를 누른 곡이 후보가 됩니다.`}</p>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-xl font-semibold">이번 달 결과 확정</h2>
                  <div className="mt-4 flex items-end justify-between">
                    <strong className="text-4xl">{unanimousSongCount}<span className="text-lg text-white/65">곡</span></strong>
                    <span className="rounded-full bg-[#ffd85c] px-2.5 py-1 text-xs font-black text-[#2d2118]">🏆 최종 선정</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full w-full rounded-full bg-[#ffd85c]" /></div>
                  <p className="mt-3 text-sm leading-6 text-white/75">전원 투표를 완료했고 결과가 확정됐어요. 마감된 기록은 수정하거나 다시 열 수 없어요.</p>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>

      {memberManagementOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#12150f]/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="member-management-title" className="flex max-h-[92vh] w-full flex-col rounded-t-[2rem] border-[#2d2118] bg-[#fff6df] shadow-2xl sm:max-w-3xl sm:rounded-[2rem] sm:border-2">
            <div className="flex items-start justify-between gap-4 border-b-2 border-[#2d2118] p-6 sm:p-8">
              <div>
                <p className="text-sm font-black tracking-[0.12em] text-[#c7442c]">ADMIN · MEMBERS</p>
                <h2 id="member-management-title" className="mt-1 text-3xl font-semibold tracking-tight">멤버 관리</h2>
                <p className="mt-2 text-sm text-[#6e5848]">등록 멤버 {members.length}명 · 이번 달 참여 {activeMembers.length}명</p>
              </div>
              <button type="button" onClick={() => setMemberManagementOpen(false)} aria-label="멤버 관리 창 닫기" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ece7dc] text-xl">×</button>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8">
              {status !== "nominating" && (
                <div className="mb-5 rounded-2xl border border-[#c7442c]/30 bg-[#fff0e8] px-4 py-3 text-sm font-semibold text-[#8b3f2e]">🔒 {status === "voting" ? "투표 중에는 멤버 정보와 참여 상태를 변경할 수 없어요." : "마감된 월의 멤버 정보와 결과는 변경할 수 없어요."}</div>
              )}
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">등록된 멤버</h3>
                  <p className="mt-1 text-xs text-[#7a6b5e]">초대 코드는 프로토타입용으로 화면에서만 생성됩니다.</p>
                </div>
                <button type="button" onClick={openNewMemberForm} disabled={status !== "nominating"} className="shrink-0 rounded-full border-2 border-[#2d2118] bg-[#c7442c] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#2d2118] disabled:cursor-not-allowed disabled:bg-[#aaa39a] disabled:shadow-none">+ 멤버 등록</button>
              </div>

              <ul className="space-y-3">
                {members.map((member) => (
                  <li key={member.name} className={`rounded-2xl border-2 border-[#2d2118] p-4 ${member.isActive ? "bg-white" : "bg-[#e9e4da] opacity-70"}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ffd85c] font-black">{member.name.slice(0, 1)}</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="truncate">{member.name}</strong>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${member.role === "OWNER" ? "bg-[#2d2118] text-white" : member.role === "ADMIN" ? "bg-[#ffd85c] text-[#2d2118]" : "bg-[#eee9df] text-[#74685e]"}`}>{member.role}</span>
                            {!member.isActive && <span className="rounded-full bg-[#d9d3c7] px-2 py-0.5 text-[10px] font-black">비활성</span>}
                          </div>
                          <p className="mt-1 text-xs text-[#74685e]">{member.position} · {member.inviteStatus}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => issueInvite(member)} className="rounded-full border border-[#2d2118]/20 bg-[#fff6df] px-3 py-2 text-xs font-bold">초대 코드</button>
                        <button type="button" onClick={() => openMemberEditForm(member)} disabled={status !== "nominating"} className="rounded-full border border-[#2d2118]/20 bg-white px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">수정</button>
                        <button type="button" onClick={() => toggleMemberActive(member)} disabled={status !== "nominating" || member.role === "OWNER"} className="rounded-full border border-[#c7442c]/25 bg-white px-3 py-2 text-xs font-bold text-[#a53e2c] disabled:cursor-not-allowed disabled:opacity-40">{member.isActive ? "비활성화" : "활성화"}</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}

      {memberEditorOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-[#12150f]/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="member-editor-title" className="w-full rounded-t-[2rem] border-[#2d2118] bg-[#fff6df] p-6 shadow-2xl sm:max-w-md sm:rounded-[2rem] sm:border-2 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black tracking-[0.12em] text-[#c7442c]">MEMBER PROFILE</p>
                <h2 id="member-editor-title" className="mt-1 text-3xl font-semibold">{editingMember ? "멤버 정보 수정" : "새 멤버 등록"}</h2>
              </div>
              <button type="button" onClick={() => setMemberEditorOpen(false)} aria-label="멤버 등록 창 닫기" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ece7dc] text-xl">×</button>
            </div>
            <form key={editingMember?.name ?? "new-member"} onSubmit={submitMember} className="mt-7 space-y-5">
              <label className="grid gap-2 text-sm font-semibold">이름 또는 별명
                <input name="memberName" required maxLength={30} defaultValue={editingMember?.name} placeholder="예: Jisu" className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#c7442c] focus:ring-2 focus:ring-[#c7442c]/15" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">주 포지션
                <select name="memberPosition" defaultValue={editingMember?.position ?? "보컬"} className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#c7442c]">
                  {positions.map((position) => <option key={position} value={position}>{position}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">권한
                <select name="memberRole" defaultValue={editingMember?.role ?? "MEMBER"} disabled={editingMember?.role === "OWNER"} className="rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#c7442c] disabled:bg-[#e9e4da]">
                  <option value="MEMBER">일반 멤버</option>
                  <option value="ADMIN">부관리자</option>
                  {editingMember?.role === "OWNER" && <option value="OWNER">최고 관리자</option>}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setMemberEditorOpen(false)} className="rounded-full border-2 border-[#2d2118] bg-white px-5 py-3 font-bold">취소</button>
                <button type="submit" className="rounded-full border-2 border-[#2d2118] bg-[#c7442c] px-5 py-3 font-bold text-white">{editingMember ? "저장하기" : "등록하기"}</button>
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
              <fieldset>
                <legend className="text-sm font-semibold">곡 구분</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["남성곡", "여성곡"] as SongType[]).map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input type="radio" name="songType" value={type} defaultChecked={(editingSong?.songType ?? "남성곡") === type} className="peer sr-only" />
                      <span className="block rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 text-center text-sm font-semibold peer-checked:border-[#c7442c] peer-checked:bg-[#ffe9a7]">{type}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
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

      {heroSettingsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#12150f]/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="hero-settings-title" className="w-full rounded-t-[2rem] border-[#2d2118] bg-[#fff6df] p-6 shadow-2xl sm:max-w-xl sm:rounded-[2rem] sm:border-2 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black tracking-[0.12em] text-[#c7442c]">ADMIN MESSAGE</p>
                <h2 id="hero-settings-title" className="mt-1 text-3xl font-semibold tracking-tight">이번 달 문구 편집</h2>
                <p className="mt-2 text-sm leading-6 text-[#6e5848]">현재 월의 메인 화면에 보여줄 안내를 작성해요.</p>
              </div>
              <button type="button" onClick={() => setHeroSettingsOpen(false)} aria-label="문구 편집 창 닫기" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ece7dc] text-xl">×</button>
            </div>
            <form onSubmit={submitHeroSettings} className="mt-7 space-y-5">
              <label className="grid gap-2 text-sm font-semibold">
                메인 문구
                <textarea name="heroTitle" required rows={3} maxLength={80} defaultValue={heroTitle} className="resize-none rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-[#c7442c] focus:ring-2 focus:ring-[#c7442c]/15" />
                <span className="text-xs font-normal text-[#7a7f74]">줄바꿈도 화면에 그대로 반영됩니다.</span>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                설명 문구 <span className="font-normal text-[#7a7f74]">선택</span>
                <textarea name="heroDescription" rows={3} maxLength={200} defaultValue={heroDescription} className="resize-none rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#c7442c] focus:ring-2 focus:ring-[#c7442c]/15" />
              </label>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setHeroSettingsOpen(false)} className="rounded-full border-2 border-[#2d2118] bg-white px-5 py-3 font-bold">취소</button>
                <button type="submit" className="rounded-full border-2 border-[#2d2118] bg-[#c7442c] px-5 py-3 font-bold text-white">문구 적용</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#12150f]/55 p-5 backdrop-blur-sm" role="presentation">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" className="w-full max-w-sm rounded-[2rem] border-2 border-[#2d2118] bg-[#fff6df] p-6 text-center shadow-[7px_7px_0_#2d2118]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-[#2d2118] bg-[#ffd85c] text-2xl" aria-hidden="true">🗑</span>
            <h2 id="delete-dialog-title" className="mt-5 text-2xl font-semibold tracking-tight">이 곡을 삭제할까요?</h2>
            <p id="delete-dialog-description" className="mt-3 break-keep text-sm leading-6 text-[#6e5848]">
              <strong className="text-[#2d2118]">{deleteTarget.artist} · {deleteTarget.title}</strong><br />
              본인 확인을 위해 개인 PIN을 입력해주세요.
            </p>
            <form onSubmit={confirmDeleteSong} className="mt-5">
              <label className="sr-only" htmlFor="delete-pin">개인 PIN</label>
              <input id="delete-pin" name="deletePin" type="password" inputMode="numeric" minLength={6} required autoComplete="off" placeholder="개인 PIN 6자리 이상" className="w-full rounded-xl border border-[#1d201b]/15 bg-white px-4 py-3 text-center outline-none focus:border-[#c7442c] focus:ring-2 focus:ring-[#c7442c]/15" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border-2 border-[#2d2118] bg-white px-4 py-3 font-bold">취소</button>
                <button type="submit" className="rounded-full border-2 border-[#2d2118] bg-[#c7442c] px-4 py-3 font-bold text-white">삭제하기</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#12150f]/55 p-5 backdrop-blur-sm" role="presentation">
          <section role="alertdialog" aria-modal="true" aria-labelledby="alert-dialog-title" className="w-full max-w-sm rounded-[2rem] border-2 border-[#2d2118] bg-[#fff6df] p-6 text-center shadow-[7px_7px_0_#2d2118]">
            <span className="mx-auto grid h-14 w-14 rotate-[-4deg] place-items-center rounded-2xl border-2 border-[#2d2118] bg-[#ffd85c] text-2xl shadow-[3px_3px_0_#2d2118]" aria-hidden="true">🍕</span>
            <h2 id="alert-dialog-title" className="mt-6 text-xl font-semibold leading-8 tracking-tight">{alertMessage}</h2>
            <button type="button" autoFocus onClick={() => setAlertMessage(null)} className="mt-6 w-full rounded-full border-2 border-[#2d2118] bg-[#2d2118] px-5 py-3 font-bold text-white">확인</button>
          </section>
        </div>
      )}
    </main>
  );
}
