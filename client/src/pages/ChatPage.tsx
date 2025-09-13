import { WhatsAppChat } from '@/components/WhatsAppChat';
import { Card } from '@/components/ui/card';

export const ChatPage = () => {
  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Support Chat</h1>
          <p className="text-muted-foreground">Get instant help from our academic support team via WhatsApp</p>
        </div>

        <Card className="h-[600px]">
          <WhatsAppChat />
        </Card>
      </div>
    </div>
  );
};
