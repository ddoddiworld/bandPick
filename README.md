# 피자집브레이크타임 Monthly Picks

밴드 **피자집브레이크타임** 멤버들이 매달 합주할 곡을 제안하고 함께 투표하는 서비스입니다.

현재 프론트엔드 기본 환경과 AI 개발 문서가 준비되어 있으며, 곡 등록과 투표 기능을 순서대로 구현하고 있습니다.

## 시작하기

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run db:setup:local
npm run dev
```

실행 후 브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run lint         # 코드 검사
npm run build        # 배포용 빌드 확인
npm run test         # 자동 테스트
npm run db:generate  # DB 마이그레이션 생성
npm run db:setup:local # 로컬 D1 마이그레이션 및 테스트 데이터 준비
```

로컬 테스트 멤버의 공통 데모 PIN은 `021302`입니다. 데모 PIN은 로컬 테스트 데이터에만 사용하며 실제 배포 데이터에는 포함하지 않습니다.

## 기술 구성

- Next.js
- React
- TypeScript
- Tailwind CSS
- Cloudflare D1
- Drizzle ORM

## 프로젝트 문서

- [`AGENTS.md`](./AGENTS.md): AI 개발 도구가 따라야 할 작업, 보안, 검증 규칙
- [`docs/PRODUCT.md`](./docs/PRODUCT.md): 제품 요구사항, 사용자 흐름, 투표 및 관리자 규칙
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): 기술 구조, 데이터 모델, 보안과 기술 결정
- [`docs/ROADMAP.md`](./docs/ROADMAP.md): 구현 순서, 진행 상태, 남은 결정 사항

AI와 개발할 때는 먼저 `AGENTS.md`와 `docs/` 문서를 확인합니다. 요구사항이나 기술 결정이 바뀌면 코드와 관련 문서를 함께 갱신합니다.
