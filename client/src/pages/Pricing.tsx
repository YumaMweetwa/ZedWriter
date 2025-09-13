import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Pricing = () => {
  return (
    <div className="min-h-screen py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 data-testid="text-pricing-title" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Simple, Transparent Pricing</h2>
          <p data-testid="text-pricing-subtitle" className="mt-4 text-lg text-muted-foreground">Choose the service that fits your academic needs</p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Free Services */}
          <Card data-testid="card-free" className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Free Services</CardTitle>
              <p className="text-sm text-muted-foreground">Get started with our complimentary offerings</p>
              <p className="text-4xl font-bold tracking-tight text-foreground">Free</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground mb-8">
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Research title suggestions
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Initial consultation (30 minutes)
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Topic generator tool
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Study materials access
                </li>
              </ul>
              <Link href="/auth?mode=signup">
                <Button data-testid="button-free-get-started" className="w-full">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Research Proposal */}
          <Card data-testid="card-proposal" className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Research Proposal</CardTitle>
              <p className="text-sm text-muted-foreground">Comprehensive proposal writing assistance</p>
              <p className="text-4xl font-bold tracking-tight text-foreground">K500</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground mb-8">
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Complete proposal development
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Literature review assistance
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Methodology guidance
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Unlimited revisions
                </li>
              </ul>
              <Link href="/submit-work?type=proposal">
                <Button data-testid="button-proposal-choose" className="w-full">
                  Choose Proposal
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Dissertation */}
          <Card data-testid="card-dissertation" className="rounded-2xl shadow-sm relative">
            <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground">
              PROMO PRICE
            </Badge>
            <CardHeader>
              <CardTitle>Dissertation</CardTitle>
              <p className="text-sm text-muted-foreground">Complete dissertation support</p>
              <div className="flex items-center space-x-2">
                <span className="text-4xl font-bold tracking-tight text-foreground">K1000</span>
                <span className="text-lg text-muted-foreground line-through">K1500</span>
              </div>
              <p className="text-sm text-accent font-medium">Special price until Jan 1, 2025</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground mb-8">
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Full dissertation writing
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Data analysis support
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Chapter-by-chapter review
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Defense preparation
                </li>
              </ul>
              <Link href="/submit-work?type=dissertation">
                <Button data-testid="button-dissertation-choose" variant="secondary" className="w-full">
                  Choose Dissertation
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Data Analysis */}
          <Card data-testid="card-data-analysis" className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Data Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Statistical analysis and interpretation</p>
              <p className="text-4xl font-bold tracking-tight text-foreground">K400</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground mb-8">
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  SPSS/R analysis
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Results interpretation
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Charts and graphs
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Discussion support
                </li>
              </ul>
              <Link href="/submit-work?type=data_analysis">
                <Button data-testid="button-data-analysis-choose" className="w-full">
                  Choose Data Analysis
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card data-testid="card-data-collection" className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
              <p className="text-sm text-muted-foreground">Survey design and data gathering</p>
              <p className="text-4xl font-bold tracking-tight text-foreground">K400</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground mb-8">
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Survey design
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Data collection
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Quality assurance
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Data cleaning
                </li>
              </ul>
              <Link href="/submit-work?type=data_collection">
                <Button data-testid="button-data-collection-choose" className="w-full">
                  Choose Data Collection
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Custom Assignments */}
          <Card data-testid="card-assignment" className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Custom Assignments</CardTitle>
              <p className="text-sm text-muted-foreground">Tailored assistance for any assignment</p>
              <p className="text-4xl font-bold tracking-tight text-foreground">Custom</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground mb-8">
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Essays and reports
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Case studies
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Presentations
                </li>
                <li className="flex gap-x-3">
                  <i className="fas fa-check text-primary"></i>
                  Flexible pricing
                </li>
              </ul>
              <Link href="/submit-work?type=assignment">
                <Button data-testid="button-assignment-choose" className="w-full">
                  Get Quote
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
