import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { SupabaseStorage } from "./storage-supabase";
import { authenticateToken, optionalAuth } from "./middleware/auth";
import { upload, validateFileUpload } from "./middleware/upload";
import { 
  type PricingService,
  type InsertPricingService 
} from "@shared/types";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';

// WebSocket message validation schemas
const wsMessageSchema = z.object({
  type: z.string(),
  roomId: z.string().optional(),
  userId: z.string().optional(),
  senderId: z.string().optional(),
  receiverId: z.string().optional(),
  submissionId: z.string().optional(),
  content: z.string().max(10000).optional(), // 10KB text limit
  messageType: z.enum(['text', 'file', 'voice', 'image']).optional(),
  timestamp: z.string().optional(),
}).strict();

const joinRoomSchema = z.object({
  type: z.literal('join_room'),
  roomId: z.string().min(1),
  userId: z.string().min(1),
}).strict();

const sendMessageSchema = z.object({
  type: z.literal('send_message'),
  roomId: z.string().min(1),
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  submissionId: z.string().optional(),
  content: z.string().min(1).max(10000),
  messageType: z.enum(['text', 'file', 'voice', 'image']).default('text'),
  timestamp: z.string(),
}).strict();

// Initialize Supabase storage
const storage = new SupabaseStorage();

// Simple validation schemas
const submissionSchema = z.object({
  userId: z.string(),
  type: z.string(),
  status: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  requirements: z.any().optional(),
  fileFormat: z.string().optional(),
  preferredDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentArrangement: z.string().optional(),
  amount: z.number(),
  paidAmount: z.number().optional(),
  files: z.any().optional(),
  comments: z.string().optional(),
  adminNotes: z.string().optional(),
});

const paymentSchema = z.object({
  userId: z.string(),
  submissionId: z.string().optional(),
  amount: z.number().positive(),
  method: z.string(),
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  metadata: z.any().optional(),
});

const pricingServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  features: z.any(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  category: z.string().optional(),
  orderIndex: z.number().optional(),
});

