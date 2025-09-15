import { pgTable, varchar, text, integer, boolean, timestamp, json, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table - central user management
export const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').notNull().unique(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  studentId: varchar('student_id'),
  phone: varchar('phone'),
  school: varchar('school'),
  role: varchar('role').default('student'), // student, admin
  profilePicture: varchar('profile_picture'),
  referralCode: varchar('referral_code').unique(),
  referralPoints: integer('referral_points').default(0),
  totalPaid: integer('total_paid').default(0), // in ngwee
  totalOwed: integer('total_owed').default(0), // in ngwee
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Submissions table - work requests from students
export const submissions = pgTable('submissions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id).notNull(),
  type: varchar('type').notNull(), // proposal, dissertation, assignment, data_analysis, data_collection
  status: varchar('status').default('pending'), // pending, in_progress, under_review, completed, cancelled
  title: text('title'),
  description: text('description'),
  requirements: json('requirements'), // JSON object with type-specific fields
  fileFormat: varchar('file_format'),
  preferredDate: varchar('preferred_date'),
  paymentMethod: varchar('payment_method'),
  paymentArrangement: varchar('payment_arrangement'),
  amount: integer('amount').notNull(), // in ngwee
  paidAmount: integer('paid_amount').default(0), // in ngwee
  files: json('files'), // Array of file metadata
  comments: text('comments'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Materials table - study resources library
export const materials = pgTable('materials', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title').notNull(),
  description: text('description'),
  program: varchar('program').notNull(), // medicine, engineering, business, etc.
  year: varchar('year'), // 111, 121, 211, etc.
  type: varchar('type').notNull(), // study_notes, past_papers_theory, past_papers_practical
  fileName: varchar('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  filePath: varchar('file_path').notNull(),
  uploadedBy: varchar('uploaded_by').references(() => users.id),
  isApproved: boolean('is_approved').default(false),
  downloadCount: integer('download_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Chat rooms for student-admin communication
export const chatRooms = pgTable('chat_rooms', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id).notNull(),
  adminId: varchar('admin_id').references(() => users.id),
  submissionId: varchar('submission_id').references(() => submissions.id),
  title: varchar('title'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages within chat rooms
export const messages = pgTable('messages', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar('room_id').references(() => chatRooms.id).notNull(),
  senderId: varchar('sender_id').references(() => users.id).notNull(),
  content: text('content'),
  type: varchar('type').default('text'), // text, file, voice, image
  fileUrl: varchar('file_url'),
  fileName: varchar('file_name'),
  fileSize: integer('file_size'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// System announcements
export const announcements = pgTable('announcements', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title').notNull(),
  content: text('content').notNull(),
  type: varchar('type').default('general'), // general, promotion, maintenance
  isActive: boolean('is_active').default(true),
  createdBy: varchar('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Referral tracking system
export const referrals = pgTable('referrals', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar('referrer_id').references(() => users.id).notNull(),
  referredId: varchar('referred_id').references(() => users.id).notNull(),
  points: integer('points').notNull(),
  reason: varchar('reason').notNull(), // signup, proposal_payment, dissertation_payment, etc.
  createdAt: timestamp('created_at').defaultNow(),
});

// Payment tracking
export const payments = pgTable('payments', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id).notNull(),
  submissionId: varchar('submission_id').references(() => submissions.id),
  amount: integer('amount').notNull(), // in ngwee
  method: varchar('method').notNull(), // mobile_money, bank_transfer, admin_adjustment
  transactionId: varchar('transaction_id'), // Mobile money transaction ID
  reference: varchar('reference'), // Additional reference
  description: text('description'), // Payment description
  status: varchar('status').default('pending'), // pending, completed, failed
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Pricing services configuration
export const pricingServices = pgTable('pricing_services', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // Price in ngwee
  features: json('features'), // Array of features
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  category: varchar('category').default('main'), // main, additional, free
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});