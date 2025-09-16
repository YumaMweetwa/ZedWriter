import { useLocation } from 'wouter';
import { EmailPasswordSignIn } from '@/components/EmailPasswordSignIn';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export const AuthPage = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const handleAuthSuccess = () => {
    // Redirect to dashboard after successful authentication
    setLocation('/dashboard');
  };

  const handleGuestContinue = () => {
    // Create mock user for development/testing
    const mockUser = {
      id: 'guest-user-123',
      email: 'guest@example.com',
      firstName: 'Guest',
      lastName: 'User',
      studentId: null,
      phone: null,
      school: null,
      role: 'admin',
      profilePicture: null,
      referralCode: null,
      referralPoints: 0,
      totalPaid: 0,
      totalOwed: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      isAdmin: true,
    };
    
    // Mock user for development - redirect to dashboard
    console.log('Mock user login attempt', mockUser);
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {location === '/auth/signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {location === '/auth/signup' 
              ? 'Join Zedwriter to get expert academic assistance' 
              : 'Sign in to your Zedwriter account'
            }
          </p>
        </div>

        <div className="space-y-4">
          {/* Email/Password Authentication */}
          <EmailPasswordSignIn onSuccess={handleAuthSuccess} />
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {location === '/auth/signup' ? 'Already have an account?' : "Don't have an account?"}
          </span>
          {location === '/auth/signup' ? (
            <button
              onClick={() => setLocation('/auth/signin')}
              className="ml-1 text-primary hover:text-primary/80 font-medium"
              data-testid="link-to-signin"
            >
              Sign in
            </button>
          ) : (
            <button
              onClick={() => setLocation('/auth/signup')}
              className="ml-1 text-primary hover:text-primary/80 font-medium"
              data-testid="link-to-signup"
            >
              Sign up
            </button>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:text-primary/80">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};