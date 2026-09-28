-- Add RLS policy allowing admins to update shops (for publishing)
CREATE POLICY "Admins can update shops" 
ON public.shops FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin')) 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete shops (optional but useful)
CREATE POLICY "Admins can delete shops" 
ON public.shops FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert shops
CREATE POLICY "Admins can insert shops" 
ON public.shops FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));
