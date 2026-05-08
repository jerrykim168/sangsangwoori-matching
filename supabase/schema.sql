-- ============================================================
-- 상상우리 매칭 시스템 — 초기 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체 복사/붙여넣기 후 실행
-- ============================================================

-- 1. seniors 테이블
create table if not exists public.seniors (
  id            bigint generated always as identity primary key,
  name          text        not null,
  region        text        not null,
  desired_job   text        not null,
  career_years  integer,
  created_at    timestamptz not null default now()
);

-- 2. jobs 테이블
create table if not exists public.jobs (
  id                    bigint generated always as identity primary key,
  title                 text        not null,
  region                text        not null,
  job_type              text        not null,
  required_career_years integer,
  created_at            timestamptz not null default now()
);

-- 3. matches 테이블
create table if not exists public.matches (
  id          bigint generated always as identity primary key,
  senior_id   bigint      not null references public.seniors(id) on delete cascade,
  job_id      bigint      not null references public.jobs(id) on delete cascade,
  score       integer     not null default 0,
  status      text        not null default 'pending'
                          check (status in ('pending', 'assigned', 'done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (senior_id, job_id)
);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- 4. RPC: 특정 시니어의 매칭 점수 재계산
create or replace function public.recalculate_matches_for_senior(p_senior_id bigint)
returns void language plpgsql as $$
declare
  v_senior public.seniors%rowtype;
  v_job    public.jobs%rowtype;
  v_score  integer;
begin
  select * into v_senior from public.seniors where id = p_senior_id;
  if not found then return; end if;

  for v_job in select * from public.jobs loop
    v_score := 0;
    if v_senior.region      = v_job.region   then v_score := v_score + 3; end if;
    if v_senior.desired_job = v_job.job_type  then v_score := v_score + 2; end if;
    if v_job.required_career_years is null
       or (v_senior.career_years is not null
           and v_senior.career_years >= v_job.required_career_years)
    then v_score := v_score + 1; end if;

    insert into public.matches (senior_id, job_id, score, status)
    values (p_senior_id, v_job.id, v_score, 'pending')
    on conflict (senior_id, job_id)
    do update set score = excluded.score, updated_at = now();
  end loop;
end;
$$;

-- 5. RPC: 특정 일자리의 매칭 점수 재계산
create or replace function public.recalculate_matches_for_job(p_job_id bigint)
returns void language plpgsql as $$
declare
  v_job    public.jobs%rowtype;
  v_senior public.seniors%rowtype;
  v_score  integer;
begin
  select * into v_job from public.jobs where id = p_job_id;
  if not found then return; end if;

  for v_senior in select * from public.seniors loop
    v_score := 0;
    if v_senior.region      = v_job.region   then v_score := v_score + 3; end if;
    if v_senior.desired_job = v_job.job_type  then v_score := v_score + 2; end if;
    if v_job.required_career_years is null
       or (v_senior.career_years is not null
           and v_senior.career_years >= v_job.required_career_years)
    then v_score := v_score + 1; end if;

    insert into public.matches (senior_id, job_id, score, status)
    values (v_senior.id, p_job_id, v_score, 'pending')
    on conflict (senior_id, job_id)
    do update set score = excluded.score, updated_at = now();
  end loop;
end;
$$;

-- 6. RLS 비활성화 (내부 관리 앱 — 필요시 활성화 후 정책 추가)
alter table public.seniors disable row level security;
alter table public.jobs    disable row level security;
alter table public.matches disable row level security;
