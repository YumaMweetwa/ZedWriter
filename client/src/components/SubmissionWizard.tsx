import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useDropzone } from 'react-dropzone';
import { FileUpload, SubmissionFormData } from '@/types';
import { generateId, calculateAmount } from '@/utils/helpers';
import { validateFile, formatFileSize } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { apiRequest } from '@/lib/queryClient';
import { WORK_TYPES, PAYMENT_METHODS, PAYMENT_ARRANGEMENTS } from '@/utils/constants';

const submissionSchema = z.object({
  type: z.string().min(1, 'Work type is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  school: z.string().min(1, 'School/University is required'),
  researchTitle: z.string().optional(),
  supervisorName: z.string().optional(),
  supervisorContact: z.string().optional(),
  assignmentTopic: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  instructorName: z.string().optional(),
  fileFormat: z.string().default('pdf'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentArrangement: z.string().min(1, 'Payment arrangement is required'),
  comments: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

interface SubmissionWizardProps {
  preselectedType?: string;
}

export const SubmissionWizard = ({ preselectedType }: SubmissionWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const { user } = useAuth();
  const { showToast, setLoading } = useApp();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      type: preselectedType || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      school: user?.school || '',
      fileFormat: 'pdf',
      paymentMethod: 'mobile_money',
      paymentArrangement: '50_50',
    },
  });

  const watchedType = form.watch('type');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileUpload[] = acceptedFiles.map(file => {
      const validation = validateFile(file);
      return {
        id: generateId(),
        file,
        progress: validation.valid ? 100 : 0,
        error: validation.error,
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 6,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await form.trigger();
      
      // Additional validation for type-specific fields
      const formData = form.getValues();
      if (formData.type === 'proposal' || formData.type === 'dissertation') {
        if (!formData.researchTitle) {
          form.setError('researchTitle', { message: 'Research title is required' });
          isValid = false;
        }
      } else if (formData.type === 'assignment') {
        if (!formData.assignmentTopic) {
          form.setError('assignmentTopic', { message: 'Assignment topic is required' });
          isValid = false;
        }
        if (!formData.fieldOfStudy) {
          form.setError('fieldOfStudy', { message: 'Field of study is required' });
          isValid = false;
        }
      }
    } else {
      isValid = true;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = async (data: SubmissionFormValues) => {
    if (!user) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to submit your work.'
      });
      return;
    }

    try {
      setLoading({
        isLoading: true,
        title: 'Submitting Work...',
        message: 'Please wait while we process your submission.'
      });

      const submissionData = {
        userId: user.id,
        type: data.type,
        title: data.researchTitle || data.assignmentTopic || `${WORK_TYPES[data.type]?.label} Submission`,
        description: data.comments,
        requirements: {
          firstName: data.firstName,
          lastName: data.lastName,
          studentId: data.studentId,
          email: data.email,
          phone: data.phone,
          school: data.school,
          researchTitle: data.researchTitle,
          supervisorName: data.supervisorName,
          supervisorContact: data.supervisorContact,
          assignmentTopic: data.assignmentTopic,
          fieldOfStudy: data.fieldOfStudy,
          instructorName: data.instructorName,
        },
        fileFormat: data.fileFormat,
        preferredDate: new Date(data.preferredDate),
        paymentMethod: data.paymentMethod,
        paymentArrangement: data.paymentArrangement,
        amount: calculateAmount(data.type),
        paidAmount: 0,
        files: uploadedFiles.map(f => ({
          id: f.id,
          name: f.file.name,
          size: f.file.size,
          type: f.file.type,
        })),
        comments: data.comments,
        status: 'pending',
      };

      const response = await apiRequest('POST', '/api/submissions', submissionData);
      const submission = await response.json();
      
      showToast({
        type: 'success',
        title: 'Submission Successful!',
        message: 'Your work has been submitted successfully. We will contact you shortly.'
      });

      // Reset form
      form.reset();
      setUploadedFiles([]);
      setCurrentStep(1);

    } catch (error) {
      console.error('Submission error:', error);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit your work. Please try again.'
      });
    } finally {
      setLoading({ isLoading: false });
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            step <= currentStep 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {step}
          </div>
          <span className={`ml-3 font-medium ${
            step <= currentStep ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            {step === 1 ? 'Details' : step === 2 ? 'Files' : 'Review'}
          </span>
          {step < 3 && (
            <div className={`w-16 h-1 mx-4 rounded-full ${
              step < currentStep ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Submit Your Work</h1>
          <p className="text-muted-foreground">Complete the form in three simple steps</p>
        </div>

        {renderStepIndicator()}

        <Card className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step 1: Details */}
              {currentStep === 1 && (
                <div className="space-y-6" data-testid="step-1">
                  <CardHeader className="px-0">
                    <CardTitle>Submission Details</CardTitle>
                  </CardHeader>
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Work *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="work-type-select">
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(WORK_TYPES).map(([key, type]) => (
                              <SelectItem key={key} value={key}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" data-testid="first-name-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" data-testid="last-name-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your student ID" data-testid="student-id-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" data-testid="email-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone/WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="+260 xxx xxx xxx" data-testid="phone-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="school"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School/University *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your institution" data-testid="school-input" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Type-specific fields */}
                  {(watchedType === 'proposal' || watchedType === 'dissertation') && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="researchTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Research Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your research title" data-testid="research-title-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="supervisorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supervisor Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter supervisor's name" data-testid="supervisor-name-input" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="supervisorContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supervisor Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="Email or phone number" data-testid="supervisor-contact-input" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {watchedType === 'assignment' && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="assignmentTopic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Topic/Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter assignment topic" data-testid="assignment-topic-input" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fieldOfStudy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field of Study *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Computer Science" data-testid="field-of-study-input" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="instructorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instructor Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter instructor's name" data-testid="instructor-name-input" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fileFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred File Format</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="file-format-select">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="docx">Word Document</SelectItem>
                              <SelectItem value="both">Both PDF and Word</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Completion Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              data-testid="preferred-date-input" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="payment-method-select">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
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
                      name="paymentArrangement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Arrangement</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="payment-arrangement-select">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_ARRANGEMENTS.map((arrangement) => (
                                <SelectItem key={arrangement.value} value={arrangement.value}>
                                  {arrangement.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Comments</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific requirements or additional information (max 500 characters)"
                            maxLength={500}
                            data-testid="comments-textarea"
                            {...field} 
                          />
                        </FormControl>
                        <div className="text-right text-xs text-muted-foreground">
                          {field.value?.length || 0}/500 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextStep} data-testid="next-step-1">
                      Next: Upload Files <i className="fas fa-arrow-right ml-2"></i>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Files */}
              {currentStep === 2 && (
                <div className="space-y-6" data-testid="step-2">
                  <CardHeader className="px-0">
                    <CardTitle>Upload Files</CardTitle>
                  </CardHeader>

                  {/* File Upload Area */}
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    data-testid="file-upload-area"
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Support for PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX files
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum file size: 20MB each, up to 6 files total
                        </p>
                      </div>
                      <Button type="button" variant="outline">
                        Select Files
                      </Button>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
                      {uploadedFiles.map((fileUpload) => (
                        <div 
                          key={fileUpload.id} 
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                          data-testid={`uploaded-file-${fileUpload.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <i className="fas fa-file-pdf text-red-500"></i>
                            <div>
                              <p className="text-sm font-medium text-foreground">{fileUpload.file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(fileUpload.file.size)}</p>
                              {fileUpload.error && (
                                <p className="text-xs text-destructive">{fileUpload.error}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${fileUpload.progress}%` }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileUpload.id)}
                              data-testid={`remove-file-${fileUpload.id}`}
                            >
                              <i className="fas fa-times text-destructive"></i>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} data-testid="prev-step-2">
                      <i className="fas fa-arrow-left mr-2"></i> Back
                    </Button>
                    <Button type="button" onClick={nextStep} data-testid="next-step-2">
                      Next: Review <i className="fas fa-arrow-right ml-2"></i>
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6" data-testid="step-3">
                  <CardHeader className="px-0">
                    <CardTitle>Review Submission</CardTitle>
                  </CardHeader>
                  
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Personal Information</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><span className="font-medium">Name:</span> {form.getValues('firstName')} {form.getValues('lastName')}</p>
                          <p><span className="font-medium">Student ID:</span> {form.getValues('studentId')}</p>
                          <p><span className="font-medium">School:</span> {form.getValues('school')}</p>
                          <p><span className="font-medium">Email:</span> {form.getValues('email')}</p>
                          <p><span className="font-medium">Phone:</span> {form.getValues('phone')}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Work Details</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><span className="font-medium">Type:</span> {WORK_TYPES[form.getValues('type')]?.label}</p>
                          <p><span className="font-medium">Title:</span> {form.getValues('researchTitle') || form.getValues('assignmentTopic') || 'N/A'}</p>
                          <p><span className="font-medium">Format:</span> {form.getValues('fileFormat').toUpperCase()}</p>
                          <p><span className="font-medium">Due Date:</span> {form.getValues('preferredDate')}</p>
                          <p><span className="font-medium">Payment:</span> {PAYMENT_METHODS.find(m => m.value === form.getValues('paymentMethod'))?.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Files Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Uploaded Files</h4>
                      <div className="space-y-2">
                        {uploadedFiles.length > 0 ? (
                          uploadedFiles.map((fileUpload) => (
                            <div key={fileUpload.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <i className="fas fa-file text-primary"></i>
                              <span>{fileUpload.file.name}</span>
                              <span>({formatFileSize(fileUpload.file.size)})</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No files uploaded</p>
                        )}
                      </div>
                    </div>

                    {/* Comments */}
                    {form.getValues('comments') && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Additional Comments</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {form.getValues('comments')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} data-testid="prev-step-3">
                      <i className="fas fa-arrow-left mr-2"></i> Back
                    </Button>
                    <Button type="submit" data-testid="submit-work">
                      Submit Work <i className="fas fa-check ml-2"></i>
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
};
