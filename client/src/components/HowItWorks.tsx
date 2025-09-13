export const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Submit Your Work",
      description: "Upload your requirements, guidelines, and any supporting materials through our secure submission portal.",
      icon: "fas fa-edit"
    },
    {
      number: 2,
      title: "Expert Review",
      description: "Our qualified academic writers review your submission and begin crafting your research with attention to detail.",
      icon: "fas fa-users"
    },
    {
      number: 3,
      title: "Deliver Results",
      description: "Receive your completed work on time with unlimited revisions until you're completely satisfied.",
      icon: "fas fa-trophy"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">How Zedwriter Works</h2>
          <p className="text-xl text-muted-foreground">Get professional academic assistance in just three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center" data-testid={`step-${step.number}`}>
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
