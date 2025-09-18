import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BackButton } from '@/components/BackButton';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GeneratedTopic } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { copyToClipboard } from '@/utils/helpers';
import { supabase } from '@/lib/supabase';

const topicGenerationSchema = z.object({
  domain: z.string().min(1, 'Research domain is required'),
  subdomain: z.string().optional(),
  department: z.string().optional(),
  customDepartment: z.string().optional(),
  keywords: z.array(z.string()).max(12, 'Maximum 12 keywords allowed'),
  studyArea: z.string().max(120, 'Maximum 120 characters allowed').optional(),
  requirements: z.string().optional(),
});

type TopicGenerationValues = z.infer<typeof topicGenerationSchema>;

export const TopicGeneratorPage = () => {
  const { showToast, setLoading } = useApp();
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [showTopics, setShowTopics] = useState(false);

  const form = useForm<TopicGenerationValues>({
    resolver: zodResolver(topicGenerationSchema),
    defaultValues: {
      domain: '',
      subdomain: '',
      department: '',
      customDepartment: '',
      keywords: [],
      studyArea: '',
      requirements: '',
    },
  });

  // Domain data structure with subdomains, departments, and keywords
  const domainData = {
    'Medical & Health Sciences': {
      subdomains: {
        'Hospital-based Clinical Research': {
          departments: ['Internal Medicine', 'Surgical', 'Paediatrics', 'Hospital Environment', 'Intensive Care Unit', 'Emergency Medicine', 'Radiology', 'Pathology', 'Anaesthesia', 'Cardiology', 'Neurology', 'Orthopaedics', 'Dermatology', 'Psychiatry', 'Oncology', 'Nephrology', 'Gastroenterology', 'Pulmonology', 'Endocrinology']
        },
        'Public Health & Community Medicine': {
          departments: ['Epidemiology', 'Health Promotion', 'Environmental Health', 'Occupational Health', 'Health Policy', 'Global Health', 'Community Health', 'Maternal & Child Health', 'Nutrition', 'Health Education']
        },
        'Pharmacy & Pharmacology': {
          departments: ['Clinical Pharmacy', 'Pharmaceutical Chemistry', 'Pharmacology', 'Pharmacy Practice', 'Drug Discovery', 'Toxicology', 'Pharmaceutical Technology']
        },
        'Nursing & Midwifery': {
          departments: ['Medical-Surgical Nursing', 'Maternal-Child Nursing', 'Mental Health Nursing', 'Community Health Nursing', 'Critical Care Nursing', 'Pediatric Nursing', 'Midwifery']
        },
        'Biomedical/Clinical Laboratory Sciences': {
          departments: ['Clinical Chemistry', 'Hematology', 'Microbiology', 'Immunology', 'Molecular Biology', 'Histopathology', 'Blood Bank']
        },
        'Mental Health & Psychology': {
          departments: ['Clinical Psychology', 'Counseling Psychology', 'Psychiatry', 'Behavioral Health', 'Neuropsychology', 'Child Psychology', 'Forensic Psychology']
        }
      },
      keywords: ['Knowledge', 'Attitude', 'Practice', 'Knowledge Attitude and Practice (KAP)', 'Treatment', 'Causes', 'Prevalence', 'Evaluation', 'Complications', 'Risk Factors', 'Outcomes', 'Prevention', 'Management']
    },
    'Business, Economics & Management': {
      subdomains: {
        'Accounting & Finance': {
          departments: ['Financial Accounting', 'Managerial Accounting', 'Auditing', 'Taxation', 'Corporate Finance', 'Investment Banking', 'Financial Planning']
        },
        'Marketing & Consumer Studies': {
          departments: ['Digital Marketing', 'Brand Management', 'Consumer Behavior', 'Market Research', 'Advertising', 'Sales Management', 'E-commerce']
        },
        'Entrepreneurship & Small Business Development': {
          departments: ['Business Planning', 'Startup Management', 'Innovation Management', 'Small Business Finance', 'Entrepreneurial Marketing', 'Business Incubation']
        },
        'Human Resource Management & Organizational Behavior': {
          departments: ['Talent Management', 'Organizational Development', 'Employee Relations', 'Performance Management', 'Training & Development', 'Compensation & Benefits']
        },
        'Procurement & Supply Chain Management': {
          departments: ['Strategic Sourcing', 'Supply Chain Analytics', 'Logistics Management', 'Inventory Control', 'Vendor Management', 'Procurement Strategy']
        },
        'Economics & Development Studies': {
          departments: ['Development Economics', 'Macroeconomics', 'Microeconomics', 'International Economics', 'Agricultural Economics', 'Environmental Economics']
        }
      },
      keywords: ['Profitability', 'Efficiency', 'Market Share', 'Customer Satisfaction', 'ROI', 'Cost-Benefit Analysis', 'Competitive Advantage', 'Innovation', 'Sustainability', 'Growth', 'Performance', 'Strategy']
    },
    'Education & Social Sciences': {
      subdomains: {
        'Education & Pedagogy': {
          departments: ['Curriculum Development', 'Educational Technology', 'Teacher Education', 'Educational Psychology', 'Special Education', 'Adult Education', 'Distance Learning']
        },
        'Sociology & Anthropology': {
          departments: ['Social Theory', 'Cultural Anthropology', 'Urban Sociology', 'Rural Sociology', 'Criminology', 'Demography', 'Social Psychology']
        },
        'Political Science & Governance': {
          departments: ['Political Theory', 'Public Administration', 'International Relations', 'Comparative Politics', 'Public Policy', 'Governance', 'Political Economy']
        },
        'Media & Communication Studies': {
          departments: ['Journalism', 'Public Relations', 'Digital Media', 'Communication Theory', 'Media Ethics', 'Advertising', 'Film Studies']
        },
        'Law & Legal Studies': {
          departments: ['Constitutional Law', 'Human Rights Law', 'Corporate Law', 'Criminal Law', 'International Law', 'Environmental Law', 'Intellectual Property']
        }
      },
      keywords: ['Learning Outcomes', 'Social Impact', 'Policy Analysis', 'Cultural Change', 'Community Development', 'Educational Reform', 'Social Justice', 'Media Influence', 'Legal Framework', 'Governance', 'Equity']
    },
    'Technology & Applied Sciences': {
      subdomains: {
        'Computer Science & Information Technology': {
          departments: ['Software Engineering', 'Data Science', 'Cybersecurity', 'Artificial Intelligence', 'Web Development', 'Database Systems', 'Network Administration']
        },
        'Engineering & Built Environment': {
          departments: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Architecture', 'Construction Management', 'Environmental Engineering']
        },
        'Agriculture & Environmental Sciences': {
          departments: ['Crop Science', 'Animal Science', 'Soil Science', 'Environmental Science', 'Agricultural Economics', 'Food Science', 'Forestry']
        },
        'Mathematics & Statistics': {
          departments: ['Pure Mathematics', 'Applied Mathematics', 'Statistics', 'Actuarial Science', 'Operations Research', 'Mathematical Modeling', 'Data Analysis']
        }
      },
      keywords: ['Innovation', 'Efficiency', 'Automation', 'Data Analysis', 'Security', 'Sustainability', 'Optimization', 'Integration', 'Scalability', 'Performance', 'Reliability']
    },
    'Arts & Humanities': {
      subdomains: {
        'History & Cultural Studies': {
          departments: ['Ancient History', 'Modern History', 'Cultural Studies', 'Archaeology', 'Museum Studies', 'Heritage Management', 'Oral History']
        },
        'Languages & Literature': {
          departments: ['English Literature', 'Linguistics', 'Creative Writing', 'Translation Studies', 'Comparative Literature', 'Language Teaching', 'Literary Criticism']
        },
        'Philosophy & Religious Studies': {
          departments: ['Philosophy of Mind', 'Ethics', 'Political Philosophy', 'Religious Studies', 'Theology', 'Comparative Religion', 'Philosophy of Science']
        }
      },
      keywords: ['Cultural Identity', 'Historical Context', 'Literary Analysis', 'Philosophical Inquiry', 'Religious Practice', 'Artistic Expression', 'Cultural Heritage', 'Language Evolution', 'Ethical Framework']
    }
  };

  const watchedDomain = form.watch('domain');
  const watchedSubdomain = form.watch('subdomain');

  // Helper functions for dynamic data
  const getAvailableSubdomains = () => {
    if (!watchedDomain || !domainData[watchedDomain]) return [];
    return Object.keys(domainData[watchedDomain].subdomains);
  };

  const getAvailableDepartments = () => {
    if (!watchedDomain || !watchedSubdomain || !domainData[watchedDomain]?.subdomains[watchedSubdomain]) return [];
    return domainData[watchedDomain].subdomains[watchedSubdomain].departments;
  };

  const getAvailableKeywords = () => {
    if (!watchedDomain || !domainData[watchedDomain]) return [];
    return domainData[watchedDomain].keywords;
  };

  // Reset logic when selections change
  React.useEffect(() => {
    if (watchedDomain) {
      form.setValue('subdomain', '');
      form.setValue('department', '');
      form.setValue('keywords', []);
    }
  }, [watchedDomain, form]);

  React.useEffect(() => {
    if (watchedSubdomain) {
      form.setValue('department', '');
    }
  }, [watchedSubdomain, form]);

  const availableKeywords = [
    'Mobile Money', 'Rural Development', 'Financial Inclusion', 'Economic Impact',
    'Digital Payment', 'Zambia', 'Healthcare', 'Technology', 'Innovation',
    'Education', 'Agriculture', 'Climate Change', 'Public Health', 'Social Impact'
  ];

  const watchedKeywords = form.watch('keywords');

  const generateTopics = async (data: TopicGenerationValues) => {
    try {
      setLoading({
        isLoading: true,
        title: 'Generating Topic...',
        message: '🤖 AI is crafting your topic...'
      });

      // Call Gemini API directly (like the working static version)
      const aiTopic = await generateWithGemini(data);

      if (aiTopic) {
        // Transform to match our interface
        const generatedTopics: GeneratedTopic[] = [{
          id: '1',
          title: aiTopic,
          description: '',
          keywords: data.keywords.slice(0, 3),
          difficulty: 'Moderate',
          duration: '4-5 months'
        }];

        setGeneratedTopics(generatedTopics);
        setShowTopics(true);

        showToast({
          type: 'success',
          title: 'Topic Generated!',
          message: '✨ AI-powered research topic generated successfully!'
        });
      } else {
        throw new Error('No topic generated');
      }

    } catch (error) {
      console.error('Topic generation failed:', error);

      // Use fallback topic generation
      const fallbackTopic = generateFallbackTopic(data);

      const generatedTopics: GeneratedTopic[] = [{
        id: '1',
        title: fallbackTopic,
        description: '',
        keywords: data.keywords.slice(0, 3),
        difficulty: 'Moderate',
        duration: '4-5 months'
      }];

      setGeneratedTopics(generatedTopics);
      setShowTopics(true);

      showToast({
        type: 'warning',
        title: 'Fallback Topic Generated',
        message: '⚠️ AI generation failed. Using enhanced fallback topic.'
      });
    } finally {
      setLoading({ isLoading: false });
    }
  };

  // ===== GEMINI AI INTEGRATION (Direct API Call) =====
  const generateWithGemini = async (formData: TopicGenerationValues) => {
    const GEMINI_API_KEY = 'AIzaSyDN5NWnGciNH6_7YNUui-iW0fN-Vui1ODM';

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = createResearchPrompt(formData);
    console.log('Sending prompt to Gemini:', prompt);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      });

      console.log('Gemini API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response data:', data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('Generated text:', generatedText);
        const topic = parseAITopic(generatedText);
        console.log('Parsed topic:', topic);

        if (!topic) {
          throw new Error('No valid topic could be parsed from AI response');
        }

        return topic;
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response structure from Gemini API');
      }

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  };

  // ===== PROMPT CREATION =====
  const createResearchPrompt = (formData: TopicGenerationValues) => {
    let prompt = `Generate a research topic in not more than 20 words based on the provided selections.

MANDATORY INFORMATION (MUST be included in the topic):
- Domain: ${formData.domain}
- Department: ${formData.department}
- Study Area: ${formData.studyArea} (MUST appear in the topic)`;

    if (formData.keywords.length > 0) {
      prompt += `
- Research Keywords: ${formData.keywords.join(', ')} (MUST be incorporated in the topic)`;
    }

    if (formData.requirements) {
      prompt += `
- Additional Requirements: ${formData.requirements} (MUST be considered in the topic)`;
    }

    prompt += `

STRICT REQUIREMENTS:
1. The topic MUST include the study area "${formData.studyArea}"
2. The topic MUST be related to ${formData.domain} and ${formData.department}`;

    if (formData.keywords.length > 0) {
      prompt += `
3. The topic MUST incorporate the keywords "${formData.keywords.join(', ')}"`;
    }

    if (formData.requirements) {
      const reqNumber = formData.keywords.length > 0 ? 4 : 3;
      prompt += `
${reqNumber}. The topic MUST consider the additional requirements: "${formData.requirements}"`;
    }

    const nextReqNumber = (formData.keywords.length > 0 && formData.requirements) ? 5 : (formData.keywords.length > 0 || formData.requirements) ? 4 : 3;

    prompt += `
${nextReqNumber}. The topic should be specific, measurable, and achievable
${nextReqNumber + 1}. Address current gaps in ${formData.domain.toLowerCase()} research
${nextReqNumber + 2}. Consider ethical feasibility and resource constraints
${nextReqNumber + 3}. The topic should be not more than 20 words
${nextReqNumber + 4}. Focus on innovation, feasibility, and academic significance

Return exactly ONE research topic that incorporates all the requirements above.`;

    return prompt;
  };

  // ===== AI RESPONSE PARSING =====
  const parseAITopic = (text: string) => {
    console.log('Parsing AI text:', text);

    // Clean up the text
    const cleanedText = text.trim();

    // Try to extract the topic from various formats
    let topic = cleanedText;

    // Remove common prefixes
    const prefixesToRemove = [
      /^Create a research topic/i,
      /^Here is a research topic/i,
      /^The research topic is/i,
      /^Research topic:/i,
      /^Topic:/i,
      /^Here's a topic:/i
    ];

    for (const prefix of prefixesToRemove) {
      topic = topic.replace(prefix, '').trim();
    }

    // Remove quotes
    topic = topic.replace(/^["']|["']$/g, '').trim();

    // If it's a substantial topic, return it
    if (topic.length > 10) {
      console.log('Extracted topic:', topic);
      return topic;
    }

    // Try to find any substantial text
    const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 15);
    if (sentences.length > 0) {
      const extractedTopic = sentences[0].trim().replace(/"/g, '');
      console.log('Extracted topic from sentence:', extractedTopic);
      return extractedTopic;
    }

    // Fallback
    console.log('Using cleaned text as topic:', cleanedText);
    return cleanedText || 'Generated Research Topic';
  };

  // ===== FALLBACK TOPIC GENERATION =====
  const generateFallbackTopic = (formData: TopicGenerationValues) => {
    const { domain, department, studyArea, keywords, requirements } = formData;

    let topicTemplate = '';

    if (keywords.length > 0) {
      const primaryKeyword = keywords[0];
      topicTemplate = `${primaryKeyword} of ${studyArea} in ${department}: A ${domain} Study`;
    } else {
      topicTemplate = `${studyArea} Research in ${department}: A ${domain} Study`;
    }

    // If requirements are provided, try to incorporate them
    if (requirements) {
      const reqWords = requirements.toLowerCase();

      if (reqWords.includes('age') || reqWords.includes('children') || reqWords.includes('elderly')) {
        topicTemplate = keywords.length > 0 ?
          `Age-Specific ${keywords[0]} of ${studyArea} in ${department}` :
          `Age-Specific ${studyArea} Research in ${department}`;
      }
      if (reqWords.includes('rural') || reqWords.includes('urban') || reqWords.includes('community')) {
        topicTemplate = keywords.length > 0 ?
          `Community-Based ${keywords[0]} Study on ${studyArea} in ${department}` :
          `Community-Based ${studyArea} Study in ${department}`;
      }
      if (reqWords.includes('cost') || reqWords.includes('economic')) {
        topicTemplate = keywords.length > 0 ?
          `Cost-Effectiveness of ${studyArea} ${keywords[0]} in ${department}` :
          `Cost-Effectiveness of ${studyArea} in ${department}`;
      }
    }

    console.log('Generated fallback topic:', topicTemplate);
    return topicTemplate;
  };

  const handleCopyTopic = async (topic: GeneratedTopic) => {
    const success = await copyToClipboard(topic.title);
    if (success) {
      showToast({
        type: 'success',
        title: 'Copied!',
        message: 'Topic title copied to clipboard.'
      });
    }
  };

  const handleUseTopic = (topic: GeneratedTopic) => {
    showToast({
      type: 'info',
      title: 'Topic Selected',
      message: 'Topic will be used for your submission. Redirecting...'
    });
  };

  const generateNewTopic = async () => {
    await generateTopics(form.getValues());
  };

  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">AI Research Topic Generator</h1>
          <p className="text-muted-foreground">Get AI-powered research topic suggestions using Google Gemini AI based on your field of study</p>
        </div>

        <Card className="p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Tell us about your research interests</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(generateTopics)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Domain *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="domain-select">
                              <SelectValue placeholder="Select domain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(domainData).map((domain) => (
                              <SelectItem key={domain} value={domain}>
                                {domain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="subdomain-select">
                              <SelectValue placeholder="Select subdomain (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableSubdomains().map((subdomain) => (
                              <SelectItem key={subdomain} value={subdomain}>
                                {subdomain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="department-select">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableDepartments().map((department) => (
                                <SelectItem key={department} value={department}>
                                  {department}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Custom Department</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customDepartment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Or enter custom" data-testid="custom-department-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords (Select up to 12)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const currentKeywords = field.value || [];
                            if (!currentKeywords.includes(value) && currentKeywords.length < 12) {
                              field.onChange([...currentKeywords, value]);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="keywords-select">
                              <SelectValue placeholder="Select keywords" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableKeywords()
                              .filter(keyword => !watchedKeywords.includes(keyword))
                              .map((keyword) => (
                                <SelectItem key={keyword} value={keyword}>
                                  {keyword}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Display selected keywords */}
                        {watchedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchedKeywords.map((keyword) => (
                              <div key={keyword} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center">
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newKeywords = watchedKeywords.filter(k => k !== keyword);
                                    field.onChange(newKeywords);
                                  }}
                                  className="ml-2 text-primary hover:text-primary/70"
                                  data-testid={`remove-keyword-${keyword}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          {watchedKeywords.length}/12 keywords selected
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studyArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Area/Focus</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Maternal health in rural Zambia" 
                            maxLength={120} 
                            data-testid="study-area-input"
                            {...field} 
                          />
                        </FormControl>
                        <div className="text-right text-sm text-muted-foreground">
                          {field.value?.length || 0}/120 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific methodologies, constraints, or requirements..." 
                            data-testid="requirements-input"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" data-testid="generate-topics-button">
                    <i className="fas fa-magic mr-2"></i>Generate AI Research Topics
                  </Button>
                </form>
              </Form>
            </div>

            {/* Generated Topics */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {showTopics ? 'Generated Topics' : 'Suggested Topics'}
                </h2>
                {showTopics && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateNewTopic}
                    data-testid="regenerate-topics-button"
                  >
                    <i className="fas fa-refresh mr-1"></i>Regenerate
                  </Button>
                )}
              </div>

              {showTopics ? (
                <div className="space-y-4">
                  {generatedTopics.map((topic) => (
                    <Card key={topic.id} className="hover:border-primary/50 transition-colors" data-testid={`generated-topic-${topic.id}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-medium text-foreground flex-1 mr-4">
                            {topic.title}
                          </h4>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyTopic(topic)}
                              data-testid={`copy-topic-${topic.id}`}
                            >
                              <i className="fas fa-copy"></i>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUseTopic(topic)}
                              data-testid={`use-topic-${topic.id}`}
                            >
                              <i className="fas fa-arrow-right"></i>
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {topic.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {topic.keywords.map((keyword, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{topic.difficulty}</span>
                            <span>{topic.duration}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={generateNewTopic}
                      data-testid="generate-more-topics-button"
                    >
                      Generate New Topic
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <i className="fas fa-lightbulb text-4xl mb-4"></i>
                  <p>Fill out the form to generate personalized research topics</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
