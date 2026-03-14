/**
 * Hook to check the current user's team member role for a given producer.
 * Returns null if the user IS the producer (full access).
 * Returns the TeamMemberRole if the user is a team member.
 * Returns undefined while loading.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TeamMemberRole } from "@/types";

interface TeamPermissions {
  isOwner: boolean;
  teamRole: TeamMemberRole | null;
  loading: boolean;
  canAccessFinancial: boolean;
  canAccessCheckin: boolean;
  canAccessReports: boolean;
  canManageEvents: boolean;
}

export function useTeamPermissions(producerId: string | undefined): TeamPermissions {
  const { user } = useAuth();

  const isOwner = !!user && user.id === producerId;

  const { data: teamRole = null, isLoading } = useQuery({
    queryKey: ["team-member-role", producerId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_team_members")
        .select("role")
        .eq("producer_id", producerId!)
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) return null;
      return (data?.role as TeamMemberRole) || null;
    },
    enabled: !!producerId && !!user?.id && !isOwner,
    staleTime: 60_000,
  });

  if (isOwner) {
    return {
      isOwner: true,
      teamRole: null,
      loading: false,
      canAccessFinancial: true,
      canAccessCheckin: true,
      canAccessReports: true,
      canManageEvents: true,
    };
  }

  const role = teamRole;

  return {
    isOwner: false,
    teamRole: role,
    loading: isLoading,
    canAccessFinancial: role === "admin",
    canAccessCheckin: role === "admin" || role === "manager" || role === "checkin_staff",
    canAccessReports: role === "admin" || role === "manager" || role === "reports_only",
    canManageEvents: role === "admin" || role === "manager",
  };
}
