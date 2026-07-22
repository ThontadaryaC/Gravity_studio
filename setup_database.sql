-- Gravity Studios Security Hardening Migration Script
-- Run this in your Supabase SQL Editor to secure the database.

-- ==========================================
-- 1. BASE TABLE DEFINITIONS
-- ==========================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Public Profiles Table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user',
  updated_at timestamptz DEFAULT now()
);

-- Purchased Services / Projects Table
CREATE TABLE IF NOT EXISTS public.purchases (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  total_cost numeric NOT NULL,
  paid_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'advance_paid',
  date text NOT NULL,
  delivery_deadline timestamptz,
  postponed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payments / Transactions Log Table
CREATE TABLE IF NOT EXISTS public.transactions (
  reference text PRIMARY KEY,
  username text,
  email text,
  service text,
  amount numeric NOT NULL,
  method text,
  type text,
  date text,
  created_at timestamptz DEFAULT now()
);

-- Refund Claims Table
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id text REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  explanation text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  desc_text text,
  time_label text,
  is_read boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Gallery Assets Table
CREATE TABLE IF NOT EXISTS public.gallery_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

-- ==========================================
-- 2. HELPER FUNCTIONS & ROLE CHECKERS
-- ==========================================

-- Secure helper function to check if the current user has the admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. TRIGGERS FOR SECURITY AUTOMATIONS
-- ==========================================

-- Trigger: Automatically assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'user', -- Fixed low-privilege default
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      username = COALESCE(public.profiles.username, EXCLUDED.username);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prevent updates/inserts of the role column unless run by service_role
CREATE OR REPLACE FUNCTION public.check_profile_role()
RETURNS trigger AS $$
BEGIN
  -- We allow the database triggers and service_role to set any role.
  -- Client roles (authenticated, anon) cannot modify role.
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) AND (auth.role() <> 'service_role') THEN
      NEW.role := OLD.role; -- Ignore change, reset to old role
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF (NEW.role <> 'user') AND (auth.role() <> 'service_role') THEN
      NEW.role := 'user'; -- Enforce low-privilege default
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS restrict_profile_role ON public.profiles;
CREATE TRIGGER restrict_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role();

-- Trigger: Restrict user updates on notifications to only editing the is_read column
CREATE OR REPLACE FUNCTION public.check_notification_update()
RETURNS trigger AS $$
BEGIN
  IF (auth.role() <> 'service_role') AND NOT public.is_admin() THEN
    -- Check if fields other than is_read were changed
    IF (NEW.id <> OLD.id OR NEW.title <> OLD.title OR NEW.desc_text <> OLD.desc_text OR NEW.time_label <> OLD.time_label OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
      RAISE EXCEPTION 'Unauthorized: Normal users can only modify the is_read field';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS restrict_notification_update ON public.notifications;
CREATE TRIGGER restrict_notification_update
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.check_notification_update();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 4.1. PROFILES Table Policies
DROP POLICY IF EXISTS "Allow select profiles" ON public.profiles;
CREATE POLICY "Allow select profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert profile" ON public.profiles;
CREATE POLICY "Allow insert profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow update profile" ON public.profiles;
CREATE POLICY "Allow update profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow delete profile" ON public.profiles;
CREATE POLICY "Allow delete profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4.2. PURCHASES Table Policies
DROP POLICY IF EXISTS "Allow select purchases" ON public.purchases;
CREATE POLICY "Allow select purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Deny insert purchases to client" ON public.purchases;
CREATE POLICY "Deny insert purchases to client"
  ON public.purchases FOR INSERT TO authenticated
  WITH CHECK (public.is_admin()); -- Write-only for service_role/admins

DROP POLICY IF EXISTS "Deny update purchases to client" ON public.purchases;
CREATE POLICY "Deny update purchases to client"
  ON public.purchases FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin()); -- Write-only for service_role/admins

DROP POLICY IF EXISTS "Deny delete purchases to client" ON public.purchases;
CREATE POLICY "Deny delete purchases to client"
  ON public.purchases FOR DELETE TO authenticated
  USING (public.is_admin()); -- Write-only for service_role/admins

-- 4.3. TRANSACTIONS Table Policies
DROP POLICY IF EXISTS "Allow select transactions" ON public.transactions;
CREATE POLICY "Allow select transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email' OR public.is_admin());

DROP POLICY IF EXISTS "Deny write transactions to client" ON public.transactions;
CREATE POLICY "Deny write transactions to client"
  ON public.transactions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.4. REFUNDS Table Policies
DROP POLICY IF EXISTS "Allow select refunds" ON public.refunds;
CREATE POLICY "Allow select refunds"
  ON public.refunds FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchases
      WHERE purchases.id = refunds.purchase_id AND purchases.user_id = auth.uid()
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "Deny write refunds to client" ON public.refunds;
CREATE POLICY "Deny write refunds to client"
  ON public.refunds FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.5. NOTIFICATIONS Table Policies
DROP POLICY IF EXISTS "Allow select notifications" ON public.notifications;
CREATE POLICY "Allow select notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Allow users update own notification state" ON public.notifications;
CREATE POLICY "Allow users update own notification state"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Deny write notifications to client" ON public.notifications;
CREATE POLICY "Deny write notifications to client"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Deny delete notifications to client" ON public.notifications;
CREATE POLICY "Deny delete notifications to client"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4.6. GALLERY_ASSETS Table Policies (Publicly readable)
DROP POLICY IF EXISTS "Allow public select gallery assets" ON public.gallery_assets;
CREATE POLICY "Allow public select gallery assets"
  ON public.gallery_assets FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Deny write gallery assets to client" ON public.gallery_assets;
CREATE POLICY "Deny write gallery assets to client"
  ON public.gallery_assets FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.7. AUDIT_LOGS Table Policies
DROP POLICY IF EXISTS "Allow admins select audit logs" ON public.audit_logs;
CREATE POLICY "Allow admins select audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Deny client write audit logs" ON public.audit_logs;
CREATE POLICY "Deny client write audit logs"
  ON public.audit_logs FOR ALL TO authenticated
  USING (false); -- service_role bypasses RLS and can write logs

-- 4.8. RATE_LIMITS Table Policies
DROP POLICY IF EXISTS "Deny client rate limits access" ON public.rate_limits;
CREATE POLICY "Deny client rate limits access"
  ON public.rate_limits FOR ALL TO public
  USING (false); -- service_role bypasses RLS
