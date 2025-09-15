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
import { db, testConnection } from "./db";
import { schema } from "./db";
import { eq, desc, like, and, or, count, sum } from 'drizzle-orm';
import { IStorage } from "./storage";

// Supabase-based storage implementation using Drizzle ORM
export class SupabaseStorage implements IStorage {
  constructor() {
    console.log('Initializing Supabase storage with Drizzle ORM');
    // Test the connection on initialization
    testConnection().catch(error => {
      console.error('Initial connection test failed:', error);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return users[0] ? this.convertDates(users[0]) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, username));
      return users[0] ? this.convertDates(users[0]) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
      return users.map(user => this.convertDates(user));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const newUsers = await db.insert(schema.users).values(user).returning();
      return this.convertDates(newUsers[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      // Filter out readonly fields and convert dates if needed
      const { id: _, createdAt, updatedAt, ...updateData } = updates;
      
      const updatedUsers = await db.update(schema.users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();
      
      if (!updatedUsers[0]) {
        throw new Error('User not found');
      }
      
      return this.convertDates(updatedUsers[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    try {
      const submissions = await db.select().from(schema.submissions).where(eq(schema.submissions.id, id));
      return submissions[0] ? this.convertDates(submissions[0]) : undefined;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    try {
      const submissions = await db.select().from(schema.submissions)
        .where(eq(schema.submissions.userId, userId))
        .orderBy(desc(schema.submissions.createdAt));
      return submissions.map(submission => this.convertDates(submission));
    } catch (error) {
      console.error('Error getting submissions by user:', error);
      throw error;
    }
  }

  async getAllSubmissions(): Promise<Submission[]> {
    try {
      const submissions = await db.select().from(schema.submissions)
        .orderBy(desc(schema.submissions.createdAt));
      return submissions.map(submission => this.convertDates(submission));
    } catch (error) {
      console.error('Error getting all submissions:', error);
      throw error;
    }
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    try {
      const newSubmissions = await db.insert(schema.submissions).values(submission).returning();
      return this.convertDates(newSubmissions[0]);
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
    try {
      // Filter out readonly fields and convert dates if needed
      const { id: _, createdAt, updatedAt, ...updateData } = updates;
      
      const updatedSubmissions = await db.update(schema.submissions)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.submissions.id, id))
        .returning();
      
      if (!updatedSubmissions[0]) {
        throw new Error('Submission not found');
      }
      
      return this.convertDates(updatedSubmissions[0]);
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  }

  // Material operations
  async getMaterial(id: string): Promise<Material | undefined> {
    try {
      const materials = await db.select().from(schema.materials).where(eq(schema.materials.id, id));
      return materials[0] ? this.convertDates(materials[0]) : undefined;
    } catch (error) {
      console.error('Error getting material:', error);
      throw error;
    }
  }

  async getMaterials(filters: {
    program?: string;
    year?: string;
    type?: string;
    search?: string;
  }): Promise<Material[]> {
    try {
      const conditions = [];

      if (filters.program) {
        conditions.push(eq(schema.materials.program, filters.program));
      }
      if (filters.year) {
        conditions.push(eq(schema.materials.year, filters.year));
      }
      if (filters.type) {
        conditions.push(eq(schema.materials.type, filters.type));
      }
      if (filters.search) {
        conditions.push(
          or(
            like(schema.materials.title, `%${filters.search}%`),
            like(schema.materials.description, `%${filters.search}%`)
          )
        );
      }

      let materials;
      
      if (conditions.length > 0) {
        materials = await db.select().from(schema.materials)
          .where(and(...conditions))
          .orderBy(desc(schema.materials.createdAt));
      } else {
        materials = await db.select().from(schema.materials)
          .orderBy(desc(schema.materials.createdAt));
      }
      return materials.map(material => this.convertDates(material));
    } catch (error) {
      console.error('Error getting materials:', error);
      throw error;
    }
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    try {
      const newMaterials = await db.insert(schema.materials).values(material).returning();
      return this.convertDates(newMaterials[0]);
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    try {
      // Filter out readonly fields and convert dates if needed
      const { id: _, createdAt, updatedAt, ...updateData } = updates;
      
      const updatedMaterials = await db.update(schema.materials)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.materials.id, id))
        .returning();
      
      if (!updatedMaterials[0]) {
        throw new Error('Material not found');
      }
      
      return this.convertDates(updatedMaterials[0]);
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  async deleteMaterial(id: string): Promise<void> {
    try {
      await db.delete(schema.materials).where(eq(schema.materials.id, id));
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // Chat operations
  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    try {
      const chatRooms = await db.select().from(schema.chatRooms)
        .where(eq(schema.chatRooms.userId, userId))
        .orderBy(desc(schema.chatRooms.updatedAt));
      return chatRooms.map(room => this.convertDates(room));
    } catch (error) {
      console.error('Error getting chat rooms by user:', error);
      throw error;
    }
  }

  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    try {
      const newRooms = await db.insert(schema.chatRooms).values(room).returning();
      return this.convertDates(newRooms[0]);
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    try {
      const messages = await db.select().from(schema.messages)
        .where(eq(schema.messages.roomId, roomId))
        .orderBy(desc(schema.messages.createdAt));
      return messages.map(message => this.convertDates(message));
    } catch (error) {
      console.error('Error getting messages by room:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const newMessages = await db.insert(schema.messages).values(message).returning();
      return this.convertDates(newMessages[0]);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Announcement operations
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const announcements = await db.select().from(schema.announcements)
        .where(eq(schema.announcements.isActive, true))
        .orderBy(desc(schema.announcements.createdAt));
      return announcements.map(announcement => this.convertDates(announcement));
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    try {
      const newAnnouncements = await db.insert(schema.announcements).values(announcement).returning();
      return this.convertDates(newAnnouncements[0]);
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  // Referral operations
  async getReferralsByUser(userId: string): Promise<Referral[]> {
    try {
      const referrals = await db.select().from(schema.referrals)
        .where(eq(schema.referrals.referrerId, userId))
        .orderBy(desc(schema.referrals.createdAt));
      return referrals.map(referral => this.convertDates(referral));
    } catch (error) {
      console.error('Error getting referrals by user:', error);
      throw error;
    }
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    try {
      const newReferrals = await db.insert(schema.referrals).values(referral).returning();
      return this.convertDates(newReferrals[0]);
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  // Payment operations
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    try {
      const payments = await db.select().from(schema.payments)
        .where(eq(schema.payments.userId, userId))
        .orderBy(desc(schema.payments.createdAt));
      return payments.map(payment => this.convertDates(payment));
    } catch (error) {
      console.error('Error getting payments by user:', error);
      throw error;
    }
  }

  async getPaymentByTransactionId(transactionId: string, submissionId: string): Promise<Payment | undefined> {
    try {
      const payments = await db.select().from(schema.payments)
        .where(
          and(
            eq(schema.payments.transactionId, transactionId),
            eq(schema.payments.submissionId, submissionId)
          )
        );
      return payments[0] ? this.convertDates(payments[0]) : undefined;
    } catch (error) {
      console.error('Error getting payment by transaction ID:', error);
      throw error;
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const newPayments = await db.insert(schema.payments).values(payment).returning();
      return this.convertDates(newPayments[0]);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    try {
      // Filter out readonly fields and convert dates if needed
      const { id: _, createdAt, updatedAt, ...updateData } = updates;
      
      const updatedPayments = await db.update(schema.payments)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.payments.id, id))
        .returning();
      
      if (!updatedPayments[0]) {
        throw new Error('Payment not found');
      }
      
      return this.convertDates(updatedPayments[0]);
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  // Pricing operations
  async getAllPricingServices(): Promise<PricingService[]> {
    try {
      const services = await db.select().from(schema.pricingServices)
        .where(eq(schema.pricingServices.isActive, true))
        .orderBy(schema.pricingServices.orderIndex);
      return services.map(service => this.convertDates(service));
    } catch (error) {
      console.error('Error getting pricing services:', error);
      throw error;
    }
  }

  async createPricingService(service: InsertPricingService): Promise<PricingService> {
    try {
      const newServices = await db.insert(schema.pricingServices).values(service).returning();
      return this.convertDates(newServices[0]);
    } catch (error) {
      console.error('Error creating pricing service:', error);
      throw error;
    }
  }

  async updatePricingService(id: string, updates: Partial<PricingService>): Promise<PricingService> {
    try {
      // Filter out readonly fields and convert dates if needed
      const { id: _, createdAt, updatedAt, ...updateData } = updates;
      
      const updatedServices = await db.update(schema.pricingServices)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.pricingServices.id, id))
        .returning();
      
      if (!updatedServices[0]) {
        throw new Error('Pricing service not found');
      }
      
      return this.convertDates(updatedServices[0]);
    } catch (error) {
      console.error('Error updating pricing service:', error);
      throw error;
    }
  }

  async deletePricingService(id: string): Promise<void> {
    try {
      await db.delete(schema.pricingServices).where(eq(schema.pricingServices.id, id));
    } catch (error) {
      console.error('Error deleting pricing service:', error);
      throw error;
    }
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalRevenue: number;
    activeUsers: number;
  }> {
    try {
      const [totalUsersResult] = await db.select({ count: count() }).from(schema.users);
      const [totalSubmissionsResult] = await db.select({ count: count() }).from(schema.submissions);
      const [pendingSubmissionsResult] = await db.select({ count: count() })
        .from(schema.submissions)
        .where(eq(schema.submissions.status, 'pending'));
      const [totalRevenueResult] = await db.select({ sum: sum(schema.payments.amount) })
        .from(schema.payments)
        .where(eq(schema.payments.status, 'completed'));
      const [activeUsersResult] = await db.select({ count: count() })
        .from(schema.users)
        .where(eq(schema.users.isActive, true));

      return {
        totalUsers: Number(totalUsersResult.count),
        totalSubmissions: Number(totalSubmissionsResult.count),
        pendingSubmissions: Number(pendingSubmissionsResult.count),
        totalRevenue: Number(totalRevenueResult.sum || 0),
        activeUsers: Number(activeUsersResult.count),
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }

  // Helper method to convert timestamp objects to ISO strings for compatibility
  private convertDates(obj: any): any {
    if (!obj) return obj;
    
    const converted = { ...obj };
    
    if (converted.createdAt && typeof converted.createdAt === 'object') {
      converted.createdAt = converted.createdAt.toISOString();
    }
    if (converted.updatedAt && typeof converted.updatedAt === 'object') {
      converted.updatedAt = converted.updatedAt.toISOString();
    }
    
    return converted;
  }
}