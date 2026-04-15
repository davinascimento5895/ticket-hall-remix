import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTo = sessionStorage.getItem("auth_redirect_to") || "/eventos";

    const handleRedirect = (clear = true) => {
      if (clear) sessionStorage.removeItem("auth_redirect_to");
      navigate(redirectTo, { replace: true });
    };

    const processSession = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        console.warn("Auth callback session exchange failed:", error);
      }
      if (data?.session) {
        handleRedirect();
        return;
      }

      const { data: fallback } = await supabase.auth.getSession();
      if (fallback.session) {
        handleRedirect();
      }
    };

    processSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        handleRedirect();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Verificando sua conta...</p>
      </div>
    </div>
  );
}
