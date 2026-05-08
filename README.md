# 상상우리 시니어 매칭 시스템

시니어가 프로필을 등록하면 규칙 기반 점수 계산으로 적합한 일자리를 자동 매칭하고, 담당자 대시보드에서 추천 목록을 확인·관리할 수 있는 내부 관리 웹앱입니다.

**프로덕션 URL:** https://sangsangwoori-matching-three.vercel.app

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) · React 19 |
| 스타일 | Tailwind CSS v4 · shadcn/ui |
| 백엔드 | Supabase (PostgreSQL · PostgREST · PL/pgSQL RPC) |
| 배포 | Vercel |
| 테스트 | Playwright (E2E) |

---

## 주요 기능

### 프로필 등록 `/register`
- 이름·연락처·지역·희망 직종·경력 입력
- 제출 시 Supabase에 저장 + 전체 일자리 대상 매칭 점수 자동 재계산
- 등록 완료 후 해당 시니어의 추천 목록으로 바로 이동 가능

### 추천 일자리 목록 `/recommendations`
- 시니어 선택 피커 → 해당 시니어의 추천 목록 조회
- 매칭 점수 높은 순 정렬, 상위 5건 표시 + 더 보기 버튼
- 점수 배지: 6점 금색 · 4점 초록 · 2점 회색
- 항목별 점수 내역 표시 (지역 +3 ✓ / 직종 +2 ✓ / 경력 +1 ✓)
- 데스크톱: 시트형 테이블 (순위·일자리명·지역·직종·매칭점수·점수내역)
- 모바일: 카드형 레이아웃으로 자동 전환

### 담당자 대시보드 `/admin`
- 실시간 현황 카드: 미매칭 · 매칭 대기 · 배정 완료
- 시니어 목록: 전화번호·지역·직종·경력·최고점수·상태 표시, 배정완료 처리·삭제
- 일자리 목록: 등록·인라인 수정·삭제 (지역·직종·경력 요건 수정 가능)
- 모바일: 카드형 레이아웃으로 자동 전환

---

## 매칭 점수 기준 (최대 6점)

| 조건 | 점수 |
|---|---|
| 지역 일치 | +3 |
| 희망 직종 일치 | +2 |
| 경력 요건 충족 (또는 요건 없음) | +1 |

점수가 0점인 일자리는 추천 목록에서 제외됩니다.

---

## 반응형 UI

| 화면 | 데스크톱 (≥640px) | 모바일 (<640px) |
|---|---|---|
| 네비게이션 | 상상우리 · 프로필 등록 · 추천 목록 · 담당자 대시보드 | 상상우리 · 등록 · 추천 · 담당자 (축약) |
| 추천 결과 | 시트형 테이블 | 카드형 목록 |
| 담당자 대시보드 | 테이블 | 카드형 목록 |
| 메인 타이틀 | 6.4rem | clamp(2.4rem, 9vw, 6.4rem) |

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=<프로젝트 URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon 키>

# 개발 서버 기동
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## DB 초기화

`supabase/schema.sql` 전체를 Supabase 대시보드 **SQL Editor**에서 실행합니다.

- `seniors` / `jobs` / `matches` 테이블 생성
- `updated_at` 자동 갱신 트리거
- `recalculate_matches_for_senior` / `recalculate_matches_for_job` RPC 함수
- RLS 비활성화 (내부 관리 앱)

### 샘플 데이터 리셋

```bash
node reset-seniors.mjs
```

기존 seniors 전체 삭제 → 10명 재삽입 → matches 전체 재계산

---

## E2E 테스트

```bash
# 브라우저 바이너리 최초 1회 설치
npx playwright install chromium

# 테스트 실행 (dev 서버 자동 기동)
npx playwright test
```

| 파일 | 시나리오 |
|---|---|
| `tests/normal.spec.ts` | 서울/경비/5년 등록 → 성공 알림 + 6점 amber 배지 |
| `tests/invalid.spec.ts` | 이름 미입력 → 빨간 안내 박스 + DB 미삽입 확인 |
| `tests/no-match.spec.ts` | 조건 불일치 공고만 있을 때 "매칭 없음" 안내 박스 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 메인 홈 (히어로 이미지·CTA 버튼)
│   ├── register/page.tsx         # 시니어 프로필 등록
│   ├── recommendations/page.tsx  # 시니어 선택 피커 + 추천 목록
│   └── admin/page.tsx            # 담당자 대시보드
├── components/
│   ├── NavBar.tsx                # 반응형 네비게이션 바
│   └── ui/                       # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase.ts               # Supabase 클라이언트 · 타입 정의
│   └── matching.ts               # 점수 계산 · 매칭 재계산 로직
supabase/
└── schema.sql                    # DB 스키마 (테이블·RPC·트리거)
reset-seniors.mjs                 # 샘플 데이터 초기화 스크립트
tests/
├── helpers/db.ts                 # 테스트용 DB 리셋 유틸
├── normal.spec.ts
├── invalid.spec.ts
└── no-match.spec.ts
```
