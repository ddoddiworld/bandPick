export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
        <p className="mb-4 text-sm font-semibold tracking-widest text-violet-600">
          BANDPICK
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          우리 밴드의 다음 곡을 함께 골라요.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          React, TypeScript, Next.js와 Tailwind CSS 기본 설정이 완료됐습니다.
          이제 곡 등록과 투표 화면을 만들어가면 됩니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-2" aria-label="설치된 기술">
          {["Next.js", "React", "TypeScript", "Tailwind CSS"].map((item) => (
            <span
              key={item}
              className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
