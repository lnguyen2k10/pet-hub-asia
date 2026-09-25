-- Migration for User Management
-- Admins should be able to read all profiles and user_roles, and update user_roles

-- Profiles policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING ( has_role('admin', auth.uid()) );

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING ( has_role('admin', auth.uid()) );

-- User roles policies
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING ( has_role('admin', auth.uid()) );

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK ( has_role('admin', auth.uid()) );

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING ( has_role('admin', auth.uid()) );

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING ( has_role('admin', auth.uid()) );
