import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticateToken, optionalAuth } from "./middleware/auth";
import { upload, validateFileUpload } from "./middleware/upload";
import { insertSubmissionSchema } from "@shared/schema";
import "./firebase-admin"; // Initialize Firebase Admin

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info) => {
      // Add authentication verification here if needed
      return true;
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join_room':
            // Handle joining a chat room
            console.log(`User joined room: ${data.roomId}`);
            break;
            
          case 'send_message':
            // Handle sending a message
            console.log(`Message sent to room ${data.roomId}: ${data.content}`);
            // Broadcast to other clients in the same room
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  roomId: data.roomId,
                  message: data.content,
                  senderId: data.senderId,
                  timestamp: new Date().toISOString()
                }));
              }
            });
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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
      const validationResult = insertSubmissionSchema.safeParse({
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
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.get('/api/users/firebase/:uid', authenticateToken, async (req, res) => {
    try {
      // Verify the authenticated user can only access their own data by Firebase UID
      if (req.user!.uid !== req.params.uid) {
        return res.status(403).json({ error: 'Access denied: You can only access your own user data' });
      }
      
      const user = await storage.getUserByFirebaseUid(req.params.uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user by Firebase UID:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', authenticateToken, async (req, res) => {
    try {
      // Ensure the Firebase UID in request body matches the authenticated user
      if (req.body.firebaseUid && req.body.firebaseUid !== req.user!.uid) {
        return res.status(403).json({ error: 'Access denied: Cannot create user with different Firebase UID' });
      }
      
      // Set the Firebase UID from the authenticated token to prevent spoofing
      const userData = { ...req.body, firebaseUid: req.user!.uid };
      const user = await storage.createUser(userData);
      res.status(201).json(user);
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
      res.json(user);
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
      res.status(500).json({ error: 'Failed to fetch announcements' });
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

  // Topic generation route (mock implementation)
  app.post('/api/generate-topics', authenticateToken, async (req, res) => {
    try {
      const { domain, subdomain, keywords, studyArea, requirements } = req.body;
      
      // Mock topic generation - in production this would call an AI service
      const mockTopics = [
        {
          id: '1',
          title: `The Impact of ${keywords[0] || 'Technology'} on ${domain || 'Health'} in Zambia`,
          description: `This research investigates the role of ${keywords[0] || 'technology'} in improving ${domain || 'health'} outcomes, focusing on ${studyArea || 'rural communities'}.`,
          keywords: keywords || ['Technology', domain, 'Zambia'],
          difficulty: 'Moderate',
          duration: '3-4 months'
        },
        {
          id: '2',
          title: `Evaluating ${subdomain || 'Digital Solutions'} for ${domain || 'Healthcare'} Delivery`,
          description: `An analysis of how ${subdomain || 'digital solutions'} can enhance service delivery in the ${domain || 'healthcare'} sector.`,
          keywords: keywords || [subdomain, domain, 'Innovation'],
          difficulty: 'Intermediate',
          duration: '4-5 months'
        }
      ];

      res.json({ topics: mockTopics });
    } catch (error) {
      console.error('Error generating topics:', error);
      res.status(500).json({ error: 'Failed to generate topics' });
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

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  return httpServer;
}
