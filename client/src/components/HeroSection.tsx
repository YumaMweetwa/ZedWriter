import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Academic Excellence{' '}
              <span className="text-primary">Made Easy</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Zambia's premier student research assistance platform. Get professional help with your proposals, dissertations, data analysis, and assignments from experienced academic writers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href={user ? "/submit" : "/auth/signup"}>
                <Button size="lg" className="w-full sm:w-auto" data-testid="hero-get-started">
                  <i className="fas fa-rocket mr-2"></i>
                  Get Started Today
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="hero-learn-more">
                  <i className="fas fa-play mr-2"></i>
                  See How It Works
                </Button>
              </Link>
            </div>
            {/* Trust badges */}
            <div className="flex items-center space-x-6 text-muted-foreground">
              <div className="flex items-center">
                <i className="fas fa-shield-alt text-primary mr-2"></i>
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-clock text-primary mr-2"></i>
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-star text-primary mr-2"></i>
                <span>500+ Students</span>
              </div>
            </div>
          </div>
          <div className="relative">
            {/* Academic success illustration */}
            <div className="relative bg-card border border-border rounded-2xl p-8 shadow-xl">
              {/* Modern dashboard preview image */}
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Student dashboard preview showing academic progress and submissions" 
                className="rounded-xl w-full h-auto"
              />
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground p-4 rounded-full">
                <i className="fas fa-trophy text-2xl"></i>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-accent text-accent-foreground p-3 rounded-full">
                <i className="fas fa-book text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
