import { useLocation } from "wouter";
import { useRole } from "@/hooks/use-role";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { role, isLoading } = useRole();

  useEffect(() => {
    if (!isLoading && allowedRoles && role && !allowedRoles.includes(role)) {
      console.warn(`Access denied for role: ${role}. Required: ${allowedRoles.join(", ")}`);
      setLocation("/");
    }
  }, [role, isLoading, allowedRoles, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
