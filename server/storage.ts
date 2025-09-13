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
  users,
  submissions,
  materials,
  chatRooms,
  messages,
  announcements,
  referrals,
  payments
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, count, sum } from "drizzle-orm";

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
  getPaymentByTransactionId(transactionId: string, submissionId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment>;

  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalRevenue: number;
    activeUsers: number;
  }>;
}

// Referenced from javascript_database blueprint integration
export class DatabaseStorage implements IStorage {
  constructor() {
    // No initialization needed for database storage
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.userId, userId)).orderBy(desc(submissions.createdAt));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db.insert(submissions).values(insertSubmission).returning();
    return submission;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
    const [submission] = await db.update(submissions).set(updates).where(eq(submissions.id, id)).returning();
    return submission;
  }

  // Material operations
  async getMaterials(filters: {
    program?: string;
    year?: string;
    type?: string;
    search?: string;
  }): Promise<Material[]> {
    let query = db.select().from(materials).where(eq(materials.isApproved, true));

    const conditions = [];
    if (filters.program) {
      conditions.push(eq(materials.program, filters.program));
    }
    if (filters.year) {
      conditions.push(eq(materials.year, filters.year));
    }
    if (filters.type) {
      conditions.push(eq(materials.type, filters.type));
    }
    if (filters.search) {
      conditions.push(like(materials.title, `%${filters.search}%`));
    }

    if (conditions.length > 0) {
      query = db.select().from(materials).where(and(eq(materials.isApproved, true), ...conditions));
    }

    return await query.orderBy(desc(materials.createdAt));
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(insertMaterial).returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    const [material] = await db.update(materials).set(updates).where(eq(materials.id, id)).returning();
    return material;
  }

  // Chat operations
  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    return await db.select().from(chatRooms).where(eq(chatRooms.userId, userId)).orderBy(desc(chatRooms.updatedAt));
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const [chatRoom] = await db.insert(chatRooms).values(insertChatRoom).returning();
    return chatRoom;
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.roomId, roomId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  // Announcement operations
  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(insertAnnouncement).returning();
    return announcement;
  }

  // Referral operations
  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt));
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(insertReferral).returning();
    return referral;
  }

  // Payment operations
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentByTransactionId(transactionId: string, submissionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(
      and(
        eq(payments.transactionId, transactionId),
        eq(payments.submissionId, submissionId)
      )
    );
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const [payment] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
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
    const [userCount] = await db.select({ count: count(users.id) }).from(users);
    const [submissionCount] = await db.select({ count: count(submissions.id) }).from(submissions);
    const [pendingCount] = await db.select({ count: count(submissions.id) }).from(submissions).where(eq(submissions.status, 'pending'));
    const [revenueSum] = await db.select({ sum: sum(submissions.paidAmount) }).from(submissions);
    const [activeUserCount] = await db.select({ count: count(users.id) }).from(users).where(eq(users.isActive, true));

    return {
      totalUsers: userCount.count || 0,
      totalSubmissions: submissionCount.count || 0,
      pendingSubmissions: pendingCount.count || 0,
      totalRevenue: Number(revenueSum.sum || 0),
      activeUsers: activeUserCount.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();