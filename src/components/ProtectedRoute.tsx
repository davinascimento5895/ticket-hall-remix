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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="h-8 w-8 mx-auto rounded-full bg-primary/20 animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?login=true" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to correct dashboard based on role
    const redirectMap = {
      admin: "/admin/dashboard",
      producer: "/producer/dashboard",
      buyer: "/meus-ingressos",
    };
    return <Navigate to={redirectMap[role] || "/"} replace />;
  }

  return <>{children}</>;
}
