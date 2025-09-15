import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  submissionId?: string;
  content: string;
  type: 'text' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
  createdAt: Date;
  senderName?: string;
}

interface ChatInterfaceProps {
  submissionId?: string;
  adminMode?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ submissionId, adminMode = false }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { connected, messages: wsMessages, sendChatMessage } = useWebSocket(user?.id);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['/api/messages', user?.id, submissionId],
    enabled: !!user?.id,
  });

  // Combine stored messages with real-time messages
  const allMessages = [...messages, ...wsMessages.filter((ws: any) => ws.type === 'chat_message')];

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const receiverId = adminMode ? 'student' : 'admin'; // Simplified receiver logic
    sendChatMessage(receiverId, newMessage, submissionId);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  };

  const isMyMessage = (message: ChatMessage) => {
    return message.senderId === user?.id;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="chat-interface">
      {/* Chat Header */}
      <div className="bg-primary text-primary-foreground p-4" data-testid="chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-foreground text-primary rounded-full flex items-center justify-center font-semibold">
              {adminMode ? 'S' : 'A'}
            </div>
            <div>
              <div className="font-semibold" data-testid="chat-recipient-name">
                {adminMode ? 'Student' : 'Academic Support'}
              </div>
              <div className="text-sm text-primary-foreground/80" data-testid="chat-status">
                {connected ? 'Online • Typically replies instantly' : 'Connecting...'}
              </div>
            </div>
          </div>
          <button className="text-primary-foreground/80 hover:text-primary-foreground" data-testid="button-chat-menu">
            <i className="fas fa-ellipsis-v" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="h-96 overflow-y-auto p-4 space-y-4" 
        data-testid="chat-messages"
      >
        {allMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8" data-testid="chat-empty-state">
            <i className="fas fa-comments text-4xl mb-4" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          allMessages.map((message: ChatMessage, index: number) => (
            <div
              key={message.id || index}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${index}`}
            >
              <div
                className={`message-bubble max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMyMessage(message)
                    ? 'message-sent'
                    : 'message-received'
                }`}
              >
                {message.type === 'file' ? (
                  <div className="space-y-2" data-testid="message-file">
                    <p className="text-sm">{message.content}</p>
                    <div className="bg-card/20 border border-border/20 rounded-lg p-3 flex items-center space-x-3">
                      <i className="fas fa-file-pdf text-current" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{message.fileName}</div>
                        <div className="text-xs opacity-80">Click to download</div>
                      </div>
                      <button className="text-current hover:opacity-80 text-sm">
                        <i className="fas fa-download" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" data-testid="message-content">
                    {message.content}
                  </p>
                )}
                <div className={`text-xs mt-1 ${isMyMessage(message) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} data-testid="message-timestamp">
                  {formatTime(message.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start" data-testid="typing-indicator">
            <div className="message-received message-bubble px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-border p-4" data-testid="chat-input">
        <div className="flex items-end space-x-3">
          <button 
            className="text-muted-foreground hover:text-primary p-2"
            data-testid="button-attach-file"
          >
            <i className="fas fa-paperclip" />
          </button>
          <button 
            className="text-muted-foreground hover:text-primary p-2"
            data-testid="button-voice-record"
          >
            <i className="fas fa-microphone" />
          </button>
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
              data-testid="input-message"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !connected}
            data-testid="button-send-message"
          >
            <i className="fas fa-paper-plane" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
