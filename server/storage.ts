import { 
  type User, 
  type InsertUser, 
  type Submission, 
  type InsertSubmission,
  type Material,
  type InsertMaterial,
  type ChatRoom,
  type InsertChatRoom,
  type Message,
  type InsertMessage,
  type Announcement,
  type InsertAnnouncement,
  type Referral,
  type InsertReferral,
  type Payment,
  type InsertPayment
} from "@shared/schema";
import { randomUUID } from "crypto";

// Enhanced storage interface with all required methods
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByUser(userId: string): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission>;

  // Material operations
  getMaterials(filters: {
    program?: string;
    year?: string;
    type?: string;
    search?: string;
  }): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material>;

  // Chat operations
  getChatRoomsByUser(userId: string): Promise<ChatRoom[]>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getMessagesByRoom(roomId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Announcement operations
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;

  // Referral operations
  getReferralsByUser(userId: string): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;

  // Payment operations
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalRevenue: number;
    activeUsers: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private submissions: Map<string, Submission>;
  private materials: Map<string, Material>;
  private chatRooms: Map<string, ChatRoom>;
  private messages: Map<string, Message>;
  private announcements: Map<string, Announcement>;
  private referrals: Map<string, Referral>;
  private payments: Map<string, Payment>;

  constructor() {
    this.users = new Map();
    this.submissions = new Map();
    this.materials = new Map();
    this.chatRooms = new Map();
    this.messages = new Map();
    this.announcements = new Map();
    this.referrals = new Map();
    this.payments = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample admin user
    const adminUser: User = {
      id: randomUUID(),
      firebaseUid: 'admin-firebase-uid',
      email: 'admin@zedwriter.zm',
      firstName: 'Admin',
      lastName: 'User',
      studentId: null,
      phone: null,
      school: null,
      role: 'admin',
      profilePicture: null,
      referralCode: 'ADMIN001',
      referralPoints: 0,
      totalPaid: 0,
      totalOwed: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample materials
    const sampleMaterials: Material[] = [
      {
        id: randomUUID(),
        title: 'Anatomy Study Notes - Cardiovascular System',
        description: 'Comprehensive notes covering heart anatomy and physiology',
        program: 'medicine',
        year: '211',
        type: 'study_notes',
        fileName: 'anatomy-cardiovascular.pdf',
        fileSize: 2400000,
        filePath: '/materials/anatomy-cardiovascular.pdf',
        uploadedBy: adminUser.id,
        isApproved: true,
        downloadCount: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomUUID(),
        title: 'Pharmacology Past Paper 2023',
        description: 'End of year examination with answer key',
        program: 'medicine',
        year: '311',
        type: 'past_papers_theory',
        fileName: 'pharmacology-2023.pdf',
        fileSize: 1800000,
        filePath: '/materials/pharmacology-2023.pdf',
        uploadedBy: adminUser.id,
        isApproved: true,
        downloadCount: 67,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleMaterials.forEach(material => {
      this.materials.set(material.id, material);
    });

    // Create sample announcements
    const sampleAnnouncements: Announcement[] = [
      {
        id: randomUUID(),
        title: 'New Year Promotion Extended!',
        content: 'Great news! We\'ve extended our dissertation discount until January 15th. Get your dissertation assistance for just K1000 instead of K1200.',
        type: 'promotion',
        isActive: true,
        createdBy: adminUser.id,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        title: 'New Materials Added to Library',
        content: 'We\'ve added new study materials for Medicine & Surgery programs, including Year 5 past papers and clinical case studies.',
        type: 'general',
        isActive: true,
        createdBy: adminUser.id,
        createdAt: new Date()
      }
    ];

    sampleAnnouncements.forEach(announcement => {
      this.announcements.set(announcement.id, announcement);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === username);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      referralPoints: 0,
      totalPaid: 0,
      totalOwed: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(submission => submission.userId === userId);
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values());
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = {
      ...insertSubmission,
      id,
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
    const submission = this.submissions.get(id);
    if (!submission) {
      throw new Error('Submission not found');
    }
    const updatedSubmission = { ...submission, ...updates, updatedAt: new Date() };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  // Material operations
  async getMaterials(filters: {
    program?: string;
    year?: string;
    type?: string;
    search?: string;
  }): Promise<Material[]> {
    let materials = Array.from(this.materials.values()).filter(material => material.isApproved);

    if (filters.program) {
      materials = materials.filter(material => material.program === filters.program);
    }
    if (filters.year) {
      materials = materials.filter(material => material.year === filters.year);
    }
    if (filters.type) {
      materials = materials.filter(material => material.type === filters.type);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      materials = materials.filter(material => 
        material.title.toLowerCase().includes(searchLower) ||
        (material.description && material.description.toLowerCase().includes(searchLower))
      );
    }

    return materials;
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const material: Material = {
      ...insertMaterial,
      id,
      isApproved: false,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.materials.set(id, material);
    return material;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    const material = this.materials.get(id);
    if (!material) {
      throw new Error('Material not found');
    }
    const updatedMaterial = { ...material, ...updates, updatedAt: new Date() };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  // Chat operations
  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values()).filter(room => room.userId === userId);
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const id = randomUUID();
    const room: ChatRoom = {
      ...insertRoom,
      id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatRooms.set(id, room);
    return room;
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  // Announcement operations
  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .filter(announcement => announcement.isActive)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const announcement: Announcement = {
      ...insertAnnouncement,
      id,
      isActive: true,
      createdAt: new Date()
    };
    this.announcements.set(id, announcement);
    return announcement;
  }

  // Referral operations
  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(referral => referral.referrerId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      ...insertReferral,
      id,
      createdAt: new Date()
    };
    this.referrals.set(id, referral);
    return referral;
  }

  // Payment operations
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      ...insertPayment,
      id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payments.set(id, payment);
    return payment;
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalRevenue: number;
    activeUsers: number;
  }> {
    const totalUsers = this.users.size;
    const totalSubmissions = this.submissions.size;
    const pendingSubmissions = Array.from(this.submissions.values())
      .filter(submission => submission.status === 'pending').length;
    const totalRevenue = Array.from(this.submissions.values())
      .filter(submission => submission.status === 'completed')
      .reduce((sum, submission) => sum + submission.amount, 0);
    const activeUsers = Array.from(this.users.values())
      .filter(user => user.isActive).length;

    return {
      totalUsers,
      totalSubmissions,
      pendingSubmissions,
      totalRevenue,
      activeUsers
    };
  }
}

export const storage = new MemStorage();
