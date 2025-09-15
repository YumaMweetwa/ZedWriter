// Shared types for ZedWriter application
// These types define the shape of data used throughout the app

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  phone?: string;
  school?: string;
  role?: string;
  profilePicture?: string;
  referralCode?: string;
  referralPoints?: number;
  totalPaid?: number;
  totalOwed?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertUser {
  email: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  phone?: string;
  school?: string;
  role?: string;
  profilePicture?: string;
  referralCode?: string;
  referralPoints?: number;
  totalPaid?: number;
  totalOwed?: number;
  isActive?: boolean;
}

export interface Submission {
  id: string;
  userId: string;
  type: string; // proposal, dissertation, assignment, data_analysis, data_collection
  status?: string; // pending, in_progress, under_review, completed, cancelled
  title?: string;
  description?: string;
  requirements?: any; // JSON object with type-specific fields
  fileFormat?: string;
  preferredDate?: string;
  paymentMethod?: string;
  paymentArrangement?: string;
  amount: number;
  paidAmount?: number;
  files?: any; // Array of file metadata
  comments?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertSubmission {
  userId: string;
  type: string;
  status?: string;
  title?: string;
  description?: string;
  requirements?: any;
  fileFormat?: string;
  preferredDate?: string;
  paymentMethod?: string;
  paymentArrangement?: string;
  amount: number;
  paidAmount?: number;
  files?: any;
  comments?: string;
  adminNotes?: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  program: string; // medicine, engineering, business, etc.
  year?: string; // 111, 121, 211, etc.
  type: string; // study_notes, past_papers_theory, past_papers_practical
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: string;
  isApproved?: boolean;
  downloadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertMaterial {
  title: string;
  description?: string;
  program: string;
  year?: string;
  type: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: string;
  isApproved?: boolean;
  downloadCount?: number;
}

export interface ChatRoom {
  id: string;
  userId: string;
  adminId?: string;
  submissionId?: string;
  title?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertChatRoom {
  userId: string;
  adminId?: string;
  submissionId?: string;
  title?: string;
  isActive?: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content?: string;
  type?: string; // text, file, voice, image
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead?: boolean;
  createdAt?: string;
}

export interface InsertMessage {
  roomId: string;
  senderId: string;
  content?: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type?: string; // general, promotion, maintenance
  isActive?: boolean;
  createdBy: string;
  createdAt?: string;
}

export interface InsertAnnouncement {
  title: string;
  content: string;
  type?: string;
  isActive?: boolean;
  createdBy: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  points: number;
  reason: string; // signup, proposal_payment, dissertation_payment, etc.
  createdAt?: string;
}

export interface InsertReferral {
  referrerId: string;
  referredId: string;
  points: number;
  reason: string;
}

export interface Payment {
  id: string;
  userId: string;
  submissionId?: string;
  amount: number;
  method: string; // mobile_money, bank_transfer, admin_adjustment
  transactionId?: string; // Mobile money transaction ID
  reference?: string; // Additional reference
  description?: string; // Payment description
  status?: string; // pending, completed, failed
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertPayment {
  userId: string;
  submissionId?: string;
  amount: number;
  method: string;
  transactionId?: string;
  reference?: string;
  description?: string;
  status?: string;
  metadata?: any;
}

export interface PricingService {
  id: string;
  name: string;
  description?: string;
  price: number; // Price in Kwacha (K)
  features: any; // Array of features
  isActive?: boolean;
  isFeatured?: boolean;
  category?: string; // main, additional, free
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertPricingService {
  name: string;
  description?: string;
  price: number;
  features?: any;
  isActive?: boolean;
  isFeatured?: boolean;
  category?: string;
  orderIndex?: number;
}