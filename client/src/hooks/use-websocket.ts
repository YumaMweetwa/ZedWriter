import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface WebSocketMessage {
  type: string;
  roomId?: string;
  content?: string;
  messageType?: string;
  [key: string]: any;
}

interface WebSocketOptions {
  roomId?: string;
  autoReconnect?: boolean;
  maxMessageSize?: number;
}

export const useWebSocket = (userId?: string, options: WebSocketOptions = {}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket | null>(null);

  const { 
    roomId, 
    autoReconnect = true, 
    maxMessageSize = 64 * 1024 // 64KB default limit
  } = options;

  const connectWebSocket = async () => {
    // Only attempt to connect if userId is present
    if (!userId) {
      // Do not set error, just skip connection for unauthenticated users
      return;
    }
    try {
      // Get the current session and access token
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.access_token) {
        // Do not set error, just skip connection for unauthenticated users
        return;
      }
      // Build WebSocket URL with auth token
      const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
                    window.location.host + '/ws?token=' + encodeURIComponent(session.access_token);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setConnected(true);
        setSocket(ws);
        setConnectionError(null);
        setReconnectAttempts(0);
        
        // Join room if specified, otherwise join default user room
        if (roomId) {
          ws.send(JSON.stringify({ type: 'join_room', roomId, userId }));
        } else {
          ws.send(JSON.stringify({ type: 'join', userId }));
        }
      };

      ws.onmessage = (event) => {
        try {
          // Validate message size
          if (event.data.length > maxMessageSize) {
            console.error('Received message exceeds size limit:', event.data.length);
            return;
          }

          const message = JSON.parse(event.data);
          
          // Validate message structure
          if (typeof message !== 'object' || !message.type) {
            console.error('Invalid message format received:', message);
            return;
          }

          setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setConnected(false);
        setSocket(null);
        wsRef.current = null;
        
        // Attempt reconnection if enabled and not a normal closure
        if (autoReconnect && event.code !== 1000 && reconnectAttempts < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff
          console.log(`Attempting reconnect in ${timeout}ms (attempt ${reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
        setConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionError('Failed to establish connection');
    }
  };

  useEffect(() => {
    if (userId) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [userId, roomId]); // Reconnect when userId or roomId changes

  // Listen for auth state changes and reconnect if needed
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Close connection on sign out
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'User signed out');
        }
        setSocket(null);
        setConnected(false);
      } else if (event === 'TOKEN_REFRESHED' && connected) {
        // Reconnect with new token
        console.log('Token refreshed, reconnecting WebSocket');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'Token refresh');
        }
        setTimeout(connectWebSocket, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [connected, userId]);

  const sendMessage = (message: WebSocketMessage) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      // Validate message size
      const messageStr = JSON.stringify(message);
      if (messageStr.length > maxMessageSize) {
        console.error('Message exceeds size limit:', messageStr.length);
        return false;
      }

      socket.send(messageStr);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  };

  const sendChatMessage = (receiverId: string, content: string, options: {
    submissionId?: string;
    messageType?: string;
    roomId?: string;
  } = {}) => {
    const { submissionId, messageType = 'text', roomId: msgRoomId } = options;
    
    if (!content?.trim()) {
      console.error('Cannot send empty message');
      return false;
    }

    return sendMessage({
      type: 'send_message',
      roomId: msgRoomId || roomId || `${userId}-${receiverId}`, // Use provided roomId or generate one
      senderId: userId,
      receiverId,
      submissionId,
      content: content.trim(),
      messageType,
      timestamp: new Date().toISOString(),
    });
  };

  const joinRoom = (newRoomId: string) => {
    return sendMessage({
      type: 'join_room',
      roomId: newRoomId,
      userId
    });
  };

  const leaveRoom = (roomIdToLeave: string) => {
    return sendMessage({
      type: 'leave_room',
      roomId: roomIdToLeave,
      userId
    });
  };

  return {
    connected,
    messages,
    connectionError,
    reconnectAttempts,
    sendMessage,
    sendChatMessage,
    joinRoom,
    leaveRoom,
    reconnect: connectWebSocket,
  };
};
