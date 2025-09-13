import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRooms, useChat } from '@/hooks/useChat';
import { formatDate } from '@/utils/helpers';

export const ChatPage = () => {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { rooms, loading: roomsLoading, createRoom } = useChatRooms();
  const { messages, loading: messagesLoading, sendMessage } = useChat(selectedRoomId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access chat.</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoomId) return;

    await sendMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleCreateNewChat = async () => {
    const roomId = await createRoom('General Support');
    if (roomId) {
      setSelectedRoomId(roomId);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Support Chat</h1>
          <p className="text-muted-foreground">Get instant help from our academic support team</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm h-[600px] flex">
          {/* Chat Sidebar */}
          <div className="w-1/3 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Messages</h3>
                <Button size="sm" onClick={handleCreateNewChat} data-testid="new-chat-button">
                  <i className="fas fa-plus mr-2"></i>New
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {roomsLoading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors ${
                      selectedRoomId === room.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedRoomId(room.id)}
                    data-testid={`chat-room-${room.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          A
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{room.title || 'Admin Support'}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(room.updatedAt!)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Last message preview...
                        </p>
                      </div>
                      {room.isActive && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <i className="fas fa-comments text-4xl mb-4"></i>
                  <p>No conversations yet</p>
                  <Button onClick={handleCreateNewChat} className="mt-4" data-testid="start-first-chat">
                    Start Your First Chat
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedRoomId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">Admin Support</h4>
                      <p className="text-sm text-muted-foreground">Online • Typically replies instantly</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.senderId === user.id ? 'justify-end' : ''
                        }`}
                        data-testid={`message-${message.id}`}
                      >
                        {message.senderId !== user.id && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              A
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${
                          message.senderId === user.id ? 'order-first' : ''
                        }`}>
                          <div className={`p-3 rounded-xl ${
                            message.senderId === user.id
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}>
                            {message.type === 'text' ? (
                              <p className="text-sm">{message.content}</p>
                            ) : message.type === 'file' ? (
                              <div className="flex items-center space-x-2">
                                <i className="fas fa-file"></i>
                                <span className="text-sm">{message.fileName}</span>
                              </div>
                            ) : null}
                          </div>
                          <div className={`text-xs text-muted-foreground mt-1 ${
                            message.senderId === user.id ? 'text-right' : ''
                          }`}>
                            {formatDate(message.createdAt!)}
                          </div>
                        </div>

                        {message.senderId === user.id && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profilePicture || undefined} />
                            <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <i className="fas fa-comment text-4xl mb-4"></i>
                      <p>Start the conversation by sending a message below</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="border-t border-border p-4">
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                    <Button type="button" variant="ghost" size="sm" data-testid="attach-file-button">
                      <i className="fas fa-paperclip"></i>
                    </Button>
                    <Button type="button" variant="ghost" size="sm" data-testid="voice-record-button">
                      <i className="fas fa-microphone"></i>
                    </Button>
                    <div className="flex-1">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="resize-none"
                        data-testid="message-input"
                      />
                    </div>
                    <Button type="submit" disabled={!messageInput.trim()} data-testid="send-message-button">
                      <i className="fas fa-paper-plane"></i>
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <i className="fas fa-comments text-6xl mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p>Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
