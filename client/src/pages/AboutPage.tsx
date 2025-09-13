import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/BackButton';
import { CONTACT_INFO } from '@/utils/constants';

export const AboutPage = () => {
  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="about-title">
            About Zedwriter
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your trusted academic research partner in Zambia, providing professional assistance for students across all disciplines.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-bullseye text-primary"></i>
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Zedwriter is dedicated to empowering Zambian students by providing high-quality academic research assistance services. 
              We understand the challenges students face in their academic journey and are committed to helping them succeed through 
              professional support, guidance, and expertise in research proposals, dissertations, assignments, and data analysis.
            </p>
          </CardContent>
        </Card>

        {/* Services Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-cogs text-primary"></i>
              What We Offer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    <i className="fas fa-file-alt mr-1"></i>
                    Research
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Research Proposals & Dissertations</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete research writing services with literature reviews, methodology, and analysis.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    <i className="fas fa-chart-bar mr-1"></i>
                    Data
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Data Analysis & Collection</h4>
                    <p className="text-sm text-muted-foreground">
                      SPSS, R analysis, survey design, and comprehensive data interpretation.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    <i className="fas fa-edit mr-1"></i>
                    Writing
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Academic Writing</h4>
                    <p className="text-sm text-muted-foreground">
                      Essays, assignments, case studies, and content writing with proper citations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    <i className="fas fa-users mr-1"></i>
                    Support
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">24/7 Student Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Dedicated assistance throughout your academic journey with expert guidance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Us */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-star text-primary"></i>
              Why Choose Zedwriter?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-graduation-cap text-2xl text-primary"></i>
                </div>
                <h4 className="font-semibold mb-2">Local Expertise</h4>
                <p className="text-sm text-muted-foreground">
                  Deep understanding of Zambian academic standards and institutional requirements.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clock text-2xl text-primary"></i>
                </div>
                <h4 className="font-semibold mb-2">Timely Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Committed to meeting your deadlines with quality work delivered on time.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-2xl text-primary"></i>
                </div>
                <h4 className="font-semibold mb-2">Quality Assurance</h4>
                <p className="text-sm text-muted-foreground">
                  Rigorous quality checks and unlimited revisions to ensure excellence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-phone text-primary"></i>
              Get In Touch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-envelope text-muted-foreground"></i>
                    <span data-testid="contact-email">{CONTACT_INFO.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fas fa-phone text-muted-foreground"></i>
                    <span data-testid="contact-phone">{CONTACT_INFO.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fab fa-whatsapp text-muted-foreground"></i>
                    <span data-testid="contact-whatsapp">{CONTACT_INFO.whatsapp}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Ready to Get Started?</h4>
                <p className="text-muted-foreground mb-4">
                  Join thousands of successful students who trust Zedwriter for their academic needs.
                </p>
                <div className="flex gap-3">
                  <a 
                    href="/submit" 
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    data-testid="submit-work-button"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Work
                  </a>
                  <a 
                    href={`https://wa.me/${CONTACT_INFO.whatsapp.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                    data-testid="whatsapp-button"
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};