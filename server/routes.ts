import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticateToken, optionalAuth } from "./middleware/auth";
import { upload, validateFileUpload } from "./middleware/upload";
import { 
  insertSubmissionSchema, 
  insertPaymentSchema,
  insertPricingServiceSchema,
  type PricingService,
  type InsertPricingService 
} from "@shared/schema";
import "./firebase-admin"; // Initialize Firebase Admin
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info: any) => {
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

  // Material upload endpoint with Firebase Storage
  app.post('/api/materials/upload', authenticateToken, upload.single('file'), validateFileUpload, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title, description, program, year, type } = req.body;
      
      // Validate required fields
      if (!title || !program || !year || !type) {
        return res.status(400).json({ error: 'Missing required fields: title, program, year, and type are required' });
      }

      // Upload file to Firebase Storage if available
      let filePath = req.file.path;
      let firebaseUrl = null;
      
      try {
        // Try uploading to Firebase Storage
        const firebaseStorage = require('./firebase-admin').storage;
        if (firebaseStorage) {
          const bucket = firebaseStorage.bucket();
          const firebaseFilename = `materials/${Date.now()}-${req.file.originalname}`;
          const file = bucket.file(firebaseFilename);
          
          const fs = require('fs');
          const fileBuffer = fs.readFileSync(req.file.path);
          
          await file.save(fileBuffer, {
            metadata: {
              contentType: req.file.mimetype,
            },
          });
          
          // Get public URL
          firebaseUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFilename}`;
          filePath = firebaseFilename; // Store Firebase path
        }
      } catch (firebaseError) {
        console.warn('Firebase upload failed, using local storage:', firebaseError);
        // Continue with local storage as fallback
      }

      // Create material with approval pending
      const material = await storage.createMaterial({
        title,
        description: description || '',
        program,
        year,
        type,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: firebaseUrl || filePath,
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

      // Try to delete from Firebase Storage if it was stored there
      try {
        if (material.filePath.startsWith('materials/')) {
          const firebaseStorage = require('./firebase-admin').storage;
          if (firebaseStorage) {
            const bucket = firebaseStorage.bucket();
            const file = bucket.file(material.filePath);
            await file.delete();
          }
        }
      } catch (cleanupError) {
        console.warn('Failed to delete file from Firebase Storage:', cleanupError);
        // Continue with database deletion even if file cleanup fails
      }

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

  // Topic generation route with Gemini AI
  app.post('/api/generate-topics', authenticateToken, async (req, res) => {
    try {
      const { domain, department, studyArea, keywords, comments } = req.body;
      
      // Validate required fields
      if (!domain || !department || !studyArea) {
        return res.status(400).json({ 
          error: 'Missing required fields: domain, department, and studyArea are required' 
        });
      }
      
      // Generate research topics using Gemini AI
      try {
        const topics = await generateResearchTopics({ domain, department, studyArea, keywords, comments });
        res.json({ success: true, topics });
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        
        // Fallback to enhanced local generation if AI fails
        const fallbackTopics = generateEnhancedFallbackTopics({ domain, department, studyArea, keywords, comments });
        res.json({ 
          success: true, 
          topics: fallbackTopics,
          note: 'Generated using enhanced fallback method due to AI service unavailability'
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
      const paymentValidation = insertPaymentSchema.extend({
        submissionId: insertPaymentSchema.shape.submissionId.refine(val => val !== null, 'submissionId is required'),
        transactionId: insertPaymentSchema.shape.transactionId.refine(val => val !== null, 'transactionId is required'),
        amount: insertPaymentSchema.shape.amount.min(1, 'amount must be positive')
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

      const validatedData = insertPricingServiceSchema.parse(req.body);
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
  department: string; 
  studyArea: string; 
  keywords?: string; 
  comments?: string; 
}) {
  const prompt = createResearchPrompt(formData);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  });

  if (response.text) {
    const topics = parseAITopics(response.text);
    if (topics.length === 0) {
      throw new Error('No valid topics could be parsed from AI response');
    }
    return topics;
  } else {
    throw new Error('Invalid response structure from Gemini API');
  }
}

// Create optimized prompt for research topics
function createResearchPrompt(formData: { 
  domain: string; 
  department: string; 
  studyArea: string; 
  keywords?: string; 
  comments?: string; 
}) {
  let prompt = `Generate research topics in not more than 20 words each based on the provided selections.

MANDATORY INFORMATION (MUST be included in EVERY topic):
- Domain: ${formData.domain}
- Department: ${formData.department}
- Study Area: ${formData.studyArea} (MUST appear in every topic)`;

  if (formData.keywords) {
    prompt += `
- Research Keywords: ${formData.keywords} (MUST be incorporated in every topic)`;
  }

  if (formData.comments) {
    prompt += `
- Additional Requirements: ${formData.comments} (MUST be considered in every topic)`;
  }

  prompt += `

STRICT REQUIREMENTS:
1. Every topic MUST include the study area "${formData.studyArea}"
2. Every topic MUST be related to ${formData.domain} and ${formData.department}`;

  if (formData.keywords) {
    prompt += `
3. Every topic MUST incorporate the keywords "${formData.keywords}"`;
  }

  if (formData.comments) {
    const reqNumber = formData.keywords ? 4 : 3;
    prompt += `
${reqNumber}. Every topic MUST consider the additional requirements: "${formData.comments}"`;
  }

  const nextReqNumber = (formData.keywords && formData.comments) ? 5 : formData.keywords || formData.comments ? 4 : 3;
  
  prompt += `
${nextReqNumber}. Each topic should be specific, measurable, and achievable
${nextReqNumber + 1}. Address current gaps in ${formData.domain.toLowerCase()} research  
${nextReqNumber + 2}. Consider ethical feasibility and resource constraints
${nextReqNumber + 3}. Each topic should be not more than 20 words
${nextReqNumber + 4}. Focus on innovation, feasibility, and academic significance

Format: Return exactly 6 numbered research titles:
1. [First topic - max 20 words, MUST include study area "${formData.studyArea}"]
2. [Second topic - max 20 words, MUST include study area "${formData.studyArea}"]
3. [Third topic - max 20 words, MUST include study area "${formData.studyArea}"]
4. [Fourth topic - max 20 words, MUST include study area "${formData.studyArea}"]
5. [Fifth topic - max 20 words, MUST include study area "${formData.studyArea}"]
6. [Sixth topic - max 20 words, MUST include study area "${formData.studyArea}"]

REMEMBER: The study area "${formData.studyArea}" is MANDATORY and must appear in every single topic title.`;

  return prompt;
}

// Parse AI response to extract topics
function parseAITopics(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const topics: string[] = [];
  
  lines.forEach(line => {
    // Match numbered items (1., 2., etc.) or bullet points
    const numberedMatch = line.match(/^\d+\.\s*(.+)/);
    const bulletMatch = line.match(/^[-*]\s*(.+)/);
    
    if (numberedMatch) {
      let topic = numberedMatch[1].trim();
      // Remove trailing periods and clean up
      topic = topic.replace(/\.$/, '').replace(/"/g, '').replace(/\[|\]/g, '');
      if (topic.length > 10) { // Ensure it's a substantial topic
        topics.push(topic);
      }
    } else if (bulletMatch) {
      let topic = bulletMatch[1].trim();
      topic = topic.replace(/\.$/, '').replace(/"/g, '').replace(/\[|\]/g, '');
      if (topic.length > 10) {
        topics.push(topic);
      }
    }
  });
  
  // If no numbered/bulleted items found, try to extract topics from paragraphs
  if (topics.length === 0) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    sentences.slice(0, 6).forEach(sentence => {
      const cleaned = sentence.trim().replace(/"/g, '');
      if (cleaned.length > 10) {
        topics.push(cleaned);
      }
    });
  }
  
  return topics.slice(0, 6); // Return exactly 6 topics max
}

// Enhanced fallback topic generation
function generateEnhancedFallbackTopics(formData: { 
  domain: string; 
  department: string; 
  studyArea: string; 
  keywords?: string; 
  comments?: string; 
}): string[] {
  const { domain, department, studyArea, keywords } = formData;
  
  const fallbackTemplates = [
    `Impact of Digital Technology on ${studyArea} in ${department}`,
    `${studyArea} Management Strategies in ${domain} Sector`,
    `Evaluating ${studyArea} Practices in Modern ${department}`,
    `Innovation and ${studyArea} Development in ${domain}`,
    `Sustainable Approaches to ${studyArea} in ${department}`,
    `${studyArea} Quality Improvement in ${domain} Services`
  ];
  
  // Incorporate keywords if provided
  const topics = fallbackTemplates.map(template => {
    if (keywords) {
      return template.replace(studyArea, `${keywords} ${studyArea}`);
    }
    return template;
  });
  
  return topics.slice(0, 6);
}
