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
  type InsertPayment,
  type PricingService,
  type InsertPricingService
} from "../shared/types";

/**
 * Storage interface for ZedWriter application
 * Defines the contract for all storage operations
 */
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByUser(userId: string): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission>;

  // Material operations
  getMaterial(id: string): Promise<Material | undefined>;
  getMaterials(filters: {
    program?: string;
    year?: string;
    type?: string;
    search?: string;
  }): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;

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
  getPaymentByTransactionId(transactionId: string, submissionId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment>;

  // Pricing operations
  getAllPricingServices(): Promise<PricingService[]>;
  createPricingService(service: InsertPricingService): Promise<PricingService>;
  updatePricingService(id: string, updates: Partial<PricingService>): Promise<PricingService>;
  deletePricingService(id: string): Promise<void>;

  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalRevenue: number;
    activeUsers: number;
  }>;
}