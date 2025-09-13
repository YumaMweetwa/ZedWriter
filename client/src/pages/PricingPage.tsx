import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WORK_TYPES } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

export const PricingPage = () => {
  const { user } = useAuth();

  const allServices = [
    {
      key: 'proposal',
      ...WORK_TYPES.proposal,
      featured: false,
    },
    {
      key: 'dissertation',
      ...WORK_TYPES.dissertation,
      featured: true,
      originalPrice: 1500,
      badge: 'Promo until Jan 1',
    },
    {
      key: 'data_analysis',
      ...WORK_TYPES.data_analysis,
      featured: false,
    },
    {
      key: 'data_collection',
      ...WORK_TYPES.data_collection,
      featured: false,
    },
    {
      key: 'assignment',
      ...WORK_TYPES.assignment,
      featured: false,
      customPricing: true,
    },
  ];

  const freeServices = [
    {
      icon: 'fas fa-lightbulb',
      title: 'Free Topic Generation',
      description: 'Get research topic suggestions based on your field of study',
    },
    {
      icon: 'fas fa-comments',
      title: 'Free Consultation',
      description: '30-minute consultation to discuss your academic needs',
    },
  ];

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Quality academic assistance at affordable rates for Zambian students
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {allServices.map((service) => (
            <Card 
              key={service.key}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                service.featured ? 'border-2 border-primary shadow-lg scale-105' : ''
              }`}
              data-testid={`pricing-card-${service.key}`}
            >
              {service.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">
                    {service.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <h3 className="text-2xl font-bold mb-4">{service.label}</h3>
                <div className="mb-6">
                  {service.originalPrice && (
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-2xl text-muted-foreground line-through">
                        {formatCurrency(service.originalPrice)}
                      </span>
                      <div className="text-4xl font-bold text-primary">
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  )}
                  {!service.originalPrice && (
                    <span className="text-4xl font-bold text-primary">
                      {service.customPricing ? 'Custom' : formatCurrency(service.price)}
                    </span>
                  )}
                  {!service.customPricing && (
                    <span className="text-muted-foreground">/{service.key}</span>
                  )}
                  {service.originalPrice && (
                    <p className="text-sm text-destructive font-medium mt-2">Promo until Jan 1</p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <i className="fas fa-check text-primary mr-3"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link 
                  href={user ? `/submit?type=${service.key}` : '/auth/signup'}
                  className="w-full"
                >
                  <Button 
                    className="w-full"
                    variant={service.featured ? 'default' : 'default'}
                    data-testid={`get-started-${service.key}`}
                  >
                    {service.customPricing ? 'Get Quote' : 'Get Started'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Free Services */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Free Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {freeServices.map((service, index) => (
              <div key={index} className="bg-muted rounded-xl p-6 text-center" data-testid={`free-service-${index}`}>
                <div className="bg-secondary text-secondary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={service.icon}></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join hundreds of successful students who trust Zedwriter for their academic success.
            </p>
            <Link href={user ? '/submit' : '/auth/signup'}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" data-testid="cta-get-started">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
