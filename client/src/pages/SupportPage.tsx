import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CONTACT_INFO } from '@/utils/constants';

export const SupportPage = () => {
  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="support-title">
            Support Zedwriter
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Help us continue providing quality academic assistance to students across Zambia
          </p>
        </div>

        {/* Why Support Us */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-heart text-red-500"></i>
              Why Support Us?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Zedwriter is committed to empowering Zambian students through accessible, high-quality academic research assistance. 
              Your support helps us maintain and improve our services, reach more students, and continue making a positive impact 
              on education in Zambia.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <i className="fas fa-users mr-1"></i>
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Student Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      Every contribution helps us support more students in achieving their academic goals and career aspirations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <i className="fas fa-tools mr-1"></i>
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Platform Development</h4>
                    <p className="text-sm text-muted-foreground">
                      Support helps us maintain and improve our platform, adding new features and ensuring reliable service.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <i className="fas fa-graduation-cap mr-1"></i>
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Educational Resources</h4>
                    <p className="text-sm text-muted-foreground">
                      Your support enables us to develop more educational materials and resources for students.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <i className="fas fa-globe mr-1"></i>
                  </Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Community Growth</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us expand our reach and build a stronger academic support community in Zambia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ways to Support */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-hands-helping text-primary"></i>
              Ways to Support Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Use Our Services */}
              <div className="text-center p-6 border border-border rounded-lg">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-paper-plane text-2xl text-primary"></i>
                </div>
                <h4 className="font-semibold mb-2">Use Our Services</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  The best way to support us is by using our academic assistance services for your research needs.
                </p>
                <a href="/submit">
                  <Button className="w-full" data-testid="submit-work-button">
                    Submit Work
                  </Button>
                </a>
              </div>

              {/* Refer Friends */}
              <div className="text-center p-6 border border-border rounded-lg">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-friends text-2xl text-primary"></i>
                </div>
                <h4 className="font-semibold mb-2">Refer Friends</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Share Zedwriter with fellow students and earn referral points for successful referrals.
                </p>
                <a href="/dashboard">
                  <Button variant="outline" className="w-full" data-testid="referral-button">
                    View Referrals
                  </Button>
                </a>
              </div>

              {/* Spread the Word */}
              <div className="text-center p-6 border border-border rounded-lg">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bullhorn text-2xl text-primary"></i>
                </div>
                <h4 className="font-semibold mb-2">Spread the Word</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Help us reach more students by sharing our platform on social media and in your networks.
                </p>
                <a 
                  href={`https://wa.me/${CONTACT_INFO.whatsapp.replace('+', '')}?text=I'd like to help spread the word about Zedwriter!`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full" data-testid="whatsapp-support-button">
                    <i className="fab fa-whatsapp mr-2"></i>
                    WhatsApp Us
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partnership Opportunities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-handshake text-primary"></i>
              Partnership Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Academic Institutions</h4>
                <p className="text-muted-foreground mb-4">
                  We're open to partnerships with universities, colleges, and educational institutions to better serve students.
                </p>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Student support programs</li>
                  <li>Academic resource development</li>
                  <li>Research collaboration</li>
                  <li>Student success initiatives</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Business Partnerships</h4>
                <p className="text-muted-foreground mb-4">
                  Join us in supporting education in Zambia through strategic partnerships and collaborations.
                </p>
                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                  <li>Corporate social responsibility</li>
                  <li>Student scholarship programs</li>
                  <li>Technology partnerships</li>
                  <li>Educational outreach</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direct Support */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-gift text-primary"></i>
              Direct Financial Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Mobile Money Donations</h4>
                <p className="text-muted-foreground mb-4">
                  Support us directly through mobile money to help fund platform development and student assistance programs.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <i className="fas fa-mobile-alt text-blue-600"></i>
                    <div>
                      <div className="font-medium">Airtel Money</div>
                      <div className="text-sm text-muted-foreground" data-testid="airtel-money">{CONTACT_INFO.airtelMoney}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <i className="fas fa-mobile-alt text-yellow-600"></i>
                    <div>
                      <div className="font-medium">MTN Money</div>
                      <div className="text-sm text-muted-foreground" data-testid="mtn-money">{CONTACT_INFO.mtnMoney}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">How Your Support Helps</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="mt-1">K50</Badge>
                    <div>
                      <div className="font-medium text-sm">Basic Support</div>
                      <div className="text-xs text-muted-foreground">Helps cover platform maintenance costs</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="mt-1">K100</Badge>
                    <div>
                      <div className="font-medium text-sm">Student Sponsor</div>
                      <div className="text-xs text-muted-foreground">Subsidizes one student's research assistance</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="mt-1">K200+</Badge>
                    <div>
                      <div className="font-medium text-sm">Education Champion</div>
                      <div className="text-xs text-muted-foreground">Supports multiple students and platform development</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact for Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <i className="fas fa-phone text-primary"></i>
              Get In Touch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Have questions about supporting Zedwriter or interested in partnerships? We'd love to hear from you!
            </p>
            
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
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="flex flex-col gap-3">
                  <a 
                    href={`mailto:${CONTACT_INFO.email}?subject=Support Inquiry`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    data-testid="email-support-button"
                  >
                    <i className="fas fa-envelope mr-2"></i>
                    Email Us
                  </a>
                  <a 
                    href={`https://wa.me/${CONTACT_INFO.whatsapp.replace('+', '')}?text=I'd like to support Zedwriter!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                    data-testid="whatsapp-contact-button"
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