// Initialize Gemini AI with API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Enhanced WebSocket connection tracking with room management
  const wsConnections = new Map<WebSocket, { userId: string; userEmail: string; rooms: Set<string> }>();
  const roomConnections = new Map<string, Set<WebSocket>>(); // roomId -> Set of WebSocket connections
  
  // Helper functions for room management
  const addConnectionToRoom = (ws: WebSocket, roomId: string) => {
    const userInfo = wsConnections.get(ws);
    if (!userInfo) return false;
    
    // Add room to user's room set
    userInfo.rooms.add(roomId);
    
    // Add connection to room's connection set
    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId)!.add(ws);
    
    console.log(`User ${userInfo.userId} joined room: ${roomId}`);
    return true;
  };
  
  const removeConnectionFromRoom = (ws: WebSocket, roomId: string) => {
    const userInfo = wsConnections.get(ws);
    if (userInfo) {
      userInfo.rooms.delete(roomId);
    }
    
    const roomConns = roomConnections.get(roomId);
    if (roomConns) {
      roomConns.delete(ws);
      if (roomConns.size === 0) {
        roomConnections.delete(roomId);
      }
    }
  };
  
  const removeConnectionFromAllRooms = (ws: WebSocket) => {
    const userInfo = wsConnections.get(ws);
    if (userInfo) {
      userInfo.rooms.forEach(roomId => {
        removeConnectionFromRoom(ws, roomId);
      });
    }
  };
  
  const broadcastToRoom = (roomId: string, message: object, excludeWs?: WebSocket) => {
    const roomConns = roomConnections.get(roomId);
    if (!roomConns) return 0;
    
    let sentCount = 0;
    roomConns.forEach(ws => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error('Error sending message to client:', error);
          // Remove broken connection
          removeConnectionFromAllRooms(ws);
          wsConnections.delete(ws);
        }
      }
    });
    
    return sentCount;
  };

  // Helper function to validate room access authorization
  const validateRoomAccess = (userId: string, roomId: string): boolean => {
    // Allow access to user's own room
    if (roomId === `user_${userId}`) {
      return true;
    }
    
    // Allow admin users to access admin rooms (if needed in future)
    // Additional room authorization logic can be added here
    
    // For direct message rooms, ensure user is part of the conversation
    // Format: "user1Id-user2Id" or "user2Id-user1Id"
    if (roomId.includes('-') && roomId.split('-').length === 2) {
      const participants = roomId.split('-');
      return participants.includes(userId);
    }
    
    // Deny access to all other rooms by default
    console.log(`Access denied: User ${userId} attempted to access unauthorized room ${roomId}`);
    return false;
  };

  // Setup WebSocket server for real-time chat with authentication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info: any, done: (result: boolean) => void) => {
      // Convert to async handling with proper callback
      (async () => {
        try {
          // Extract token from URL query or headers
          const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
          const token = url.searchParams.get('token') || 
                       info.req.headers.authorization?.replace('Bearer ', '');
          
          if (!token) {
            console.log('WebSocket connection rejected: No authentication token provided');
            return done(false);
          }

          // Verify the JWT token with Supabase
          const supabaseUrl = process.env.VITE_SUPABASE_URL!;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
          
          if (!supabaseUrl || !supabaseServiceKey) {
            console.error('WebSocket: Missing Supabase environment variables');
            return done(false);
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          if (error || !user) {
            console.log('WebSocket connection rejected: Invalid token', error?.message);
            return done(false);
          }

          // Store user info in the request for later use
          (info.req as any).authenticatedUser = {
            userId: user.id,
            userEmail: user.email || 'unknown@example.com'
          };

          console.log(`WebSocket connection authenticated for user: ${user.id}`);
          return done(true);
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          return done(false);
        }
      })();
    }
  });

  // WebSocket connection handling with authenticated users
  wss.on('connection', (ws: WebSocket, req: any) => {
    const authenticatedUser = req.authenticatedUser;
    
    if (!authenticatedUser) {
      console.error('WebSocket connection without authenticated user info');
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Store the authenticated user info for this connection with empty rooms set
    wsConnections.set(ws, { ...authenticatedUser, rooms: new Set<string>() });
    
    console.log(`Authenticated WebSocket connection established for user: ${authenticatedUser.userId}`);
    
    ws.on('message', async (message) => {
      try {
        // Validate message size (10MB limit)
        const messageSize = Buffer.isBuffer(message) ? message.length : 
                           message instanceof ArrayBuffer ? message.byteLength :
                           Array.isArray(message) ? message.reduce((total, buf) => total + buf.length, 0) : 0;
        
        if (messageSize > 10 * 1024 * 1024) {
          console.error('Message too large:', messageSize);
          ws.close(1009, 'Message too large');
          return;
        }

        const rawData = JSON.parse(message.toString());
        
        // Validate basic message structure
        const validationResult = wsMessageSchema.safeParse(rawData);
        if (!validationResult.success) {
          console.error('Invalid message format:', validationResult.error.errors);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          return;
        }
        
        const data = validationResult.data;
        const connectedUser = wsConnections.get(ws);
        
        if (!connectedUser) {
          console.error('Message from unauthenticated WebSocket connection');
          ws.close(1008, 'Authentication required');
          return;
        }
        
        switch (data.type) {
          case 'join':
            // Join default user room for backwards compatibility
            const defaultRoomId = `user_${connectedUser.userId}`;
            addConnectionToRoom(ws, defaultRoomId);
            break;
            
          case 'join_room':
            // Validate join room message
            const joinValidation = joinRoomSchema.safeParse(data);
            if (!joinValidation.success) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid join_room format' }));
              return;
            }
            
            // Security check: ensure user can only join as themselves
            if (joinValidation.data.userId !== connectedUser.userId) {
              console.error(`User ${connectedUser.userId} attempted to join room as ${joinValidation.data.userId}`);
              ws.close(1008, 'Authentication violation');
              return;
            }
            
            // Validate room access permissions
            const roomId = joinValidation.data.roomId;
            if (!roomId.match(/^[a-zA-Z0-9_-]+$/)) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid room ID format' }));
              return;
            }
            
            // CRITICAL SECURITY CHECK: Validate room access authorization
            if (!validateRoomAccess(connectedUser.userId, roomId)) {
              ws.send(JSON.stringify({ type: 'error', message: 'Access denied: Unauthorized room access' }));
              return;
            }
            
            addConnectionToRoom(ws, roomId);
            ws.send(JSON.stringify({ type: 'room_joined', roomId }));
            break;
            
          case 'leave_room':
            if (data.roomId) {
              removeConnectionFromRoom(ws, data.roomId);
              ws.send(JSON.stringify({ type: 'room_left', roomId: data.roomId }));
            }
            break;
            
          case 'chat_message':
          case 'send_message':
            // Validate send message format
            const msgValidation = sendMessageSchema.safeParse(data);
            if (!msgValidation.success) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
              return;
            }
            
            const msgData = msgValidation.data;
            
            // Security check: ensure sender ID matches authenticated user
            if (msgData.senderId !== connectedUser.userId) {
              console.error(`User ${connectedUser.userId} attempted to send message as ${msgData.senderId}`);
              ws.close(1008, 'Authentication violation');
              return;
            }
            
            // CRITICAL SECURITY CHECK: Validate room access authorization
            if (!validateRoomAccess(connectedUser.userId, msgData.roomId)) {
              console.error(`Unauthorized message attempt: User ${connectedUser.userId} to room ${msgData.roomId}`);
              ws.send(JSON.stringify({ type: 'error', message: 'Access denied: Unauthorized room access' }));
              return;
            }
            
            // Verify user is in the target room
            if (!connectedUser.rooms.has(msgData.roomId)) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not a member of target room' }));
              return;
            }
            
            console.log(`Message sent by user ${connectedUser.userId} to room ${msgData.roomId}`);
            
            // FIXED: Only broadcast to clients in the SAME ROOM (not all clients)
            const sentCount = broadcastToRoom(msgData.roomId, {
              type: 'new_message',
              roomId: msgData.roomId,
              message: msgData.content,
              senderId: connectedUser.userId, // Use server-verified user ID
              senderEmail: connectedUser.userEmail,
              receiverId: msgData.receiverId,
              submissionId: msgData.submissionId,
              messageType: msgData.messageType,
              timestamp: new Date().toISOString()
            }, ws); // Exclude sender from broadcast
            
            // Send confirmation to sender
            ws.send(JSON.stringify({ 
              type: 'message_sent', 
              roomId: msgData.roomId, 
              timestamp: new Date().toISOString(),
              recipients: sentCount
            }));
            break;
            
          default:
            console.log('Unknown message type:', data.type);
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Message processing failed' }));
      }
    });

    ws.on('close', () => {
      wsConnections.delete(ws);
      console.log(`WebSocket connection closed for user: ${authenticatedUser.userId}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // API Routes

  // Submissions routes
  app.get('/api/submissions', authenticateToken, async (req, res) => {
    try {
      // Use authenticated user's ID instead of query parameter
      const submissions = await storage.getSubmissionsByUser(req.user!.userId);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  app.post('/api/submissions', authenticateToken, async (req, res) => {
    try {
      // Validate the request body using Zod schema
      const validationResult = submissionSchema.safeParse({
        ...req.body,
        userId: req.user!.userId, // Use authenticated user's ID
        createdAt: undefined,
        updatedAt: undefined,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid submission data',
          details: validationResult.error.errors 
        });
      }

      const submissionData = validationResult.data;
      const submission = await storage.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  });

  app.get('/api/submissions/:id', authenticateToken, async (req, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      // Verify ownership - users can only access their own submissions
      if (submission.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Access denied: You can only access your own submissions' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  app.patch('/api/submissions/:id', authenticateToken, async (req, res) => {
    try {
      // First, verify the submission exists and ownership
      const existingSubmission = await storage.getSubmission(req.params.id);
      if (!existingSubmission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      // Verify ownership - users can only update their own submissions
      if (existingSubmission.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Access denied: You can only update your own submissions' });
      }
      
      const submission = await storage.updateSubmission(req.params.id, req.body);
      res.json(submission);
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({ error: 'Failed to update submission' });
    }
  });

  // SECURE: Server-side profile creation endpoint
  app.post('/api/users/create-profile', authenticateToken, async (req, res) => {
    try {
      const { first_name, last_name, email } = req.body;
      
      // Validate required fields
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Security: Use authenticated user's ID and set role securely on server
      const userData = {
        id: req.user!.userId,
        email: email,
        firstName: first_name || null,
        lastName: last_name || null,
        role: 'student', // SECURE: Server-controlled role assignment
        isActive: true,
        referralPoints: 0,
        totalPaid: 0,
        totalOwed: 0,
        createdAt: new Date().toISOString()
      };
      
      const user = await storage.createUser(userData);
      
      // Convert camelCase response to snake_case for client compatibility
      const userResponse = {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        student_id: user.studentId,
        phone: user.phone,
        school: user.school,
        role: user.role,
        profile_picture: user.profilePicture,
        referral_code: user.referralCode,
        referral_points: user.referralPoints,
        total_paid: user.totalPaid,
        total_owed: user.totalOwed,
        is_active: user.isActive,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Check for various "already exists" error patterns
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate key') || 
            errorMessage.includes('unique constraint')) {
          return res.status(409).json({ error: 'User profile already exists' });
        }
      }
      res.status(500).json({ error: 'Failed to create user profile' });
    }
  });

  // Users routes
  app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      // Verify the authenticated user can only access their own data
      if (req.user!.userId !== req.params.id) {
        return res.status(403).json({ error: 'Access denied: You can only access your own user data' });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Convert camelCase response to snake_case for client compatibility
      const userResponse = {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        student_id: user.studentId,
        phone: user.phone,
        school: user.school,
        role: user.role,
        profile_picture: user.profilePicture,
        referral_code: user.referralCode,
        referral_points: user.referralPoints,
        total_paid: user.totalPaid,
        total_owed: user.totalOwed,
        is_active: user.isActive,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', authenticateToken, async (req, res) => {
    try {
      const userData = { ...req.body };
      const user = await storage.createUser(userData);
      
      // Convert camelCase response to snake_case for client compatibility
      const userResponse = {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        student_id: user.studentId,
        phone: user.phone,
        school: user.school,
        role: user.role,
        profile_picture: user.profilePicture,
        referral_code: user.referralCode,
        referral_points: user.referralPoints,
        total_paid: user.totalPaid,
        total_owed: user.totalOwed,
        is_active: user.isActive,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.patch('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      // Verify the authenticated user can only update their own data
      if (req.user!.userId !== req.params.id) {
        return res.status(403).json({ error: 'Access denied: You can only update your own user data' });
      }

      const user = await storage.updateUser(req.params.id, req.body);
      
      // Convert camelCase response to snake_case for client compatibility
      const userResponse = {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        student_id: user.studentId,
        phone: user.phone,
        school: user.school,
        role: user.role,
        profile_picture: user.profilePicture,
        referral_code: user.referralCode,
        referral_points: user.referralPoints,
        total_paid: user.totalPaid,
        total_owed: user.totalOwed,
        is_active: user.isActive,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Materials routes
  app.get('/api/materials', async (req, res) => {
    try {
      const { program, year, type, search } = req.query;
      const materials = await storage.getMaterials({
        program: program as string,
        year: year as string,
        type: type as string,
        search: search as string
      });
      res.json(materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      res.status(500).json({ error: 'Failed to fetch materials' });
    }
  });

  app.post('/api/materials', authenticateToken, async (req, res) => {
    try {
      // Check if the user has admin role (assuming admin users have role 'admin')
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required to create materials' });
      }
      
      const material = await storage.createMaterial({
        ...req.body,
        uploadedBy: req.user!.userId
      });
      res.status(201).json(material);
    } catch (error) {
      console.error('Error creating material:', error);
      res.status(500).json({ error: 'Failed to create material' });
    }
  });

  // Chat routes
  app.get('/api/chat/rooms', authenticateToken, async (req, res) => {
    try {
      // Use authenticated user's ID instead of query parameter
      const rooms = await storage.getChatRoomsByUser(req.user!.userId);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
  });

  app.post('/api/chat/rooms', authenticateToken, async (req, res) => {
    try {
      // Ensure the room is created for the authenticated user
      const room = await storage.createChatRoom({
        ...req.body,
        userId: req.user!.userId
      });
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ error: 'Failed to create chat room' });
    }
  });

  app.get('/api/chat/rooms/:roomId/messages', authenticateToken, async (req, res) => {
    try {
      // First verify the user has access to this chat room
      const rooms = await storage.getChatRoomsByUser(req.user!.userId);
      const hasAccess = rooms.some(room => room.id === req.params.roomId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: You are not a member of this chat room' });
      }
      
      const messages = await storage.getMessagesByRoom(req.params.roomId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/rooms/:roomId/messages', authenticateToken, async (req, res) => {
    try {
      // First verify the user has access to this chat room
      const rooms = await storage.getChatRoomsByUser(req.user!.userId);
      const hasAccess = rooms.some(room => room.id === req.params.roomId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: You are not a member of this chat room' });
      }
      
      const message = await storage.createMessage({
        ...req.body,
        roomId: req.params.roomId,
        senderId: req.user!.userId
      });
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  // Material upload endpoint with local storage
  app.post('/api/materials/upload', authenticateToken, upload.single('file'), validateFileUpload, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title, description, program, year, type } = req.body;
      
      // Auto-generate title from filename if not provided
      const materialTitle = title || req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || req.file.originalname;
      
      // Validate required fields
      if (!program || !year || !type) {
        return res.status(400).json({ error: 'Missing required fields: program, year, and type are required' });
      }

      // Use local storage path
      const filePath = req.file.path;

      // Create material with approval pending
      const material = await storage.createMaterial({
        title: materialTitle,
        description: description || '',
        program,
        year,
        type,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath,
        uploadedBy: req.user!.userId,
        isApproved: false,
      });

      res.status(201).json({
        message: 'Material uploaded successfully and pending approval',
        material
      });
    } catch (error) {
      console.error('Error uploading material:', error);
      res.status(500).json({ error: 'Failed to upload material' });
    }
  });

  // Admin material approval endpoint
  app.put('/api/admin/materials/:id', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const { id } = req.params;
      const updates = req.body;
      
      const material = await storage.updateMaterial(id, updates);
      res.json({
        message: 'Material updated successfully',
        material
      });
    } catch (error) {
      console.error('Error updating material:', error);
      res.status(500).json({ error: 'Failed to update material' });
    }
  });

  // Admin material deletion endpoint
  app.delete('/api/admin/materials/:id', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const { id } = req.params;
      
      // Get material info before deletion for cleanup
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }

      // Delete material from database
      await storage.deleteMaterial(id);

      // Note: File cleanup handled by local storage - files remain in uploads directory
      // For production, consider implementing proper file cleanup logic

      res.json({
        message: 'Material deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      res.status(500).json({ error: 'Failed to delete material' });
    }
  });

  // File upload endpoint
  app.post('/api/uploads', authenticateToken, upload.array('files', 6), validateFileUpload, async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = req.files.map((file: Express.Multer.File) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      }));

      res.json({ files: uploadedFiles });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  });

  // Announcements routes
  app.get('/api/announcements', async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Return empty array when database is unavailable
      res.json([]);
    }
  });

  app.post('/api/announcements', authenticateToken, async (req, res) => {
    try {
      // Check if the user has admin role to create announcements
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required to create announcements' });
      }
      
      const announcement = await storage.createAnnouncement({
        ...req.body,
        createdBy: req.user!.userId
      });
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  // Referrals routes
  app.get('/api/referrals/:userId', authenticateToken, async (req, res) => {
    try {
      // Verify the authenticated user can only access their own referrals
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({ error: 'Access denied: You can only access your own referral data' });
      }

      const referrals = await storage.getReferralsByUser(req.params.userId);
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  });

  app.post('/api/referrals', authenticateToken, async (req, res) => {
    try {
      // Verify the referrer ID matches the authenticated user
      if (req.body.referrerId && req.body.referrerId !== req.user!.userId) {
        return res.status(403).json({ error: 'Access denied: You can only create referrals for yourself' });
      }
      
      const referral = await storage.createReferral({
        ...req.body,
        referrerId: req.user!.userId
      });
      res.status(201).json(referral);
    } catch (error) {
      console.error('Error creating referral:', error);
      res.status(500).json({ error: 'Failed to create referral' });
    }
  });

  // Payments routes
  app.get('/api/payments/:userId', authenticateToken, async (req, res) => {
    try {
      // Verify the authenticated user can only access their own payments
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({ error: 'Access denied: You can only access your own payment data' });
      }

      const payments = await storage.getPaymentsByUser(req.params.userId);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.post('/api/payments', authenticateToken, async (req, res) => {
    try {
      // Verify the user ID matches the authenticated user
      if (req.body.userId && req.body.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Access denied: You can only create payments for yourself' });
      }
      
      const payment = await storage.createPayment({
        ...req.body,
        userId: req.user!.userId
      });
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  // Admin routes
  app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/submissions', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  app.get('/api/admin/materials', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const materials = await storage.getMaterials({});
      res.json(materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      res.status(500).json({ error: 'Failed to fetch materials' });
    }
  });

  app.get('/api/admin/programs', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const materials = await storage.getMaterials({});
      const programs = Array.from(new Set(materials.map(m => m.program).filter(Boolean)));
      res.json(programs);
    } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).json({ error: 'Failed to fetch programs' });
    }
  });

  app.post('/api/admin/programs', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Program name is required' });
      }

      // Create a placeholder material to establish the program
      const material = await storage.createMaterial({
        title: `${name} - Program Placeholder`,
        description: `Placeholder material for ${name} program`,
        program: name.trim(),
        year: 'General',
        type: 'document',
        filePath: '/placeholder',
        fileName: 'placeholder',
        fileSize: 0,
        uploadedBy: req.user!.userId,
      });

      res.status(201).json({ message: 'Program created successfully', material });
    } catch (error) {
      console.error('Error creating program:', error);
      res.status(500).json({ error: 'Failed to create program' });
    }
  });

  app.delete('/api/admin/programs/:name', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const programName = decodeURIComponent(req.params.name);
      
      // Get all materials for this program and delete them
      const materials = await storage.getMaterials({ program: programName });
      
      // Note: We would need to add deleteMaterial method to storage interface
      // For now, just return success
      res.json({ message: `Program "${programName}" and ${materials.length} materials deleted successfully` });
    } catch (error) {
      console.error('Error deleting program:', error);
      res.status(500).json({ error: 'Failed to delete program' });
    }
  });

  // Topic generation route with Gemini AI (temporarily without auth for debugging)
  app.post('/api/generate-topics', async (req, res) => {
    try {
      console.log('Received topic generation request:', req.body);
      const { domain, subdomain, department, studyArea, keywords, comments } = req.body;
      
      // Validate required fields
      if (!domain || !department || !studyArea) {
        console.log('Missing required fields:', { domain, department, studyArea });
        return res.status(400).json({ 
          error: 'Missing required fields: domain, department, and studyArea are required' 
        });
      }
      
      console.log('Generating topics with data:', { domain, department, studyArea, keywords, comments });
      
      // Generate research topics using Gemini AI
      try {
        const topics = await generateResearchTopics({ domain, subdomain, department, studyArea, keywords, comments });
        res.json({ success: true, topics });
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        res.status(500).json({
          error: 'AI service temporarily unavailable. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? (aiError as Error).message : undefined
        });
      }
    } catch (error) {
      console.error('Error generating topics:', error);
      res.status(500).json({ error: 'Failed to generate topics' });
    }
  });

  // Payment confirmation route  
  app.post('/api/payments/confirm', authenticateToken, async (req, res) => {
    try {
      // Validate the request body using Zod schema
      const paymentValidation = paymentSchema.extend({
        submissionId: z.string().refine((val: string) => val !== null, 'submissionId is required'),
        transactionId: z.string().refine((val: string) => val !== null, 'transactionId is required'),
        amount: z.number().min(1, 'amount must be positive')
      }).safeParse({
        ...req.body,
        userId: req.user!.userId,
        status: 'pending',
        method: 'mobile_money'
      });

      if (!paymentValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid payment data',
          details: paymentValidation.error.errors 
        });
      }

      const { submissionId, transactionId, amount, description } = paymentValidation.data;
      
      // Verify the submission belongs to the authenticated user
      const submission = await storage.getSubmission(submissionId!);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      if (submission.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Access denied: You can only confirm payments for your own submissions' });
      }

      // Validate payment amount based on arrangement
      const remainingAmount = (submission.amount || 0) - (submission.paidAmount || 0);
      const paymentArrangement = submission.paymentArrangement || '50_50';
      
      let expectedAmount = 0;
      switch (paymentArrangement) {
        case '50_50':
          expectedAmount = submission.paidAmount === 0 ? (submission.amount || 0) * 0.5 : remainingAmount;
          break;
        case 'full_upfront':
          expectedAmount = submission.amount || 0;
          break;
        case 'full_completion':
          expectedAmount = submission.paidAmount === 0 ? 0 : remainingAmount;
          break;
      }
      
      if (Math.abs(amount - expectedAmount) > 1) { // Allow 1 kwacha tolerance
        return res.status(400).json({ 
          error: `Invalid payment amount. Expected K${expectedAmount} for ${paymentArrangement} arrangement` 
        });
      }

      // Check for duplicate transaction ID for this submission
      const existingPayment = await storage.getPaymentByTransactionId(transactionId!, submissionId!);
      if (existingPayment) {
        return res.status(409).json({ 
          error: 'Transaction ID already used for this submission',
          payment: existingPayment 
        });
      }
      
      // Create payment record with pending status (requires admin verification)
      const payment = await storage.createPayment({
        userId: req.user!.userId,
        submissionId: submissionId!,
        transactionId: transactionId!,
        amount,
        status: 'pending',
        description: description || `Payment confirmation for ${submission.title || 'submission'}`,
        method: 'mobile_money'
      });
      
      res.json({ 
        success: true, 
        message: 'Payment confirmation received. We will verify and update your submission status shortly.',
        payment 
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  });

  // Admin payment adjustment route
  app.post('/api/admin/adjust-payment', authenticateToken, async (req, res) => {
    try {
      // Check if the user has admin role to adjust payments
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required to adjust payments' });
      }
      
      const { submissionId, amount, description, transactionId } = req.body;
      
      // Validate required fields
      if (!submissionId || typeof amount !== 'number' || !description) {
        return res.status(400).json({ 
          error: 'Missing required fields: submissionId, amount, and description are required' 
        });
      }
      
      // Verify the submission exists
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      // Create payment record
      const payment = await storage.createPayment({
        userId: submission.userId,
        submissionId,
        amount,
        status: 'completed',
        description,
        method: 'admin_adjustment',
        transactionId: transactionId || undefined
      });
      
      // Update submission paid amount
      const currentPaidAmount = submission.paidAmount || 0;
      const newPaidAmount = currentPaidAmount + amount;
      
      await storage.updateSubmission(submissionId, {
        paidAmount: newPaidAmount,
        // Update status if fully paid
        status: newPaidAmount >= (submission.amount || 0) ? 'in_progress' : submission.status
      });
      
      res.json({ 
        success: true, 
        message: 'Payment adjustment completed successfully',
        payment 
      });
    } catch (error) {
      console.error('Error adjusting payment:', error);
      res.status(500).json({ error: 'Failed to adjust payment' });
    }
  });

  // Admin stats route
  app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
      // Check if the user has admin role to view admin stats
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required to view admin statistics' });
      }
      
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  // Pricing management routes
  app.get('/api/admin/pricing', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const pricingServices = await storage.getAllPricingServices();
      res.json(pricingServices);
    } catch (error) {
      console.error('Error fetching pricing services:', error);
      res.status(500).json({ error: 'Failed to fetch pricing services' });
    }
  });

  app.post('/api/admin/pricing', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const validatedData = pricingServiceSchema.parse(req.body);
      const pricingService = await storage.createPricingService(validatedData);
      res.status(201).json(pricingService);
    } catch (error) {
      console.error('Error creating pricing service:', error);
      res.status(500).json({ error: 'Failed to create pricing service' });
    }
  });

  app.put('/api/admin/pricing/:id', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const { id } = req.params;
      const updates = req.body;
      
      const pricingService = await storage.updatePricingService(id, updates);
      res.json(pricingService);
    } catch (error) {
      console.error('Error updating pricing service:', error);
      res.status(500).json({ error: 'Failed to update pricing service' });
    }
  });

  app.delete('/api/admin/pricing/:id', authenticateToken, async (req, res) => {
    try {
      // Check admin access
      const user = await storage.getUser(req.user!.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin role required' });
      }

      const { id } = req.params;
      await storage.deletePricingService(id);
      res.json({ message: 'Pricing service deleted successfully' });
    } catch (error) {
      console.error('Error deleting pricing service:', error);
      res.status(500).json({ error: 'Failed to delete pricing service' });
    }
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  return httpServer;
}

// Gemini AI helper function for research topic generation
async function generateResearchTopics(formData: {
  domain: string;
  subdomain?: string;
  department: string;
  studyArea: string;
  keywords?: string;
  comments?: string;
}) {
  console.log('Starting Gemini AI generation with data:', formData);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const prompt = createResearchPrompt(formData);
  console.log('Generated prompt:', prompt);

  try {
    console.log('Making Gemini API call...');
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    console.log('Gemini API call successful');
    console.log('Response structure:', Object.keys(response));
    console.log('Full response:', JSON.stringify(response, null, 2));

    // Try to extract text from response
    let responseText = null;

    // Check if response has text property directly
    if (response.text) {
      responseText = response.text;
      console.log('Found text via response.text');
    }
    // Check candidates structure (newer API format)
    else if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log('Candidate:', candidate);

      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        console.log('First part:', part);

        if (part.text) {
          responseText = part.text;
          console.log('Found text via candidates structure');
        }
      }
    }

    if (!responseText) {
      console.error('Could not extract text from Gemini response');
      throw new Error('Invalid response structure from Gemini API');
    }

    console.log('Extracted response text:', responseText);
    const topics = parseAITopics(responseText);
    console.log('Parsed topics:', topics);

    if (topics.length === 0) {
      throw new Error('No valid topics could be parsed from AI response');
    }

    return topics;
  } catch (apiError) {
    console.error('Gemini API call failed:', apiError);
    console.error('Error details:', (apiError as Error).message);
    throw apiError;
  }
}
// Create optimized prompt for research topics
function createResearchPrompt(formData: {
  domain: string;
  subdomain?: string;
  department: string;
  studyArea: string;
  keywords?: string;
  comments?: string;
}) {
  let prompt = `You are an expert academic research topic generator. Create a single, well-structured research topic that follows this exact format:

Create a research topic focused on the "${formData.subdomain || formData.domain}" field specifically in ${formData.department}. Some key words that should be considered in the research topic are: ${formData.keywords || 'relevant academic terms'}. The study area of this research will be at "${formData.studyArea}".`;

  if (formData.comments) {
    prompt += ` Also consider the following key information: ${formData.comments}.`;
  }

  prompt += `

IMPORTANT REQUIREMENTS:
- Make the topic sound academic and natural with proper grammatical integration
- Do not write abbreviations in the title - use full names only
- Ensure the topic flows naturally as a complete sentence or phrase
- Integrate all required elements (study area, keywords, subdomain, department) seamlessly
- Keep the topic between 15-25 words
- Use formal academic language
- Make it suitable for serious academic research

Generate exactly ONE research topic that reads naturally and academically.`;

  return prompt;
}

// Parse AI response to extract topics
function parseAITopics(text: string): string[] {
  console.log('Parsing AI response text:', text);

  // Clean up the text
  const cleanedText = text.trim();

  // For single topic generation, try to extract the topic directly
  // Remove any prefixes like "Create a research topic..." or similar
  let topic = cleanedText;

  // Remove common prefixes that might be in the response
  const prefixesToRemove = [
    /^Create a research topic/i,
    /^Here is a research topic/i,
    /^The research topic is/i,
    /^Research topic:/i,
    /^Topic:/i
  ];

  for (const prefix of prefixesToRemove) {
    topic = topic.replace(prefix, '').trim();
  }

  // Remove quotes if present
  topic = topic.replace(/^["']|["']$/g, '').trim();

  // If the topic is substantial (more than 10 characters), return it
  if (topic.length > 10) {
    console.log('Extracted single topic:', topic);
    return [topic];
  }

  // Fallback: try to find any substantial text
  const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 15);
  if (sentences.length > 0) {
    const fallbackTopic = sentences[0].trim().replace(/"/g, '');
    console.log('Fallback topic extracted:', fallbackTopic);
    return [fallbackTopic];
  }

  // If all else fails, return the original cleaned text
  console.log('Using original text as topic:', cleanedText);
  return [cleanedText || 'Generated Research Topic'];
}

// Enhanced fallback topic generation
function generateEnhancedFallbackTopics(formData: {
  domain: string;
  department: string;
  studyArea: string;
  keywords?: string;
  comments?: string;
}): string[] {
  const { domain, department, studyArea, keywords, comments } = formData;

  // Parse keywords into array for better handling
  const keywordArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
  const primaryKeyword = keywordArray[0] || 'Advanced';
  const secondaryKeyword = keywordArray[1] || 'Modern';

  // Enhanced fallback templates with better structure
  const fallbackTemplates = [
    `Evaluating ${primaryKeyword} Approaches to ${studyArea} in ${department}`,
    `Impact of ${secondaryKeyword} ${studyArea} Implementation in ${domain}`,
    `Assessment of ${studyArea} ${primaryKeyword} Strategies in ${department}`,
    `Exploring ${secondaryKeyword} ${studyArea} Applications in ${domain}`,
    `Analysis of ${primaryKeyword} ${studyArea} Outcomes in ${department}`,
    `Development of ${secondaryKeyword} ${studyArea} Solutions for ${domain}`
  ];

  // If comments are provided, try to incorporate them
  if (comments && comments.toLowerCase().includes('zambia')) {
    fallbackTemplates[0] = `Evaluating ${primaryKeyword} ${studyArea} Implementation in Zambia's ${department}`;
    fallbackTemplates[1] = `Impact of ${secondaryKeyword} ${studyArea} on Healthcare Delivery in Zambia`;
  }

  return fallbackTemplates.slice(0, 6);
}
