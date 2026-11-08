-- SASapps schema DRAFT v0.1 — 2026-11-02
-- NOT APPLIED. Review against dedicated Supabase project, SQL linter,
-- data privacy, exact approval workflow, and transaction constraints before use.
-- All example student names and payments in frontend are fictional.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  tagline text,
  about text,
  logo_path text,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true
);
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  check (start_date < end_date)
);
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id),
  academic_year_id uuid not null references public.academic_years(id),
  name text not null,
  level text not null,
  unique(campus_id,academic_year_id,name)
);
-- Assigned via trusted admin provisioning only, never user_metadata.
create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check(role in ('student','tu','super_admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id),
  user_id uuid unique references auth.users(id) on delete set null,
  nis text not null,
  nisn text,
  full_name text not null,
  guardian_name text,
  guardian_contact text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(campus_id,nis)
);
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  classroom_id uuid not null references public.classrooms(id),
  academic_year_id uuid not null references public.academic_years(id),
  status text not null default 'active' check(status in ('active','transferred','graduated','inactive')),
  created_at timestamptz not null default now(),
  unique(student_id,academic_year_id)
);
create table if not exists public.fee_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  recurring boolean not null default true
);
create table if not exists public.fee_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  fee_type_id uuid not null references public.fee_types(id),
  classroom_id uuid references public.classrooms(id),
  student_id uuid references public.students(id),
  amount_idr bigint not null check(amount_idr>=0),
  effective_from date not null,
  created_at timestamptz not null default now(),
  check (not (classroom_id is not null and student_id is not null))
);
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  academic_year_id uuid not null references public.academic_years(id),
  invoice_no text not null unique,
  period_start date not null,
  due_date date not null,
  status text not null default 'draft' check(status in ('draft','issued','partially_paid','paid','void')),
  issued_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  fee_type_id uuid references public.fee_types(id),
  description text not null,
  amount_idr bigint not null,
  line_kind text not null default 'fee' check(line_kind in ('fee','discount','adjustment')),
  created_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  amount_idr bigint not null check(amount_idr>0),
  method text not null check(method in ('cash','bank_transfer','other')),
  external_reference text,
  evidence_path text,
  status text not null default 'pending' check(status in ('pending','verified','rejected','voided')),
  received_at timestamptz,
  submitted_by uuid references auth.users(id),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  invoice_id uuid not null references public.invoices(id),
  amount_idr bigint not null check(amount_idr>0),
  created_at timestamptz not null default now(),
  unique(payment_id,invoice_id)
);
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check(request_type in ('payment_verify','fee_change','student_change','payment_void','adjustment')),
  entity_id uuid not null,
  before_data jsonb,
  proposed_data jsonb not null,
  approved_fields jsonb,
  reason text not null,
  status text not null default 'pending' check(status in ('pending','approved','partially_approved','rejected','cancelled')),
  requested_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check(reviewed_by is null or reviewed_by <> requested_by)
);
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id),
  receipt_number text not null unique,
  verification_token_hash text not null unique,
  issued_at timestamptz not null default now(),
  voided_at timestamptz
);
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references auth.users(id),
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_user on public.students(user_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
create index if not exists idx_invoices_student on public.invoices(student_id,period_start);
create index if not exists idx_invoices_due on public.invoices(due_date,status);
create index if not exists idx_invoice_lines_invoice on public.invoice_lines(invoice_id);
create index if not exists idx_payments_student on public.payments(student_id,status);
create index if not exists idx_payment_allocations_invoice on public.payment_allocations(invoice_id);
create index if not exists idx_approval_pending on public.approval_requests(status,created_at);
create index if not exists idx_fee_rates_year on public.fee_rates(academic_year_id,fee_type_id);
create index if not exists idx_receipts_payment on public.receipts(payment_id);

-- Small private lookup. SECURITY DEFINER is used only to avoid recursive RLS
-- on app_profiles. Function returns a boolean and cannot mutate data.
create or replace function private.is_staff()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.role in ('tu','super_admin')
  );
$$;
revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;

-- All public tables exposed by PostgREST need explicit RLS.
alter table public.school_settings enable row level security;
alter table public.campuses enable row level security;
alter table public.academic_years enable row level security;
alter table public.classrooms enable row level security;
alter table public.app_profiles enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.fee_types enable row level security;
alter table public.fee_rates enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.approval_requests enable row level security;
alter table public.receipts enable row level security;
alter table public.audit_events enable row level security;

