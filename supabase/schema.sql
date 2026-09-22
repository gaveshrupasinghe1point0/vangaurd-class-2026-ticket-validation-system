-- ============================================================
-- Vanguard 2026 — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ----------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'sentinel' CHECK (role IN ('admin', 'sentinel')),
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 2. ATTENDEES TABLE
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.attendees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  nic          TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT NOT NULL,
  qr_token     TEXT NOT NULL UNIQUE,
  qr_used      BOOLEAN NOT NULL DEFAULT FALSE,
  qr_used_at   TIMESTAMPTZ,
  qr_used_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY
-- ----------------------------------------
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- 4. RLS POLICIES — profiles
-- ----------------------------------------

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ----------------------------------------
-- 5. RLS POLICIES — attendees
-- ----------------------------------------

DROP POLICY IF EXISTS "attendees_read_authenticated" ON public.attendees;
CREATE POLICY "attendees_read_authenticated"
  ON public.attendees
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "attendees_insert_authenticated" ON public.attendees;
CREATE POLICY "attendees_insert_authenticated"
  ON public.attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "attendees_update_authenticated" ON public.attendees;
CREATE POLICY "attendees_update_authenticated"
  ON public.attendees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------
-- 6. AUTO-CREATE PROFILE TRIGGER
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'sentinel'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------
-- 7. INDEXES
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendees_qr_token ON public.attendees (qr_token);
CREATE INDEX IF NOT EXISTS idx_attendees_qr_used  ON public.attendees (qr_used);
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON public.profiles  (role);
