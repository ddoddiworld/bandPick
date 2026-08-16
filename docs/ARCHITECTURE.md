# 피자집브레이크타임 Monthly Picks 기술 구조

## 1. 현재 기술

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- vinext + Vite
- Cloudflare Worker 배포 구조
- Cloudflare D1 + Drizzle ORM

## 2. 역할 구분

```text
브라우저 UI
  ↓
Next.js 서버 기능/API
  ↓
권한 확인 및 입력값 검증
  ↓
Drizzle ORM
  ↓
Cloudflare D1
```

PIN 검증, 곡 수정·삭제 권한, 중복 투표 방지는 반드시 서버와 데이터베이스 계층에서 처리한다.

## 3. 예상 애플리케이션 구조

기능이 늘어나면 아래 구조를 기준으로 확장한다.

```text
app/
├── page.tsx                    # 현재 월 메인 화면
├── archive/page.tsx            # 지난 선정곡
├── admin/page.tsx              # 관리자 화면
├── api/                        # 서버 API
└── components/                 # 화면 컴포넌트
    ├── SongCard.tsx
    ├── SongForm.tsx
    ├── VoteButtons.tsx
    └── MonthlyStatus.tsx
db/
├── index.ts                    # DB 연결
└── schema.ts                   # 테이블 정의
lib/
├── validation/                 # 입력값 검증
├── auth/                       # PIN 및 관리자 확인
└── services/                   # 곡·투표 비즈니스 규칙
```

실제로 필요해질 때 폴더를 만든다. 아직 사용하지 않는 빈 구조를 미리 만들지 않는다.

## 4. 예정 데이터 모델

### `members`

- `id`
- `displayName`
- `normalizedName`: 공백과 대소문자를 정규화한 중복 확인용 이름
- `position`: `VOCAL | GUITAR | BASS | DRUMS | KEYBOARD`
- `pinHash`
- `role`: `MEMBER | ADMIN | OWNER`
- `isActive`
- `pinFailedCount`
- `pinLockedUntil`
- `createdAt`

### `memberInvites`

- `id`
- `memberId`
- `tokenHash`
- `expiresAt`
- `usedAt`
- `createdByMemberId`

최초 PIN 설정과 PIN 초기화에 사용하는 일회용 초대 코드다. 원문 코드는 저장하지 않는다.

### `adminCredentials`

- `memberId`
- `passwordHash`
- `failedCount`
- `lockedUntil`
- `updatedAt`

일반 PIN과 별개의 개별 관리자 암호를 저장한다. `ADMIN`과 `OWNER`만 가진다.

### `authSessions`

- `id`
- `memberId`
- `tokenHash`
- `assurance`: `MEMBER | ADMIN`
- `expiresAt`
- `revokedAt`

PIN 또는 관리자 암호 확인 후 발급하는 만료형 세션이다. 원문 세션 토큰은 저장하지 않는다.

### `monthlyRounds`

- `id`
- `year`
- `month`
- `revision`: 같은 달의 무효 처리 후 재투표 차수
- `status`: `nominating | voting | closed`
- `nominationDeadline`
- `votingDeadline`
- `heroTitle`
- `heroDescription`
- `selectedSongId`
- `closedAt`
- `invalidatedAt`
- `invalidatedByMemberId`

### `roundMembers`

- `roundId`
- `memberId`

이번 달의 전원 동의 기준이 되는 참여자 목록이다.

### `songs`

- `id`
- `roundId`
- `artist`
- `title`
- `songType`: `MALE | FEMALE`
- `url`
- `note`
- `createdByMemberId`
- `createdAt`
- `updatedAt`

### `votes`

- `songId`
- `memberId`
- `value`: `like | dislike`
- `updatedAt`

`songId + memberId`를 고유 키로 두어 한 사람의 중복 투표를 방지한다. 행이 없으면 미투표 상태다.

### `auditLogs`

- `id`
- `actorMemberId`
- `action`
- `targetType`
- `targetId`
- `metadata`
- `createdAt`

단계 되돌리기, 투표 초기화, 마감, PIN 초기화, 관리자 변경 같은 중요한 작업을 기록한다.

## 5. 보안 결정

- PIN 원문을 저장하거나 응답으로 반환하지 않는다.
- PIN 해시는 서버 환경에서 생성하고 검증한다.
- 초대 코드는 원문 대신 해시를 저장하고 1회 사용 또는 만료 후 폐기한다.
- PIN과 관리자 암호는 서로 다른 해시로 저장하고 반복 실패를 제한한다.
- 관리자마다 개별 암호와 세션을 사용하며 공유 관리자 암호를 만들지 않는다.
- 수정·삭제 요청마다 소유권과 현재 월의 진행 단계를 확인한다.
- 데이터베이스 접근은 서버 코드에서만 수행한다.
- 모든 입력값에 길이 제한과 형식 검증을 적용한다.
- 비밀값은 `.env` 또는 호스팅 환경 변수에 둔다.

