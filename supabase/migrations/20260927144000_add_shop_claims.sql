-- Create shop_claims table
CREATE TABLE IF NOT EXISTS public.shop_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    contact_phone TEXT,
    contact_email TEXT,
    proof_message TEXT,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to shop_claims
ALTER TABLE public.shop_claims ENABLE ROW LEVEL SECURITY;

-- Users can insert their own claims
CREATE POLICY "Users can create their own claims"
    ON public.shop_claims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own claims
CREATE POLICY "Users can view own claims"
    ON public.shop_claims FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can do everything on shop_claims"
    ON public.shop_claims FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at_shop_claims
    BEFORE UPDATE ON public.shop_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle shop claim approval
CREATE OR REPLACE FUNCTION public.process_approved_shop_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update the shop to assign the new owner
    UPDATE public.shops
    SET owner_id = NEW.user_id
    WHERE id = NEW.shop_id;
    
    -- Also give the user the 'shop_owner' role if they don't have it
    -- Using the existing set_role function (if not exists, it will just be ignored but let's assume it exists)
    -- Actually, it's safer to just insert into user_roles directly
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'shop_owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$$;

CREATE TRIGGER on_shop_claim_approved
    AFTER UPDATE ON public.shop_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.process_approved_shop_claim();