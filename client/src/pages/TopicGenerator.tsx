import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../hooks/use-auth';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface GeneratedTopic {
  title: string;
  description: string;
  keywords: string[];
  difficulty: string;
  duration: string;
}

export const TopicGenerator = () => {
  const [formData, setFormData] = useState({
    domain: '',
    subdomain: '',
    department: '',
    customDepartment: '',
    keywords: [] as string[],
    studyArea: '',
    requirements: ''
  });
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [generating, setGenerating] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const availableKeywords = [
    'Mobile Money', 'Rural Development', 'Financial Inclusion', 'Economic Impact',
    'Digital Payment', 'Zambia', 'Healthcare', 'Technology', 'Innovation',
    'Education', 'Agriculture', 'Climate Change', 'Sustainability',
    'Community Health', 'Data Analysis', 'Machine Learning', 'Public Policy'
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !formData.keywords.includes(keyword) && formData.keywords.length < 12) {
      handleInputChange('keywords', [...formData.keywords, keyword]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    handleInputChange('keywords', formData.keywords.filter(k => k !== keyword));
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      addKeyword(keywordInput.trim());
    }
  };

  const generateTopics = async () => {
    if (!formData.domain) {
      toast({
        title: 'Domain required',
        description: 'Please select a research domain',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const generateTopicsFunction = httpsCallable(functions, 'generateTopicsFunction');
      const result = await generateTopicsFunction({
        domain: formData.domain,
        subdomain: formData.subdomain,
        department: formData.customDepartment || formData.department,
        keywords: formData.keywords,
        studyArea: formData.studyArea,
        requirements: formData.requirements
      });

      const data = result.data as { topics: GeneratedTopic[] };
      setGeneratedTopics(data.topics);
      
      toast({
        title: 'Topics generated',
        description: `Generated ${data.topics.length} research topics for you`,
      });
    } catch (error) {
      console.error('Topic generation error:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate topics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyTopic = async (topic: GeneratedTopic) => {
    try {
      await navigator.clipboard.writeText(topic.title);
      toast({
        title: 'Topic copied',
        description: 'Topic title has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy topic to clipboard',
        variant: 'destructive',
      });
    }
  };

  const useTopic = (topic: GeneratedTopic) => {
    // This would typically navigate to the submission form with the topic pre-filled
    toast({
      title: 'Topic selected',
      description: 'This would redirect to submission form with the topic pre-filled',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 data-testid="text-topic-generator-title" className="text-3xl font-bold text-foreground">Research Topic Generator</h1>
            <p data-testid="text-topic-generator-subtitle" className="text-muted-foreground mt-2">Get AI-powered suggestions for your research topics</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Tell us about your research interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="domain">Academic Domain *</Label>
                  <Select value={formData.domain} onValueChange={(value) => handleInputChange('domain', value)}>
                    <SelectTrigger data-testid="select-domain">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health Sciences</SelectItem>
                      <SelectItem value="technology">Technology & Engineering</SelectItem>
                      <SelectItem value="business">Business & Economics</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="social">Social Sciences</SelectItem>
                      <SelectItem value="environment">Environment & Agriculture</SelectItem>
                      <SelectItem value="custom">Custom Domain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Select value={formData.subdomain} onValueChange={(value) => handleInputChange('subdomain', value)}>
                    <SelectTrigger data-testid="select-subdomain">
                      <SelectValue placeholder="Select subdomain (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public_health">Public Health</SelectItem>
                      <SelectItem value="clinical_medicine">Clinical Medicine</SelectItem>
                      <SelectItem value="nursing">Nursing</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="computer_science">Computer Science</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger data-testid="select-department" className="flex-1">
                        <SelectValue placeholder="Select department (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="obstetrics">Obstetrics & Gynecology</SelectItem>
                        <SelectItem value="computer_science">Computer Science</SelectItem>
                        <SelectItem value="business_admin">Business Administration</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      data-testid="input-custom-department"
                      placeholder="Or enter custom"
                      value={formData.customDepartment}
                      onChange={(e) => handleInputChange('customDepartment', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Keywords (Select up to 12)</Label>
                  <div className="space-y-3">
                    <div className="border border-input rounded-md p-3 min-h-[100px] bg-background">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.keywords.map((keyword) => (
                          <Badge key={keyword} variant="default" className="text-xs">
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 hover:text-destructive"
                              data-testid={`button-remove-keyword-${keyword}`}
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        data-testid="input-keyword"
                        placeholder="Type keywords and press Enter..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={handleKeywordInputKeyPress}
                        className="border-0 p-0 focus:ring-0"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {availableKeywords.slice(0, 6).map((keyword) => (
                        <div key={keyword} className="flex items-center space-x-2">
                          <Checkbox
                            id={keyword}
                            checked={formData.keywords.includes(keyword)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addKeyword(keyword);
                              } else {
                                removeKeyword(keyword);
                              }
                            }}
                            disabled={!formData.keywords.includes(keyword) && formData.keywords.length >= 12}
                          />
                          <Label htmlFor={keyword} className="text-sm cursor-pointer">
                            {keyword}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formData.keywords.length}/12 keywords selected
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="studyArea">Study Area/Focus</Label>
                  <Textarea
                    id="studyArea"
                    data-testid="textarea-study-area"
                    value={formData.studyArea}
                    onChange={(e) => handleInputChange('studyArea', e.target.value.slice(0, 120))}
                    placeholder="Describe your specific area of interest or focus..."
                    maxLength={120}
                    rows={3}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.studyArea.length}/120 characters
                  </div>
                </div>

                <div>
                  <Label htmlFor="requirements">Additional Requirements</Label>
                  <Textarea
                    id="requirements"
                    data-testid="textarea-requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="Any specific methodologies, constraints, or requirements..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={generateTopics}
                  disabled={generating}
                  className="w-full"
                  data-testid="button-generate-topics"
                >
                  {generating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      Generate Research Topics
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Topics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Suggested Topics</CardTitle>
                  {generatedTopics.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateTopics}
                      disabled={generating}
                      data-testid="button-regenerate-topics"
                    >
                      <i className="fas fa-refresh mr-1"></i>
                      Regenerate
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedTopics.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {generatedTopics.map((topic, index) => (
                      <div key={index} data-testid={`topic-${index}`} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-sm flex-1 leading-tight">
                            {topic.title}
                          </h5>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyTopic(topic)}
                              title="Copy to clipboard"
                              data-testid={`button-copy-topic-${index}`}
                            >
                              <i className="fas fa-copy"></i>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => useTopic(topic)}
                              title="Use this topic"
                              data-testid={`button-use-topic-${index}`}
                            >
                              <i className="fas fa-arrow-right"></i>
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {topic.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {topic.keywords.map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{topic.difficulty}</span>
                            <span>•</span>
                            <span>{topic.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-lightbulb text-6xl text-muted-foreground mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">Ready to generate topics?</h3>
                    <p className="text-muted-foreground mb-6">
                      Fill in your research interests and we'll generate personalized topic suggestions
                    </p>
                    <Button
                      onClick={generateTopics}
                      disabled={!formData.domain || generating}
                      data-testid="button-generate-topics-empty"
                    >
                      <i className="fas fa-magic mr-2"></i>
                      Generate Topics
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};
