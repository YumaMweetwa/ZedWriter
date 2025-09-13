import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTACT_INFO } from '@/utils/constants';

export const TermsPage = () => {
  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="terms-title">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Welcome to Zedwriter. These Terms and Conditions ("Terms") govern your use of our academic research assistance platform and services. By accessing or using our services, you agree to be bound by these Terms.
              </p>
              <p className="text-muted-foreground">
                Zedwriter provides professional academic research assistance services to students in Zambia and beyond, including research proposals, dissertations, assignments, data analysis, and related academic writing services.
              </p>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>2. Our Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">2.1 Service Types</h4>
              <p className="text-muted-foreground">
                We offer academic assistance including but not limited to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Research proposals and dissertations</li>
                <li>Academic assignments and essays</li>
                <li>Data collection and analysis</li>
                <li>Content writing and editing</li>
                <li>Academic consultation and guidance</li>
              </ul>
              
              <h4 className="font-semibold mt-4">2.2 Academic Integrity</h4>
              <p className="text-muted-foreground">
                Our services are provided for research assistance and educational purposes. You are responsible for ensuring that the use of our services complies with your institution's academic integrity policies and guidelines.
              </p>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>3. Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">3.1 Pricing and Payment</h4>
              <p className="text-muted-foreground">
                All prices are quoted in Zambian Kwacha (ZMW) and are subject to change. Payment is accepted via mobile money (MTN, Airtel) and bank transfer. Full payment terms will be communicated upon service agreement.
              </p>
              
              <h4 className="font-semibold">3.2 Payment Schedule</h4>
              <p className="text-muted-foreground">
                Payment arrangements may include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>50% upfront, 50% on completion</li>
                <li>Full payment upfront</li>
                <li>Full payment on completion (subject to approval)</li>
              </ul>
              
              <h4 className="font-semibold">3.3 Refund Policy</h4>
              <p className="text-muted-foreground">
                Refunds are considered on a case-by-case basis. Requests must be submitted within 7 days of service completion with valid justification.
              </p>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle>4. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">4.1 Accurate Information</h4>
              <p className="text-muted-foreground">
                You must provide accurate, complete, and up-to-date information when submitting requests and creating your account.
              </p>
              
              <h4 className="font-semibold">4.2 Communication</h4>
              <p className="text-muted-foreground">
                You are responsible for maintaining regular communication and responding to requests for clarification or additional information in a timely manner.
              </p>
              
              <h4 className="font-semibold">4.3 Proper Use</h4>
              <p className="text-muted-foreground">
                You agree to use our services ethically and in compliance with your institution's academic policies. You may not use our services for any unlawful purposes.
              </p>
            </CardContent>
          </Card>

          {/* Delivery and Revisions */}
          <Card>
            <CardHeader>
              <CardTitle>5. Delivery and Revisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">5.1 Delivery Timeline</h4>
              <p className="text-muted-foreground">
                We strive to meet agreed delivery deadlines. Timelines may vary based on project complexity and scope. Any delays will be communicated promptly.
              </p>
              
              <h4 className="font-semibold">5.2 Revisions</h4>
              <p className="text-muted-foreground">
                We offer reasonable revisions to ensure customer satisfaction. Major changes to the original scope may incur additional charges.
              </p>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>6. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Upon full payment, you receive full ownership of the delivered work. We retain the right to use anonymized examples for marketing and quality improvement purposes, with all identifying information removed.
              </p>
            </CardContent>
          </Card>

          {/* Privacy and Confidentiality */}
          <Card>
            <CardHeader>
              <CardTitle>7. Privacy and Confidentiality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We are committed to protecting your privacy and maintaining the confidentiality of your personal information and academic work. We do not share your information with third parties except as necessary to provide our services.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our liability is limited to the amount paid for the specific service. We are not liable for any indirect, incidental, or consequential damages arising from the use of our services.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>9. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>10. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about these Terms & Conditions, please contact us:
              </p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};