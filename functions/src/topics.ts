export interface TopicGenerationRequest {
  domain: string;
  subdomain?: string;
  department?: string;
  keywords: string[];
  studyArea?: string;
  requirements?: string;
}

export interface GeneratedTopic {
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
}

export const generateTopics = async (request: TopicGenerationRequest): Promise<GeneratedTopic[]> => {
  // In a production environment, this would integrate with an AI service like OpenAI
  // For now, we'll generate topics based on templates and the input parameters
  
  const { domain, subdomain, department, keywords, studyArea, requirements } = request;
  
  // Topic templates based on domain
  const topicTemplates = getTopicTemplates(domain, subdomain);
  
  // Generate topics by combining templates with user input
  const topics: GeneratedTopic[] = [];
  
  for (let i = 0; i < Math.min(5, topicTemplates.length); i++) {
    const template = topicTemplates[i];
    const topic = generateTopicFromTemplate(template, {
      keywords,
      studyArea,
      department,
      requirements
    });
    topics.push(topic);
  }
  
  return topics;
};

interface TopicTemplate {
  titlePattern: string;
  descriptionPattern: string;
  defaultKeywords: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
}

const getTopicTemplates = (domain: string, subdomain?: string): TopicTemplate[] => {
  const templates: Record<string, TopicTemplate[]> = {
    health: [
      {
        titlePattern: "The Impact of {technology} on {healthArea} in {location}",
        descriptionPattern: "This research investigates how {technology} technologies can improve {healthArea} access and quality in {location}, examining barriers to implementation and patient outcomes.",
        defaultKeywords: ['healthcare', 'technology', 'patient outcomes'],
        difficulty: 'Intermediate',
        duration: '4-6 months'
      },
      {
        titlePattern: "Effectiveness of {intervention} for {condition} Management in {setting}",
        descriptionPattern: "Analyzing the effectiveness of {intervention} interventions in helping patients manage {condition}, focusing on user engagement and clinical outcomes.",
        defaultKeywords: ['clinical trial', 'patient management', 'healthcare outcomes'],
        difficulty: 'Advanced',
        duration: '6-8 months'
      },
      {
        titlePattern: "Community-Based {healthService} Programs: A {location} Perspective",
        descriptionPattern: "Evaluation of community health worker interventions in delivering {healthService} services, measuring impact on health outcomes and community engagement.",
        defaultKeywords: ['community health', 'public health', 'health services'],
        difficulty: 'Intermediate',
        duration: '3-5 months'
      }
    ],
    technology: [
      {
        titlePattern: "Development of {system} for {application} in {context}",
        descriptionPattern: "This project involves designing and implementing a {system} system to address {application} challenges in {context}, with focus on user experience and performance optimization.",
        defaultKeywords: ['software development', 'system design', 'user experience'],
        difficulty: 'Advanced',
        duration: '5-7 months'
      },
      {
        titlePattern: "Machine Learning Approaches to {problem} in {domain}",
        descriptionPattern: "Investigating various machine learning algorithms to solve {problem} challenges, comparing their effectiveness and proposing optimized solutions.",
        defaultKeywords: ['machine learning', 'data analysis', 'artificial intelligence'],
        difficulty: 'Advanced',
        duration: '6-8 months'
      }
    ],
    business: [
      {
        titlePattern: "Economic Impact of {innovation} on {sector} in {region}",
        descriptionPattern: "Comprehensive analysis of how {innovation} has transformed the {sector} sector in {region}, examining economic benefits, challenges, and future opportunities.",
        defaultKeywords: ['economic analysis', 'business impact', 'market research'],
        difficulty: 'Intermediate',
        duration: '4-5 months'
      },
      {
        titlePattern: "Digital Transformation Strategies for {businessType} in {market}",
        descriptionPattern: "Exploring effective digital transformation approaches for {businessType} businesses operating in {market}, with focus on implementation challenges and success factors.",
        defaultKeywords: ['digital transformation', 'business strategy', 'technology adoption'],
        difficulty: 'Intermediate',
        duration: '3-4 months'
      }
    ],
    education: [
      {
        titlePattern: "Impact of {technology} on {educationLevel} Learning Outcomes in {setting}",
        descriptionPattern: "Investigating how {technology} tools affect student learning outcomes at the {educationLevel} level, analyzing engagement, performance, and accessibility factors.",
        defaultKeywords: ['educational technology', 'learning outcomes', 'student engagement'],
        difficulty: 'Intermediate',
        duration: '4-6 months'
      }
    ],
    environment: [
      {
        titlePattern: "Sustainable {practice} in {sector}: A {region} Case Study",
        descriptionPattern: "Examining the implementation and effectiveness of sustainable {practice} practices in the {sector} sector, with specific focus on environmental and economic impacts in {region}.",
        defaultKeywords: ['sustainability', 'environmental impact', 'case study'],
        difficulty: 'Intermediate',
        duration: '4-5 months'
      }
    ]
  };

  return templates[domain] || templates.health;
};

