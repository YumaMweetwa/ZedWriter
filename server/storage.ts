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
} from "@shared/types";
import admin from "./firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';

// Enhanced storage interface with all required methods
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
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

// Firestore-based storage implementation
export class FirestoreStorage implements IStorage {
  private db: admin.firestore.Firestore;

  constructor() {
    // Get database ID from environment or use default
    const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
    
    console.log(`Initializing Firestore with database ID: ${databaseId}`);
    
    // Initialize Firestore with explicit database targeting
    this.db = getFirestore(admin.app(), databaseId);
    
    // Configure Firestore settings to work in Replit environment
    this.db.settings({ 
      ignoreUndefinedProperties: true,
      ssl: true,
    });
    
    console.log('Firestore connection initialized with explicit database targeting');
  }

  private generateId(): string {
    return this.db.collection('_').doc().id;
  }

  private addTimestamps(data: any): any {
    const now = admin.firestore.Timestamp.now();
    return {
      ...data,
      createdAt: now,
      updatedAt: now
    };
  }

  private updateTimestamp(data: any): any {
    return {
      ...data,
      updatedAt: admin.firestore.Timestamp.now()
    };
  }

  // Convert Firestore document to proper types with date conversion
  private convertFirestoreDoc<T>(doc: any): T {
    const data = doc.data();
    const converted = { id: doc.id, ...data };
    
    // Convert Firestore Timestamps to ISO strings for API compatibility
    if (converted.createdAt && converted.createdAt.toDate) {
      converted.createdAt = converted.createdAt.toDate().toISOString();
    }
    if (converted.updatedAt && converted.updatedAt.toDate) {
      converted.updatedAt = converted.updatedAt.toDate().toISOString();
    }
    
    return converted as T;
  }

