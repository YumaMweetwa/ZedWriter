import { useState, useEffect } from 'react';
import { ChatService } from '@/lib/chat';
import { Message, ChatRoom } from '@shared/types';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { uploadFile } from '@/lib/storage';

export const useChat = (roomId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useApp();

  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    const unsubscribe = ChatService.subscribeToMessages(roomId, (messages) => {
      setMessages(messages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async (content: string, type: 'text' | 'file' = 'text', file?: File) => {
    if (!roomId || !user) return;

    try {
      let fileUrl, fileName, fileSize;
      
      if (type === 'file' && file) {
        fileUrl = await uploadFile(file, `chat/${roomId}`);
        fileName = file.name;
        fileSize = file.size;
      }

      await ChatService.sendMessage(roomId, {
        senderId: user.id,
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        isRead: false,
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      showToast({
        type: 'error',
        title: 'Message Failed',
        message: 'Failed to send message. Please try again.'
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await ChatService.markMessageAsRead(messageId);
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
};

export const useChatRooms = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useApp();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = ChatService.subscribeToChatRooms(user.id, (rooms) => {
      setRooms(rooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const createRoom = async (title: string, submissionId?: string) => {
    if (!user) return;

    try {
      const roomId = await ChatService.createChatRoom({
        userId: user.id,
        submissionId,
        title,
        isActive: true,
      });
      
      showToast({
        type: 'success',
        title: 'Chat Created',
        message: 'New chat room created successfully.'
      });
      
      return roomId;
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create chat room. Please try again.'
      });
    }
  };

  return {
    rooms,
    loading,
    createRoom,
  };
};
