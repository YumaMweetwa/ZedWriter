import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { GeneratedTopic } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { copyToClipboard } from '@/utils/helpers';

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

  const availableKeywords = [
    'Mobile Money', 'Rural Development', 'Financial Inclusion', 'Economic Impact',
    'Digital Payment', 'Zambia', 'Healthcare', 'Technology', 'Innovation',
    'Education', 'Agriculture', 'Climate Change', 'Public Health', 'Social Impact'
  ];

  const watchedKeywords = form.watch('keywords');

  const handleKeywordToggle = (keyword: string, checked: boolean) => {
    const currentKeywords = form.getValues('keywords');
    if (checked && currentKeywords.length < 12) {
      form.setValue('keywords', [...currentKeywords, keyword]);
    } else if (!checked) {
      form.setValue('keywords', currentKeywords.filter(k => k !== keyword));
    }
  };

  const generateTopics = async (data: TopicGenerationValues) => {
    try {
      setLoading({
        isLoading: true,
        title: 'Generating Topics...',
        message: 'Our platform is creating personalized research topics for you.'
      });

      // Simulate API call - in real app this would call a Cloud Function
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockTopics: GeneratedTopic[] = [
        {
          id: '1',
          title: 'The Impact of Mobile Money Services on Financial Inclusion in Rural Zambia: A Case Study of Lusaka Province',
          description: 'This research investigates how mobile money platforms like MTN Mobile Money and Airtel Money have transformed financial access in rural areas, focusing on adoption rates, usage patterns, and socioeconomic impacts.',
          keywords: ['Mobile Money', 'Financial Inclusion', 'Rural Development'],
          difficulty: 'Moderate',
          duration: '3-4 months'
        },
        {
          id: '2',
          title: 'Evaluating the Role of Digital Payment Systems in Supporting Small-Scale Farmers: Evidence from Zambian Agricultural Markets',
          description: 'An investigation into how digital payment platforms facilitate agricultural transactions, improve market access, and enhance income stability for smallholder farmers in Zambia.',
          keywords: ['Digital Payment', 'Agriculture', 'Market Access'],
          difficulty: 'Intermediate',
          duration: '4-5 months'
        },
        {
          id: '3',
          title: 'Healthcare Infrastructure Digitization in Post-COVID Zambia',
          description: 'Exploring opportunities and challenges for digitizing healthcare systems in Zambia, with focus on electronic health records and interoperability.',
          keywords: ['Healthcare', 'Technology', 'Innovation'],
          difficulty: 'Advanced',
          duration: '6-8 months'
        }
      ];

      setGeneratedTopics(mockTopics);
      setShowTopics(true);

      showToast({
        type: 'success',
        title: 'Topics Generated!',
        message: `Successfully generated ${mockTopics.length} research topics for you.`
      });

    } catch (error) {
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate topics. Please try again.'
      });
    } finally {
      setLoading({ isLoading: false });
    }
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

  const generateMoreTopics = async () => {
    await generateTopics(form.getValues());
  };

  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Research Topic Generator</h1>
          <p className="text-muted-foreground">Get platform-generated suggestions for your research topics</p>
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
                            <SelectItem value="health">Health Sciences</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="social">Social Sciences</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
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
                            <SelectItem value="public_health">Public Health</SelectItem>
                            <SelectItem value="clinical_medicine">Clinical Medicine</SelectItem>
                            <SelectItem value="nursing">Nursing</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
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
                              <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="pediatrics">Pediatrics</SelectItem>
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
                    render={() => (
                      <FormItem>
                        <FormLabel>Keywords (Select up to 12)</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-input rounded-md bg-background max-h-40 overflow-y-auto">
                            {availableKeywords.map((keyword) => (
                              <div key={keyword} className="flex items-center space-x-2">
                                <Checkbox
                                  id={keyword}
                                  checked={watchedKeywords.includes(keyword)}
                                  onCheckedChange={(checked) => handleKeywordToggle(keyword, checked as boolean)}
                                  disabled={!watchedKeywords.includes(keyword) && watchedKeywords.length >= 12}
                                  data-testid={`keyword-${keyword}`}
                                />
                                <label htmlFor={keyword} className="text-sm cursor-pointer">
                                  {keyword}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
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
                    <i className="fas fa-magic mr-2"></i>Generate Research Topics
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
                    onClick={generateMoreTopics}
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
                      onClick={generateMoreTopics}
                      data-testid="generate-more-topics-button"
                    >
                      Generate More Topics
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
