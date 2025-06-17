
-- Create user_usage table to track message limits
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  messages_used INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user_usage
CREATE POLICY "Users can view their own usage" 
  ON public.user_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
  ON public.user_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
  ON public.user_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to initialize user usage when they first sign up
CREATE OR REPLACE FUNCTION public.initialize_user_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, messages_used, is_premium)
  VALUES (NEW.id, 0, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to initialize usage for new users
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.initialize_user_usage();

-- Function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  is_user_premium BOOLEAN;
BEGIN
  -- Get current usage and premium status
  SELECT messages_used, is_premium 
  INTO current_count, is_user_premium
  FROM public.user_usage 
  WHERE user_id = p_user_id;
  
  -- If user doesn't exist, create record
  IF NOT FOUND THEN
    INSERT INTO public.user_usage (user_id, messages_used, is_premium)
    VALUES (p_user_id, 1, false);
    RETURN 1;
  END IF;
  
  -- If premium user, don't limit
  IF is_user_premium THEN
    UPDATE public.user_usage 
    SET messages_used = messages_used + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN current_count + 1;
  END IF;
  
  -- For free users, check limit
  IF current_count >= 3 THEN
    RETURN -1; -- Indicates limit reached
  END IF;
  
  -- Increment count
  UPDATE public.user_usage 
  SET messages_used = messages_used + 1,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN current_count + 1;
END;
$$;
