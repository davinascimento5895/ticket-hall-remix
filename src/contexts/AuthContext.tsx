import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
    birth_date: string | null;
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
  loading: boolean;
  signOut: () => Promise<void>;
  refetchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
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
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (userId: string) => {
    try {
      await supabase.functions.invoke("ensure-user-profile");
    } catch (e) {
      console.warn("ensure-user-profile failed (non-blocking):", e);
    }
  };


  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, cpf, birth_date, city, state, producer_status, organizer_slug, organizer_bio, organizer_instagram, organizer_facebook, organizer_website, organizer_logo_url, organizer_banner_url")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role")
      .limit(1)
      .single();
    if (data) {
      setRole(data.role as AppRole);
    }
  };

  useEffect(() => {
    let sessionHandled = false;

    const handleSession = (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user.id).then(() => {
          fetchProfile(session.user.id);
          fetchRole(session.user.id);
        });
      } else {
        setProfile(null);
        setRole(null);
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const refetchRole = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      await Promise.all([fetchProfile(s.user.id), fetchRole(s.user.id)]);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut, refetchRole }}>
      {children}
    </AuthContext.Provider>
  );
}
