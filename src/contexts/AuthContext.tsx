import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "producer" | "buyer" | "staff";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    cpf: string | null;
    document_number: string | null;
    document_type: "cpf" | "cnpj" | null;
    birth_date: string | null;
    cep: string | null;
    street: string | null;
    neighborhood: string | null;
    address_number: string | null;
    complement: string | null;
    city: string | null;
    state: string | null;
    producer_status: string | null;
    organizer_slug: string | null;
    organizer_bio: string | null;
    organizer_instagram: string | null;
    organizer_facebook: string | null;
    organizer_website: string | null;
    organizer_logo_url: string | null;
    organizer_banner_url: string | null;
  } | null;
  role: AppRole | null;
  allRoles: AppRole[];
  switchRole: (role: AppRole) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  allRoles: [],
  switchRole: () => {},
  loading: true,
  signOut: async () => {},
  refetchRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.info("[auth] ensureProfile start: " + JSON.stringify({
        userId,
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        sessionUserId: session?.user?.id ?? null,
      }));
      if (!session?.access_token) {
        console.warn("ensure-user-profile skipped: no active auth session");
        return;
      }
      const result = await supabase.functions.invoke("ensure-user-profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      console.info("[auth] ensureProfile result: " + JSON.stringify({
        error: result.error?.message ?? null,
        data: result.data ?? null,
      }));
    } catch (e) {
      console.warn("[auth] ensure-user-profile failed (non-blocking):", e);
    }
  };


  const fetchProfile = async (userId: string) => {
    // Tentativa 1: select completo de colunas existentes no esquema atual
    const result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    let profileData: AuthContextType["profile"] | null = null;

    if (!result.error && result.data) {
      profileData = result.data as unknown as AuthContextType["profile"];
      console.info("[auth] fetchProfile success: " + JSON.stringify({
        userId,
        selectedFields: "all-existing",
        hasProfile: !!profileData,
      }));
    } else {
      console.warn("[auth] fetchProfile full select failed, trying fallback: " + JSON.stringify({
        userId,
        code: (result.error as any)?.code ?? null,
        message: (result.error as any)?.message ?? null,
        hint: (result.error as any)?.hint ?? null,
        details: (result.error as any)?.details ?? null,
      }));
      const fallback = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, document_number, document_type")
        .eq("id", userId)
        .single();
      if (!fallback.error && fallback.data) {
        profileData = fallback.data as unknown as AuthContextType["profile"];
        console.info("[auth] fetchProfile fallback success", {
          userId,
          selectedFields: "safe",
          hasProfile: !!profileData,
        });
      } else {
        console.error("[auth] fetchProfile fallback also failed", {
          userId,
          code: (fallback.error as any)?.code ?? null,
          message: (fallback.error as any)?.message ?? null,
          hint: (fallback.error as any)?.hint ?? null,
          details: (fallback.error as any)?.details ?? null,
        });
      }
    }

    setProfile(profileData);
  };

  const ROLE_PRIORITY: AppRole[] = ["admin", "producer", "staff", "buyer"];

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data && data.length > 0) {
      const roles = data.map((r) => r.role as AppRole);
      setAllRoles(roles);
      const best = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0];
      setRole(best);
    } else {
      setAllRoles([]);
    }
  };

  const switchRole = (newRole: AppRole) => {
    if (allRoles.includes(newRole)) {
      setRole(newRole);
    }
  };

  useEffect(() => {
    let sessionHandled = false;

    const handleSession = (session: Session | null) => {
      console.info("[auth] handleSession: " + JSON.stringify({
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        expiresAt: session?.expires_at ?? null,
        accessTokenPrefix: session?.access_token ? session.access_token.slice(0, 12) : null,
      }));
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // ensureProfile é fire-and-forget: não bloqueia o carregamento do perfil/role.
        // Para usuários recorrentes o profile já existe — não faz sentido esperar a Edge Function.
        ensureProfile(session.user.id);
        fetchProfile(session.user.id);
        fetchRole(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
        setAllRoles([]);
      }
      setLoading(false);
    };

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        sessionHandled = true;
        // Use setTimeout to avoid Supabase deadlock on initial call
        setTimeout(() => handleSession(session), 0);
      }
    );

    // Fallback: check existing session only if onAuthStateChange hasn't fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!sessionHandled) {
        handleSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-redirect based on role after login
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect when we have a logged-in user and a resolved role
    if (!loading && user && role) {
      // If user is a producer and currently on the public landing (or root), send to producer dashboard
      if (role === "producer" && (location.pathname === "/" || location.pathname === "")) {
        navigate("/producer/dashboard", { replace: true });
      }
      // If user switched away from producer (e.g., logged out or changed role) we don't force navigation here
    }
  }, [loading, user, role, navigate, location.pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setAllRoles([]);
  };

  const refetchRole = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    console.info("[auth] refetchRole", {
      hasSession: !!s,
      userId: s?.user?.id ?? null,
      hasAccessToken: !!s?.access_token,
    });
    if (s?.user) {
      await Promise.all([fetchProfile(s.user.id), fetchRole(s.user.id)]);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, allRoles, switchRole, loading, signOut, refetchRole }}>
      {children}
    </AuthContext.Provider>
  );
}
