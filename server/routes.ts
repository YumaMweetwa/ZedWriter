import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

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
  app.get('/api/submissions', async (req, res) => {
    try {
      const { userId } = req.query;
      const submissions = await storage.getSubmissionsByUser(userId as string);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  app.post('/api/submissions', async (req, res) => {
    try {
      const submission = await storage.createSubmission(req.body);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  });

  app.get('/api/submissions/:id', async (req, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  app.patch('/api/submissions/:id', async (req, res) => {
    try {
      const submission = await storage.updateSubmission(req.params.id, req.body);
      res.json(submission);
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({ error: 'Failed to update submission' });
    }
  });

  // Users routes
  app.get('/api/users/:id', async (req, res) => {
    try {
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

  app.get('/api/users/firebase/:uid', async (req, res) => {
    try {
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

  app.post('/api/users', async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.patch('/api/users/:id', async (req, res) => {
    try {
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

  app.post('/api/materials', async (req, res) => {
    try {
      const material = await storage.createMaterial(req.body);
      res.status(201).json(material);
    } catch (error) {
      console.error('Error creating material:', error);
      res.status(500).json({ error: 'Failed to create material' });
    }
  });

  // Chat routes
  app.get('/api/chat/rooms', async (req, res) => {
    try {
      const { userId } = req.query;
      const rooms = await storage.getChatRoomsByUser(userId as string);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
  });

  app.post('/api/chat/rooms', async (req, res) => {
    try {
      const room = await storage.createChatRoom(req.body);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ error: 'Failed to create chat room' });
    }
  });

  app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
    try {
      const messages = await storage.getMessagesByRoom(req.params.roomId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/rooms/:roomId/messages', async (req, res) => {
    try {
      const message = await storage.createMessage({
        ...req.body,
        roomId: req.params.roomId
      });
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
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

  app.post('/api/announcements', async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  // Referrals routes
  app.get('/api/referrals/:userId', async (req, res) => {
    try {
      const referrals = await storage.getReferralsByUser(req.params.userId);
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  });

  app.post('/api/referrals', async (req, res) => {
    try {
      const referral = await storage.createReferral(req.body);
      res.status(201).json(referral);
    } catch (error) {
      console.error('Error creating referral:', error);
      res.status(500).json({ error: 'Failed to create referral' });
    }
  });

  // Payments routes
  app.get('/api/payments/:userId', async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUser(req.params.userId);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.post('/api/payments', async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  // Topic generation route (mock implementation)
  app.post('/api/generate-topics', async (req, res) => {
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
  app.get('/api/admin/stats', async (req, res) => {
    try {
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
