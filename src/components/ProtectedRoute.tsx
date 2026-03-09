import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<"admin" | "producer" | "buyer">;
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

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to correct dashboard based on role
    const redirectMap = {
      admin: "/admin/dashboard",
      producer: "/producer/dashboard",
      buyer: "/eventos",
    };
    return <Navigate to={redirectMap[role] || "/"} replace />;
  }

  return <>{children}</>;
}
