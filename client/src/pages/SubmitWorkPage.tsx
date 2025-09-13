import React from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { apiRequest } from '@/main';
import { SubmissionWizard } from '@/components/SubmissionWizard';

const SubmitWorkPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get preselected type from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedType = urlParams.get('type') || undefined;

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (key !== 'files') {
          formData.append(key, data[key]);
        }
      });

      // Add files
      data.files?.forEach((fileObj: any) => {
        if (fileObj.file) {
          formData.append('files', fileObj.file);
        }
      });

      return apiRequest('/api/submissions', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set content-type for FormData
      });
    },
    onSuccess: (response) => {
      showToast('success', 'Submission created successfully! You will be redirected to your dashboard.');
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      showToast('error', error.message || 'Failed to submit. Please try again.');
    },
  });

  const handleSubmit = async (data: any) => {
    await submitMutation.mutateAsync(data);
  };

  return (
    <div className="py-12 bg-background min-h-screen" data-testid="submit-work-page">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4" data-testid="page-title">Submit Your Work</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Complete the steps below to submit your request
        </p>
      </div>

      <SubmissionWizard 
        preselectedType={preselectedType}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default SubmitWorkPage;
