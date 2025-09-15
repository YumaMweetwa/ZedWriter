import { Router, Route, Switch } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ToastSystem } from '@/components/ToastSystem';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { HomePage } from '@/pages/HomePage';
import { PricingPage } from '@/pages/PricingPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { TopicGeneratorPage } from '@/pages/TopicGeneratorPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { ChatPage } from '@/pages/ChatPage';
import { AuthPage } from '@/pages/AuthPage';
import { AboutPage } from '@/pages/AboutPage';
import { TermsPage } from '@/pages/TermsPage';
import { SupportPage } from '@/pages/SupportPage';
import { SubmissionWizard } from '@/components/SubmissionWizard';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

function App() {
  const [location] = useLocation();

  // Parse URL parameters for preselected work type
  const getPreselectedType = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || undefined;
  };

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <AppProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            
            <main className="flex-1">
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/pricing" component={PricingPage} />
                <Route path="/materials" component={MaterialsPage} />
                <Route path="/topic-generator" component={TopicGeneratorPage} />
                <Route path="/dashboard" component={DashboardPage} />
                <Route path="/admin" component={AdminPage} />
                <Route path="/chat" component={ChatPage} />
                <Route path="/submit">
                  {() => <SubmissionWizard preselectedType={getPreselectedType()} />}
                </Route>
                
                {/* Legal and Info pages */}
                <Route path="/about" component={AboutPage} />
                <Route path="/terms" component={TermsPage} />
                <Route path="/support" component={SupportPage} />
                
                {/* Authentication pages */}
                <Route path="/auth/signin" component={AuthPage} />
                <Route path="/auth/signup" component={AuthPage} />

                {/* 404 */}
                <Route>
                  {() => (
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <i className="fas fa-exclamation-triangle text-6xl text-muted-foreground mb-4"></i>
                        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
                        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
                        <a href="/" className="text-primary hover:text-primary/80">
                          Go back home
                        </a>
                      </div>
                    </div>
                  )}
                </Route>
              </Switch>
            </main>
            
            <Footer />
            <ToastSystem />
            <LoadingOverlay />
          </div>
        </Router>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