  // Convert array of Firestore documents
  private convertFirestoreDocs<T>(docs: any[]): T[] {
    return docs.map(doc => this.convertFirestoreDoc<T>(doc));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userDoc = await this.db.collection('users').doc(id).get();
      if (!userDoc.exists) return undefined;
      return this.convertFirestoreDoc<User>(userDoc);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // First try by email (for backward compatibility)
      let usersQuery = await this.db.collection('users').where('email', '==', username).limit(1).get();
      if (!usersQuery.empty) {
        return this.convertFirestoreDoc<User>(usersQuery.docs[0]);
      }
      
      // Then try by actual username field if it exists
      usersQuery = await this.db.collection('users').where('username', '==', username).limit(1).get();
      if (!usersQuery.empty) {
        return this.convertFirestoreDoc<User>(usersQuery.docs[0]);
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const usersQuery = await this.db.collection('users').where('firebaseUid', '==', firebaseUid).limit(1).get();
      if (usersQuery.empty) return undefined;
      return this.convertFirestoreDoc<User>(usersQuery.docs[0]);
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersQuery = await this.db.collection('users').orderBy('createdAt', 'desc').get();
      return this.convertFirestoreDocs<User>(usersQuery.docs);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const userWithTimestamps = this.addTimestamps(insertUser);
      const userRef = await this.db.collection('users').add(userWithTimestamps);
      const newDoc = await userRef.get();
      return this.convertFirestoreDoc<User>(newDoc);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updatesWithTimestamp = this.updateTimestamp(updates);
      await this.db.collection('users').doc(id).update(updatesWithTimestamp);
      const updatedDoc = await this.db.collection('users').doc(id).get();
      return this.convertFirestoreDoc<User>(updatedDoc);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    try {
      const submissionDoc = await this.db.collection('submissions').doc(id).get();
      if (!submissionDoc.exists) return undefined;
      return this.convertFirestoreDoc<Submission>(submissionDoc);
    } catch (error) {
      console.error('Error getting submission:', error);
      return undefined;
    }
  }

  async getSubmissionsByUser(userId: string): Promise<Submission[]> {
    try {
      const submissionsQuery = await this.db.collection('submissions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return this.convertFirestoreDocs<Submission>(submissionsQuery.docs);
    } catch (error) {
      console.error('Error getting submissions by user:', error);
      return [];
    }
  }

  async getAllSubmissions(): Promise<Submission[]> {
    try {
      const submissionsQuery = await this.db.collection('submissions')
        .orderBy('createdAt', 'desc')
        .get();
      return this.convertFirestoreDocs<Submission>(submissionsQuery.docs);
    } catch (error) {
      console.error('Error getting all submissions:', error);
      return [];
    }
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    try {
      const submissionWithTimestamps = this.addTimestamps(insertSubmission);
      const submissionRef = await this.db.collection('submissions').add(submissionWithTimestamps);
      const newDoc = await submissionRef.get();
      return this.convertFirestoreDoc<Submission>(newDoc);
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
    try {
      const updatesWithTimestamp = this.updateTimestamp(updates);
      await this.db.collection('submissions').doc(id).update(updatesWithTimestamp);
      const updatedDoc = await this.db.collection('submissions').doc(id).get();
      return this.convertFirestoreDoc<Submission>(updatedDoc);
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  }

  // Material operations
  async getMaterial(id: string): Promise<Material | undefined> {
    try {
      const materialDoc = await this.db.collection('materials').doc(id).get();
      if (!materialDoc.exists) return undefined;
      return this.convertFirestoreDoc<Material>(materialDoc);
    } catch (error) {
      console.error('Error getting material:', error);
      return undefined;
    }
  }

  async getMaterials(filters: {
    program?: string;
    year?: string;
    type?: string;
    search?: string;
  }): Promise<Material[]> {
    try {
      let materialsQuery = this.db.collection('materials').where('isApproved', '==', true);

      // Apply filters - Firestore requires separate where clauses
      if (filters.program) {
        materialsQuery = materialsQuery.where('program', '==', filters.program);
      }
      if (filters.year) {
        materialsQuery = materialsQuery.where('year', '==', filters.year);
      }
      if (filters.type) {
        materialsQuery = materialsQuery.where('type', '==', filters.type);
      }

      materialsQuery = materialsQuery.orderBy('createdAt', 'desc');
      const materialsSnapshot = await materialsQuery.get();
      let materials = this.convertFirestoreDocs<Material>(materialsSnapshot.docs);

      // Apply search filter in memory (Firestore doesn't support LIKE queries)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        materials = materials.filter(material => 
          material.title?.toLowerCase().includes(searchTerm) || 
          material.description?.toLowerCase().includes(searchTerm)
        );
      }

      return materials;
    } catch (error) {
      console.error('Error getting materials:', error);
      return [];
    }
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    try {
      const materialWithTimestamps = this.addTimestamps(insertMaterial);
      const materialRef = await this.db.collection('materials').add(materialWithTimestamps);
      const newDoc = await materialRef.get();
      return this.convertFirestoreDoc<Material>(newDoc);
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    try {
      const updatesWithTimestamp = this.updateTimestamp(updates);
      await this.db.collection('materials').doc(id).update(updatesWithTimestamp);
      const updatedDoc = await this.db.collection('materials').doc(id).get();
      return this.convertFirestoreDoc<Material>(updatedDoc);
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  async deleteMaterial(id: string): Promise<void> {
    try {
      await this.db.collection('materials').doc(id).delete();
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // Chat operations
  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    try {
      const roomsQuery = await this.db.collection('chatRooms')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get();
      return this.convertFirestoreDocs<ChatRoom>(roomsQuery.docs);
    } catch (error) {
      console.error('Error getting chat rooms by user:', error);
      return [];
    }
  }

  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    try {
      const roomWithTimestamps = this.addTimestamps(insertChatRoom);
      const roomRef = await this.db.collection('chatRooms').add(roomWithTimestamps);
      const newDoc = await roomRef.get();
      return this.convertFirestoreDoc<ChatRoom>(newDoc);
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    try {
      const messagesQuery = await this.db.collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('createdAt', 'asc')
        .get();
      return this.convertFirestoreDocs<Message>(messagesQuery.docs);
    } catch (error) {
      console.error('Error getting messages by room:', error);
      return [];
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      const messageWithTimestamps = this.addTimestamps(insertMessage);
      const messageRef = await this.db.collection('messages').add(messageWithTimestamps);
      const newDoc = await messageRef.get();
      return this.convertFirestoreDoc<Message>(newDoc);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Announcement operations
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const announcementsQuery = await this.db.collection('announcements')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      return this.convertFirestoreDocs<Announcement>(announcementsQuery.docs);
    } catch (error) {
      console.error('Error getting announcements:', error);
      return [];
    }
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    try {
      const announcementWithTimestamps = this.addTimestamps(insertAnnouncement);
      const announcementRef = await this.db.collection('announcements').add(announcementWithTimestamps);
      const newDoc = await announcementRef.get();
      return this.convertFirestoreDoc<Announcement>(newDoc);
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  // Referral operations
  async getReferralsByUser(userId: string): Promise<Referral[]> {
    try {
      const referralsQuery = await this.db.collection('referrals')
        .where('referrerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return this.convertFirestoreDocs<Referral>(referralsQuery.docs);
    } catch (error) {
      console.error('Error getting referrals by user:', error);
      return [];
    }
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    try {
      const referralWithTimestamps = this.addTimestamps(insertReferral);
      const referralRef = await this.db.collection('referrals').add(referralWithTimestamps);
      const newDoc = await referralRef.get();
      return this.convertFirestoreDoc<Referral>(newDoc);
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  // Payment operations
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    try {
      const paymentsQuery = await this.db.collection('payments')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return this.convertFirestoreDocs<Payment>(paymentsQuery.docs);
    } catch (error) {
      console.error('Error getting payments by user:', error);
      return [];
    }
  }

  async getPaymentByTransactionId(transactionId: string, submissionId: string): Promise<Payment | undefined> {
    try {
      const paymentsQuery = await this.db.collection('payments')
        .where('transactionId', '==', transactionId)
        .where('submissionId', '==', submissionId)
        .limit(1)
        .get();
      if (paymentsQuery.empty) return undefined;
      const paymentDoc = paymentsQuery.docs[0];
      return this.convertFirestoreDoc<Payment>(paymentDoc);
    } catch (error) {
      console.error('Error getting payment by transaction ID:', error);
      return undefined;
    }
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      const paymentWithTimestamps = this.addTimestamps(insertPayment);
      const paymentRef = await this.db.collection('payments').add(paymentWithTimestamps);
      const newDoc = await paymentRef.get();
      return this.convertFirestoreDoc<Payment>(newDoc);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    try {
      const updatesWithTimestamp = this.updateTimestamp(updates);
      await this.db.collection('payments').doc(id).update(updatesWithTimestamp);
      const updatedDoc = await this.db.collection('payments').doc(id).get();
      return this.convertFirestoreDoc<Payment>(updatedDoc);
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  // Pricing operations
  async getAllPricingServices(): Promise<PricingService[]> {
    try {
      const pricingQuery = await this.db.collection('pricingServices')
        .orderBy('orderIndex', 'asc')
        .get();
      return this.convertFirestoreDocs<PricingService>(pricingQuery.docs);
    } catch (error) {
      console.error('Error getting pricing services:', error);
      return [];
    }
  }

  async createPricingService(service: InsertPricingService): Promise<PricingService> {
    try {
      const serviceWithTimestamps = this.addTimestamps(service);
      const serviceRef = await this.db.collection('pricingServices').add(serviceWithTimestamps);
      const newDoc = await serviceRef.get();
      return this.convertFirestoreDoc<PricingService>(newDoc);
    } catch (error) {
      console.error('Error creating pricing service:', error);
      throw error;
    }
  }

  async updatePricingService(id: string, updates: Partial<PricingService>): Promise<PricingService> {
    try {
      const updatesWithTimestamp = this.updateTimestamp(updates);
      await this.db.collection('pricingServices').doc(id).update(updatesWithTimestamp);
      const updatedDoc = await this.db.collection('pricingServices').doc(id).get();
      return this.convertFirestoreDoc<PricingService>(updatedDoc);
    } catch (error) {
      console.error('Error updating pricing service:', error);
      throw error;
    }
  }

  async deletePricingService(id: string): Promise<void> {
    try {
      await this.db.collection('pricingServices').doc(id).delete();
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
      // Get all collections data in parallel for performance
      const [usersSnapshot, submissionsSnapshot, activeUsersSnapshot, paymentsSnapshot] = await Promise.all([
        this.db.collection('users').get(),
        this.db.collection('submissions').get(),
        this.db.collection('users').where('isActive', '==', true).get(),
        this.db.collection('payments').get()
      ]);

      // Calculate stats from the data
      const totalUsers = usersSnapshot.size;
      const totalSubmissions = submissionsSnapshot.size;
      const activeUsers = activeUsersSnapshot.size;

      // Calculate pending submissions from submissions collection
      let pendingSubmissions = 0;
      submissionsSnapshot.docs.forEach(doc => {
        const submission = doc.data() as Submission;
        if (submission.status === 'pending') {
          pendingSubmissions++;
        }
      });

      // Calculate total revenue from payments collection
      let totalRevenue = 0;
      paymentsSnapshot.docs.forEach(doc => {
        const payment = doc.data() as Payment;
        if (payment.amount && payment.status === 'completed') {
          totalRevenue += Number(payment.amount);
        }
      });

      return {
        totalUsers,
        totalSubmissions,
        pendingSubmissions,
        totalRevenue,
        activeUsers,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalUsers: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        totalRevenue: 0,
        activeUsers: 0,
      };
    }
  }
}

export const storage = new FirestoreStorage();