## 6. 현재 설정 상태

- `.openai/hosting.json`의 D1 논리 바인딩은 `DB`이며 R2는 사용하지 않는다.
- `db/schema.ts`에 9개 테이블과 데이터베이스 제약 조건을 정의했다.
- 첫 Drizzle 마이그레이션은 `drizzle/0000_dapper_cardiac.sql`이다.
- `wrangler.local.jsonc`와 `npm run db:setup:local`로 로컬 D1 마이그레이션과 테스트 데이터를 준비한다.
- `/api/state`는 현재 월의 멤버·곡·투표 집계를 조회하고 `/api/songs`는 PIN을 검증한 뒤 곡을 생성·수정·삭제한다.
- 실제 원격 D1 데이터베이스 생성과 마이그레이션 적용은 아직 하지 않았다.
- `monthlyRounds.selectedSongId`는 순환 외래키를 피하기 위해 스키마상 정수로 저장하고, 결과 확정 서비스에서 같은 투표방의 곡인지 검증한다.
- `tests/rendered-html.test.mjs`는 피자집브레이크타임 메인 화면의 핵심 콘텐츠가 서버에서 렌더링되는지 확인한다.

## 7. 기술 결정 기록

### ADR-001: 로그인 없는 이름 + PIN 방식

- 이유: 소규모 밴드가 회원가입 없이 빠르게 참여하도록 하기 위함이다.
- 단점: 정식 계정보다 사칭과 PIN 공유에 취약하다.
- 대응: PIN 해시 저장, 시도 제한, 소유권 재검증을 적용한다.

### ADR-002: 월별 참여자 명단을 별도로 저장

- 이유: “전원 좋아요”를 계산하려면 그 달의 전체 참여자를 명확히 알아야 한다.
- 결과: 현재 활성 멤버 목록과 과거 월의 참여자 목록을 분리한다.

### ADR-003: 미투표와 싫어요를 분리

- 이유: 아직 참여하지 않은 사람과 명시적으로 반대한 사람은 의미가 다르다.
- 결과: 투표 행이 없으면 미투표로 계산한다.

### ADR-004: 사전 등록과 일회용 초대 코드

- 이유: 명단에 없는 사람의 참여와 다른 사람 이름의 선점을 막기 위함이다.
- 결과: 관리자가 참여자를 먼저 만들고, 참여자는 만료형 일회용 코드로 최초 PIN을 설정한다.

### ADR-005: `OWNER`와 `ADMIN` 권한 분리

- 이유: 두 명이 운영할 수 있게 하면서 관리자 관리와 전체 삭제 같은 최고 권한을 보호하기 위함이다.
- 결과: `OWNER`만 관리자를 지정·해제하고 최고 관리자 권한을 이전할 수 있다.

### ADR-006: 관리자 전용 개별 암호

- 이유: 일반 PIN만으로 관리자 권한을 보호하기에는 부족하고 공유 암호는 작업자를 추적하기 어렵기 때문이다.
- 결과: 각 관리자는 개인 PIN과 별개의 12자 이상 관리자 암호 및 유효기간이 있는 세션을 사용한다.

### ADR-007: 단계 되돌리기와 마감 불변성

- 이유: 수정된 곡에 기존 투표가 남는 오류를 막고 과거 결과를 신뢰할 수 있게 하기 위함이다.
- 결과: 투표에서 등록 단계로 돌아가면 기존 투표를 모두 삭제하며, 마감된 월은 수정하거나 다시 열지 않는다.

### ADR-008: 관리자 중심의 단일 주 포지션 관리

- 이유: 멤버 구성을 쉽게 확인하되 사진이나 소개글을 포함한 개인 프로필 기능은 필요하지 않기 때문이다.
- 결과: 멤버는 보컬, 기타, 베이스, 드럼, 키보드 중 하나만 주 포지션으로 저장하며 관리자가 멤버 관리 화면에서 변경한다.

### ADR-009: 멤버 이름 중복 금지

- 이유: 로그인 계정 없이 이름과 PIN으로 본인을 확인하므로 같은 이름이 여러 명이면 대상을 안전하게 특정할 수 없다.
- 결과: 표시 이름을 정규화한 `normalizedName`에 고유 인덱스를 두며 공백과 대소문자만 다른 이름도 중복으로 처리한다.

### ADR-010: 같은 달 재투표 차수 저장

- 이유: 마감된 월을 다시 열지 않고 무효 처리 후 새 투표방을 만들려면 같은 연도와 월을 여러 번 저장할 수 있어야 한다.
- 결과: `year + month + revision`을 고유 키로 사용한다.
