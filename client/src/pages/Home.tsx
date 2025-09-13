import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <h1 data-testid="hero-title" className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Academic Excellence for <span className="text-primary">Zambian Students</span>
              </h1>
              <p data-testid="hero-description" className="mt-6 text-lg leading-8 text-muted-foreground">
                Professional research assistance, from proposals to dissertations. Get expert help with your academic journey and achieve the results you deserve.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link href="/auth?mode=signup">
                  <Button data-testid="button-get-started" size="lg">
                    Get Started Today
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button data-testid="button-learn-more" variant="outline" size="lg">
                    Learn more <span aria-hidden="true">→</span>
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-x-6">
                <div className="flex items-center gap-x-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm text-muted-foreground">Free consultation</span>
                </div>
                <div className="flex items-center gap-x-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm text-muted-foreground">24/7 support</span>
                </div>
                <div className="flex items-center gap-x-2">
                  <i className="fas fa-check-circle text-primary"></i>
                  <span className="text-sm text-muted-foreground">Guaranteed quality</span>
                </div>
              </div>
            </div>
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                  alt="Students studying together in a modern library environment" 
                  data-testid="img-hero-students"
                  className="w-full rounded-2xl shadow-2xl" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 data-testid="text-how-it-works-title" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How Zedwriter Works</h2>
            <p data-testid="text-how-it-works-subtitle" className="mt-4 text-lg text-muted-foreground">Simple steps to academic success</p>
          </div>
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <i className="fas fa-edit text-2xl text-primary"></i>
                  </div>
                </div>
                <h3 data-testid="text-step1-title" className="mt-6 text-lg font-semibold text-foreground">1. Submit Your Work</h3>
                <p data-testid="text-step1-description" className="mt-2 text-muted-foreground">Upload your requirements, files, and details through our simple 3-step submission process.</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <i className="fas fa-users text-2xl text-primary"></i>
                  </div>
                </div>
                <h3 data-testid="text-step2-title" className="mt-6 text-lg font-semibold text-foreground">2. Expert Review</h3>
                <p data-testid="text-step2-description" className="mt-2 text-muted-foreground">Our qualified team reviews your submission and provides professional assistance.</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <i className="fas fa-trophy text-2xl text-primary"></i>
                  </div>
                </div>
                <h3 data-testid="text-step3-title" className="mt-6 text-lg font-semibold text-foreground">3. Achieve Success</h3>
                <p data-testid="text-step3-description" className="mt-2 text-muted-foreground">Receive high-quality work that meets your academic standards and deadlines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 data-testid="text-trust-title" className="text-lg font-semibold text-foreground mb-8">Trusted by Students Across Zambia</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center">
              <div className="text-center">
                <div data-testid="text-stat-students" className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Students Helped</div>
              </div>
              <div className="text-center">
                <div data-testid="text-stat-success" className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div data-testid="text-stat-universities" className="text-3xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Universities</div>
              </div>
              <div className="text-center">
                <div data-testid="text-stat-support" className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 data-testid="text-contact-title" className="text-3xl font-bold tracking-tight text-foreground">Get in Touch</h2>
            <p data-testid="text-contact-subtitle" className="mt-4 text-lg text-muted-foreground">Have questions? We're here to help.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@zedwriter.com" 
                data-testid="link-email"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <i className="fas fa-envelope"></i>
                support@zedwriter.com
              </a>
              <a 
                href="https://wa.me/260123456789" 
                data-testid="link-whatsapp"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-md text-sm font-medium hover:bg-[#20B858] transition-colors"
              >
                <i className="fab fa-whatsapp"></i>
                WhatsApp Support
              </a>
              <a 
                href="tel:+260123456789" 
                data-testid="link-phone"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <i className="fas fa-phone"></i>
                +260 123 456 789
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
