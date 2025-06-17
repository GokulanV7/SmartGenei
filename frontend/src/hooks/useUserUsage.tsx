
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserUsage {
  messages_used: number;
  is_premium: boolean;
  premium_expires_at?: string;
}

export const useUserUsage = () => {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_usage')
        .select('messages_used, is_premium, premium_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user usage:', error);
        return;
      }

      if (data) {
        setUsage(data);
      } else {
        // Initialize user usage if not exists
        const { error: insertError } = await supabase
          .from('user_usage')
          .insert({
            user_id: user.id,
            messages_used: 0,
            is_premium: false
          });

        if (!insertError) {
          setUsage({ messages_used: 0, is_premium: false });
        }
      }
    } catch (error) {
      console.error('Error in fetchUsage:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSendMessage = () => {
    // Temporarily disabled chat limit for testing
    return true;
  };

  const incrementMessageCount = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Call the database function to increment message count
      const { data, error } = await supabase.rpc('increment_message_count', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error incrementing message count:', error);
        return false;
      }

      // Temporarily disabled limit check for testing
      // Limit check bypassed

      // Update local state
      await fetchUsage();
      return true;
    } catch (error) {
      console.error('Error in incrementMessageCount:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    usage,
    loading,
    canSendMessage,
    incrementMessageCount,
    refreshUsage: fetchUsage
  };
};