const generateTopicFromTemplate = (
  template: TopicTemplate, 
  userInput: {
    keywords: string[];
    studyArea?: string;
    department?: string;
    requirements?: string;
  }
): GeneratedTopic => {
  let title = template.titlePattern;
  let description = template.descriptionPattern;
  
  // Replace placeholders with user input or defaults
  const replacements: Record<string, string> = {
    '{technology}': getRandomFromArray(['Mobile Health Applications', 'Telemedicine', 'Digital Health Records', 'AI-powered Diagnostics']),
    '{healthArea}': getRandomFromArray(['Healthcare Delivery', 'Maternal Health', 'Mental Health Services', 'Chronic Disease Management']),
    '{location}': 'Zambia',
    '{intervention}': getRandomFromArray(['Mobile Health Apps', 'Community-Based Programs', 'Digital Health Tools']),
    '{condition}': getRandomFromArray(['Diabetes', 'Hypertension', 'Mental Health Disorders', 'Maternal Health']),
    '{setting}': getRandomFromArray(['Urban Communities', 'Rural Areas', 'Healthcare Facilities']),
    '{healthService}': getRandomFromArray(['Primary Healthcare', 'Preventive Care', 'Health Education']),
    '{system}': getRandomFromArray(['Web Application', 'Mobile App', 'Management System', 'Analytics Platform']),
    '{application}': getRandomFromArray(['Student Management', 'Healthcare Delivery', 'Financial Services']),
    '{context}': getRandomFromArray(['Educational Institutions', 'Healthcare Systems', 'Small Businesses']),
    '{problem}': getRandomFromArray(['Fraud Detection', 'Predictive Analytics', 'Pattern Recognition']),
    '{domain}': getRandomFromArray(['Healthcare', 'Finance', 'Education', 'Agriculture']),
    '{innovation}': getRandomFromArray(['Mobile Money', 'Digital Banking', 'E-commerce', 'Fintech']),
    '{sector}': getRandomFromArray(['Banking', 'Agriculture', 'Retail', 'Healthcare']),
    '{region}': 'Zambia',
    '{businessType}': getRandomFromArray(['Small and Medium Enterprises', 'Startups', 'Traditional Businesses']),
    '{market}': getRandomFromArray(['Emerging Markets', 'Zambian Market', 'African Markets']),
    '{educationLevel}': getRandomFromArray(['Primary', 'Secondary', 'University']),
    '{practice}': getRandomFromArray(['Farming Practices', 'Energy Solutions', 'Waste Management']),
  };

  // Apply user-specific customizations
  if (userInput.studyArea) {
    replacements['{healthArea}'] = userInput.studyArea;
    replacements['{application}'] = userInput.studyArea;
    replacements['{context}'] = userInput.studyArea;
  }

  if (userInput.department) {
    replacements['{setting}'] = userInput.department;
    replacements['{context}'] = userInput.department;
  }

  // Replace placeholders in title and description
  Object.entries(replacements).forEach(([placeholder, replacement]) => {
    title = title.replace(new RegExp(placeholder, 'g'), replacement);
    description = description.replace(new RegExp(placeholder, 'g'), replacement);
  });

  // Combine template keywords with user keywords
  const combinedKeywords = [
    ...template.defaultKeywords,
    ...userInput.keywords.slice(0, 3) // Limit to first 3 user keywords
  ].slice(0, 6); // Limit total to 6 keywords

  return {
    title,
    description,
    keywords: combinedKeywords,
    difficulty: template.difficulty,
    duration: template.duration
  };
};

const getRandomFromArray = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};
