import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if user has a role
        const { data: roleData } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (!roleData || roleData.length === 0) {
          // No role found, redirect to role selection
          navigate("/role-selection");
        } else {
          // Has role, redirect to dashboard
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          navigate("/dashboard");
        }
      } catch (error: any) {
        console.error("Error in auth callback:", error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
