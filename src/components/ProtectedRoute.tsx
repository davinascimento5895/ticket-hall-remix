import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<"admin" | "producer" | "buyer" | "staff">;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Auth loading is handled by parent Suspense - don't show extra spinner
  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/?login=true" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    if (!role) {
      // Role is null after loading finished — user has no valid role, block access
      return <Navigate to="/" replace />;
    }
    if (!allowedRoles.includes(role)) {
      const redirectMap: Record<string, string> = {
        admin: "/admin/dashboard",
        producer: "/producer/dashboard",
        buyer: "/eventos",
        staff: "/staff",
      };
      return <Navigate to={redirectMap[role] || "/"} replace />;
    }
  }

  return <>{children}</>;
}
