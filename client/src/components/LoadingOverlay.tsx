import { useApp } from '@/contexts/AppContext';

export const LoadingOverlay = () => {
  const { loading } = useApp();

  if (!loading.isLoading) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      data-testid="loading-overlay"
    >
      <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg max-w-sm mx-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-ping mx-auto"></div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          {loading.title || 'Loading...'}
        </h3>
        
        <p className="text-sm text-muted-foreground">
          {loading.message || 'Please wait while we process your request.'}
        </p>
        
        <div className="mt-4">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
