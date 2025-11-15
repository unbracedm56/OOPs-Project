import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProductViewHistory = (productId: string | undefined, userRole: string | null) => {
  useEffect(() => {
    const normalizedRole = userRole?.toLowerCase();

    // Only track for customers when they view a product
    if (!productId || normalizedRole !== 'customer') return;

    const trackView = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Upsert view history - update timestamp if exists, insert if new
        const { data, error } = await supabase
          .from('product_view_history')
          .upsert(
            {
              user_id: user.id,
              product_id: productId,
              viewed_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,product_id',
            }
          )
          .select();

        if (error) {
          console.error('Error tracking product view:', error);
        }
      } catch (err) {
        console.error('Failed to track product view:', err);
      }
    };

    trackView();
  }, [productId, userRole]);
};
