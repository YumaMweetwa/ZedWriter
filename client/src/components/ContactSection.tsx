import { Card, CardContent } from '@/components/ui/card';
import { CONTACT_INFO } from '@/utils/constants';

export const ContactSection = () => {
  const contactMethods = [
    {
      icon: 'fas fa-envelope',
      title: 'Email Support',
      description: 'Get detailed assistance via email',
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      bgColor: 'bg-primary/10 text-primary'
    },
    {
      icon: 'fab fa-whatsapp',
      title: 'WhatsApp',
      description: 'Instant messaging support',
      value: CONTACT_INFO.whatsapp,
      href: `https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^\d]/g, '')}`,
      bgColor: 'bg-green-100 text-green-600'
    },
    {
      icon: 'fas fa-phone',
      title: 'Phone Support',
      description: 'Direct phone assistance',
      value: CONTACT_INFO.phone,
      href: `tel:${CONTACT_INFO.phone}`,
      bgColor: 'bg-accent/10 text-accent'
    }
  ];

  const faqs = [
    {
      question: 'How long does it take to complete a research proposal?',
      answer: 'Research proposals typically take 3-5 business days to complete, depending on complexity and your specific requirements. We\'ll provide a more accurate timeline after reviewing your submission.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept mobile money payments (MTN Mobile Money, Airtel Money) and bank transfers. You can choose to pay 50% upfront and 50% on completion, or pay the full amount upfront.'
    },
    {
      question: 'Do you offer revisions?',
      answer: 'Yes! We offer unlimited revisions until you\'re completely satisfied with the work. Your satisfaction is our top priority.'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h2>
          <p className="text-xl text-muted-foreground">Need help? Our support team is here for you 24/7</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow" data-testid={`contact-method-${index}`}>
              <CardContent className="p-8">
                <div className={`w-16 h-16 ${method.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${method.icon} text-2xl`}></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
                <p className="text-muted-foreground mb-4">{method.description}</p>
                <a 
                  href={method.href} 
                  className="text-primary hover:text-primary/80 font-medium"
                  target={method.href.startsWith('http') ? '_blank' : undefined}
                  rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  data-testid={`contact-link-${index}`}
                >
                  {method.value}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-card border border-border rounded-xl p-6 group" data-testid={`faq-${index}`}>
                <summary className="font-semibold cursor-pointer hover:text-primary list-none flex items-center justify-between">
                  {faq.question}
                  <i className="fas fa-chevron-down group-open:rotate-180 transition-transform"></i>
                </summary>
                <div className="mt-4 text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
