
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
