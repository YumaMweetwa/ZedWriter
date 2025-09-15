import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { getMessages, sendMessage } from '../lib/firestore';
import { uploadChatFile } from '../lib/storage';
import { useToast } from '@/hooks/use-toast';
import { wsManager } from '../lib/websocket';
import type { Message } from '../types';

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const threadId = user ? `thread_${user.id}` : '';

  useEffect(() => {
    if (!threadId) return;

    // Set up real-time message listening
    const unsubscribe = getMessages(threadId, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    // Set up WebSocket for real-time features
    wsManager.connect();
    wsManager.on('connected', () => setIsOnline(true));
    wsManager.on('disconnected', () => setIsOnline(false));
    wsManager.on('typing', (data) => {
      if (data.userId !== user?.id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 3000);
      }
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [threadId, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    setSending(true);
    try {
      await sendMessage(threadId, {
        from: 'user',
        type: 'text',
        text: messageText.trim(),
        createdAt: new Date(),
        readBy: [user.id]
      });
      
      setMessageText('');
      
      // Notify typing stopped
      wsManager.send('stop_typing', { userId: user.id, threadId });
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Message failed',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const fileUrl = await uploadChatFile(file, user.id, threadId, (progress) => {
        // Handle upload progress if needed
        console.log('Upload progress:', progress);
      });

      await sendMessage(threadId, {
        from: 'user',
        type: 'file',
        file: {
          name: file.name,
          url: fileUrl,
          size: file.size,
          contentType: file.type
        },
        createdAt: new Date(),
        readBy: [user.id]
      });

      toast({
        title: 'File sent',
        description: 'Your file has been sent successfully',
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (user) {
      wsManager.send('typing', { userId: user.id, threadId });
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('image')) return 'fas fa-image';
    if (contentType.includes('pdf')) return 'fas fa-file-pdf';
    if (contentType.includes('word')) return 'fas fa-file-word';
    if (contentType.includes('excel')) return 'fas fa-file-excel';
    return 'fas fa-file';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to use chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
            </Avatar>
            <div>
              <h4 data-testid="text-chat-title" className="font-semibold">Academic Support</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <p data-testid="text-chat-status" className="text-sm text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'} • Typically replies instantly
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <i className="fas fa-ellipsis-v"></i>
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                  {message.from === 'admin' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">A</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`rounded-xl p-3 ${
                    message.from === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.type === 'text' && message.text && (
                      <p className="text-sm">{message.text}</p>
                    )}
                    
                    {message.type === 'file' && message.file && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <i className={`${getFileIcon(message.file.contentType)} text-lg`}></i>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.file.name}</p>
                            <p className="text-xs opacity-80">
                              {(message.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={message.from === 'user' ? 'secondary' : 'default'}
                          onClick={() => window.open(message.file!.url, '_blank')}
                        >
                          <i className="fas fa-download mr-1"></i>
                          Download
                        </Button>
                      </div>
                    )}
                    
                    <div className={`text-xs mt-1 ${
                      message.from === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                  
                  {message.from === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                        {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">A</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
            <p className="text-muted-foreground">Send a message to get help from our support team</p>
          </div>
        )}
      </CardContent>

      {/* Chat Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            data-testid="button-attach-file"
          >
            <i className="fas fa-paperclip"></i>
          </Button>
          
          <div className="flex-1">
            <Input
              data-testid="input-chat-message"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="resize-none"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            data-testid="button-send-message"
          >
            {sending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
