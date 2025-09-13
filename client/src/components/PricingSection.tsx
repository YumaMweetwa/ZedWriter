import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WORK_TYPES } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

export const PricingSection = () => {
  const { user } = useAuth();

  const pricingCards = [
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
  ];

  const additionalServices = [
    {
      key: 'data_collection',
      ...WORK_TYPES.data_collection,
    },
    {
      key: 'assignment',
      ...WORK_TYPES.assignment,
      customPricing: true,
    },
  ];

  const freeServices = [
    {
      icon: 'fas fa-lightbulb',
      title: 'Topic Generation & Consultation',
    },
    {
      icon: 'fas fa-comments',
      title: 'Free Academic Consultation',
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Affordable Academic Support</h2>
          <p className="text-xl text-muted-foreground">Transparent pricing designed for Zambian students</p>
        </div>

        {/* Main Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {pricingCards.map((service) => (
            <Card 
              key={service.key}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                service.featured ? 'border-2 border-primary shadow-lg' : ''
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
                    <span className="text-lg text-muted-foreground line-through mr-2">
                      {formatCurrency(service.originalPrice)}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-primary">
                    {formatCurrency(service.price)}
                  </span>
                  <span className="text-muted-foreground">/{service.key}</span>
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
                    className={`w-full ${service.featured ? 'bg-primary hover:bg-primary/90' : ''}`}
                    variant={service.featured ? 'default' : 'default'}
                    data-testid={`get-started-${service.key}`}
                  >
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Services */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {additionalServices.map((service) => (
            <Card key={service.key} className="hover:shadow-md transition-shadow" data-testid={`additional-service-${service.key}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold mb-2">{service.label}</h4>
                    <p className="text-muted-foreground">
                      {service.customPricing ? 'Custom pricing based on requirements' : service.features[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {service.customPricing ? 'Custom' : formatCurrency(service.price)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free Services */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Free Services</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {freeServices.map((service, index) => (
                <div key={index} className="flex items-center justify-center" data-testid={`free-service-${index}`}>
                  <i className={`${service.icon} text-accent mr-3 text-xl`}></i>
                  <span className="text-lg">{service.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