-- Expose read endpoints explicitly; Supabase 2026 requires grants for
-- new Data API tables. Do not expose any write permissions to browser roles.
revoke all on public.school_settings,public.campuses,public.academic_years,
 public.classrooms,public.app_profiles,public.students,public.enrollments,
 public.fee_types,public.fee_rates,public.invoices,public.invoice_lines,
 public.payments,public.payment_allocations,public.approval_requests,
 public.receipts,public.audit_events from anon,authenticated;
grant select on public.school_settings to anon,authenticated;
grant select on public.campuses,public.academic_years,public.classrooms,
 public.app_profiles,public.students,public.enrollments,public.fee_types,
 public.fee_rates,public.invoices,public.invoice_lines,public.payments,
 public.payment_allocations,public.approval_requests,public.receipts,
 public.audit_events to authenticated;

create policy school_settings_public_read on public.school_settings
for select to anon,authenticated using (published = true);
create policy campuses_auth_read on public.campuses
for select to authenticated using (true);
create policy years_auth_read on public.academic_years
for select to authenticated using (true);
create policy classrooms_auth_read on public.classrooms
for select to authenticated using (true);
create policy profiles_scoped_read on public.app_profiles
for select to authenticated using (
 user_id = (select auth.uid()) or (select private.is_staff())
);
create policy students_scoped_read on public.students
for select to authenticated using (
 user_id = (select auth.uid()) or (select private.is_staff())
);
create policy enrollment_scoped_read on public.enrollments
for select to authenticated using (
 (select private.is_staff()) or exists
 (select 1 from public.students s where s.id=student_id and s.user_id=(select auth.uid()))
);
create policy fee_types_auth_read on public.fee_types
for select to authenticated using (true);
create policy rates_staff_read on public.fee_rates
for select to authenticated using ((select private.is_staff()));
create policy invoices_scoped_read on public.invoices
for select to authenticated using (
 (select private.is_staff()) or exists
 (select 1 from public.students s where s.id=student_id and s.user_id=(select auth.uid()))
);
create policy invoice_lines_scoped_read on public.invoice_lines
for select to authenticated using (
 (select private.is_staff()) or exists (
 select 1 from public.invoices i join public.students s on s.id=i.student_id
 where i.id=invoice_id and s.user_id=(select auth.uid()))
);
create policy payments_scoped_read on public.payments
for select to authenticated using (
 (select private.is_staff()) or exists
 (select 1 from public.students s where s.id=student_id and s.user_id=(select auth.uid()))
);
create policy allocations_scoped_read on public.payment_allocations
for select to authenticated using (
 (select private.is_staff()) or exists (
 select 1 from public.payments p join public.students s on s.id=p.student_id
 where p.id=payment_id and s.user_id=(select auth.uid()))
);
create policy approvals_staff_read on public.approval_requests
for select to authenticated using ((select private.is_staff()));
create policy receipts_scoped_read on public.receipts
for select to authenticated using (
 (select private.is_staff()) or exists (
 select 1 from public.payments p join public.students s on s.id=p.student_id
 where p.id=payment_id and s.user_id=(select auth.uid()))
);
create policy audit_staff_read on public.audit_events
for select to authenticated using ((select private.is_staff()));

-- Even privileged app paths may not UPDATE/DELETE audit_events.
create or replace function private.block_audit_mutation()
returns trigger language plpgsql set search_path = ''
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;
create trigger audit_events_no_mutation
before update or delete on public.audit_events
for each row execute function private.block_audit_mutation();

-- DDL only; do not insert real students/users/payments here.
-- Next: transaction-safe server procedures must enforce:
-- 1) verify approval actor cannot approve own request;
-- 2) partial approval per item with optimistic version check;
-- 3) payment allocations do not exceed verified payment amount;
-- 4) invoice balance cannot go negative;
-- 5) receipt issuance only for verified payment;
-- 6) rate limits on public QR verification endpoint;
-- 7) evidence_path uploaded to private Supabase Storage with strict bucket policies;
-- 8) indexes, RLS tests and Supabase security advisors before production.
