import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, ExternalLink } from 'lucide-react';

export const WhatsAppChat = () => {
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const adminWhatsApp = "+260971215524";
  const adminName = "Yuma Mweetwa";
  
  const handleWhatsAppRedirect = () => {
    setIsRedirecting(true);
    
    // Create WhatsApp message with user info
    const message = user
      ? `Hi, I'm ${user.displayName || user.firstName || 'a student'} (${user.email}) and I need help with my research work.`
      : "Hi, I need help with my research work.";
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${adminWhatsApp.replace('+', '')}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab/window
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Reset redirecting state after a short delay
    setTimeout(() => setIsRedirecting(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-green-600 text-white">YM</AvatarFallback>
            </Avatar>
            <div>
              <h4 data-testid="text-chat-title" className="font-semibold">Academic Support</h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p data-testid="text-chat-status" className="text-sm text-muted-foreground">
                  Available on WhatsApp • Quick responses
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">WhatsApp</span>
          </div>
        </div>
      </CardHeader>

      {/* WhatsApp Info Content */}
      <CardContent className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Chat with {adminName}</h3>
            <p className="text-muted-foreground">
              Get instant help with your research work through WhatsApp. Our academic support team is ready to assist you with:
            </p>
            
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Research topic guidance</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Submission status updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Payment confirmations</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>General academic support</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleWhatsAppRedirect}
              disabled={isRedirecting}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-whatsapp-chat"
            >
              {isRedirecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opening WhatsApp...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start WhatsApp Chat
                  <ExternalLink className="w-3 h-3 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Phone: <span className="font-mono">{adminWhatsApp}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </div>
  );
};