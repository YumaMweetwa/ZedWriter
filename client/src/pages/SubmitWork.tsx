import { useEffect, useState } from 'react';
import { SubmissionWizard } from '../components/SubmissionWizard';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const SubmitWork = () => {
  const [preselectedType, setPreselectedType] = useState<string | undefined>();

  useEffect(() => {
    // Get type from URL params
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) {
      setPreselectedType(type);
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <SubmissionWizard preselectedType={preselectedType} />
      </div>
    </ProtectedRoute>
  );
};
