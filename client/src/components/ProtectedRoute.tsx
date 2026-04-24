import { useLocation } from "wouter";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredModule?: string;
}

export function ProtectedRoute({ children, allowedRoles, requiredModule }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { role, isLoading: isRoleLoading } = useRole();
  const { user, isLoading: isAuthLoading } = useAuth();

  const isLoading = isRoleLoading || isAuthLoading;

  useEffect(() => {
    if (isLoading) return;

    // 1. Role Check
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      console.warn(`Access denied for role: ${role}. Required: ${allowedRoles.join(", ")}`);
      setLocation("/");
      return;
    }

    // 2. Module Check
    if (requiredModule && user && user.isSuperAdmin !== 1) {
      const subscribed = (user.subscribedModules as string[]) || [];
      const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
      
      const isTrialUnlocked = isTrialActive && ["pos", "accounting", "production", "inventory"].includes(requiredModule);
      
      if (!subscribed.includes(requiredModule) && !isTrialUnlocked && requiredModule !== "inventory") {
        console.warn(`Module gating: ${requiredModule} is not active for user.`);
        setLocation(`/subscription?intent=buy&module=${requiredModule}`);
      }
    }
  }, [role, user, isLoading, allowedRoles, requiredModule, setLocation]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[40vh] w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  // Final check for rendering to avoid flashes
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;
  
  if (requiredModule && user && user.isSuperAdmin !== 1) {
    const subscribed = (user.subscribedModules as string[]) || [];
    const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
    const isTrialUnlocked = isTrialActive && ["pos", "accounting", "production", "inventory"].includes(requiredModule);
    
    if (!subscribed.includes(requiredModule) && !isTrialUnlocked && requiredModule !== "inventory") return null;
  }

  return <>{children}</>;
}
