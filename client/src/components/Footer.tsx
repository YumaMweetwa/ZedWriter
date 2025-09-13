import { Link } from 'wouter';

export const Footer = () => {
  const serviceLinks = [
    { href: '/pricing', label: 'Research Proposals' },
    { href: '/pricing', label: 'Dissertations' },
    { href: '/pricing', label: 'Data Analysis' },
    { href: '/pricing', label: 'Assignments' },
    { href: '/topic-generator', label: 'Topic Generation' },
  ];

  const supportLinks = [
    { href: '/contact', label: 'Help Center' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/refund', label: 'Refund Policy' },
  ];

  const socialLinks = [
    { href: '#', icon: 'fab fa-facebook', label: 'Facebook' },
    { href: '#', icon: 'fab fa-twitter', label: 'Twitter' },
    { href: '#', icon: 'fab fa-linkedin', label: 'LinkedIn' },
    { href: '#', icon: 'fab fa-whatsapp', label: 'WhatsApp' },
  ];

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h2 className="text-2xl font-bold text-primary">Zedwriter</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Zambia's premier student research assistance platform, helping students achieve academic excellence through professional writing and research support.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.label}
                  data-testid={`social-link-${social.label.toLowerCase()}`}
                >
                  <i className={`${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-muted-foreground">
              {serviceLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="hover:text-primary transition-colors"
                    data-testid={`service-link-${index}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="hover:text-primary transition-colors"
                    data-testid={`support-link-${index}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <hr className="my-8 border-border" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground text-sm">
            © 2024 Zedwriter. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-muted-foreground text-sm">Made with ❤️ in Zambia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
