import { Button } from '@/components/ui/button';

interface BackButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
}

export const BackButton = ({ className = '', variant = 'outline' }: BackButtonProps) => {
  const handleGoBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, go to homepage
      window.location.href = '/';
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleGoBack}
      className={`mb-6 ${className}`}
      data-testid="back-button"
    >
      <i className="fas fa-arrow-left mr-2"></i>
      Back
    </Button>
  );
};