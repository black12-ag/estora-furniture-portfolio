
-- 1. Add super_admin role for full access
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
