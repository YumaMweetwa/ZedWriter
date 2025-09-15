import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export const Navbar = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                Z
              </div>
              <span className="text-xl font-bold text-foreground">Zedwriter</span>
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <a className={`transition-colors ${isActive('/') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-primary'}`}>
                Home
              </a>
            </Link>
            <Link href="/pricing">
              <a className={`transition-colors ${isActive('/pricing') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-primary'}`}>
                Pricing
              </a>
            </Link>
            <Link href="/materials">
              <a className={`transition-colors ${isActive('/materials') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-primary'}`}>
                Materials
              </a>
            </Link>
            <Link href="/submit-work">
              <a className={`transition-colors ${isActive('/submit-work') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-primary'}`}>
                Submit Work
              </a>
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      Hi, {user.displayName?.split(' ')[0] || 'User'}
                    </span>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <a className="w-full">Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="w-full">Manage Account</a>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <a className="w-full">Admin Panel</a>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/auth?mode=signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/">
              <a className="block py-2 text-base font-medium text-foreground">Home</a>
            </Link>
            <Link href="/pricing">
              <a className="block py-2 text-base font-medium text-muted-foreground">Pricing</a>
            </Link>
            <Link href="/materials">
              <a className="block py-2 text-base font-medium text-muted-foreground">Materials</a>
            </Link>
            <Link href="/submit-work">
              <a className="block py-2 text-base font-medium text-muted-foreground">Submit Work</a>
            </Link>
            {!user && (
              <>
                <hr className="my-2 border-border" />
                <Link href="/auth?mode=signin">
                  <a className="block py-2 text-base font-medium text-muted-foreground">Sign In</a>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button className="w-full mt-2">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
