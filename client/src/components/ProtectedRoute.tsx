import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole = 'user' }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation('/auth?mode=signin');
        return;
      }
      
      if (requiredRole === 'admin' && user.role !== 'admin') {
        setLocation('/');
        return;
      }
    }
  }, [user, loading, requiredRole, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h4 className="font-semibold mb-2">Authenticating...</h4>
          <p className="text-sm text-muted-foreground">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  if (!user || (requiredRole === 'admin' && user.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
};
