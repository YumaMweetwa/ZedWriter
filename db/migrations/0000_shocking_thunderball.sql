CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"type" varchar DEFAULT 'general',
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar,
	"submission_id" varchar,
	"title" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"program" varchar NOT NULL,
	"year" varchar,
	"type" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" varchar NOT NULL,
	"uploaded_by" varchar,
	"is_approved" boolean DEFAULT false,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text,
	"type" varchar DEFAULT 'text',
	"file_url" varchar,
	"file_name" varchar,
	"file_size" integer,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"submission_id" varchar,
	"amount" integer NOT NULL,
	"method" varchar NOT NULL,
	"transaction_id" varchar,
	"reference" varchar,
	"description" text,
	"status" varchar DEFAULT 'pending',
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"features" json,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"category" varchar DEFAULT 'main',
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" varchar NOT NULL,
	"referred_id" varchar NOT NULL,
	"points" integer NOT NULL,
	"reason" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"title" text,
	"description" text,
	"requirements" json,
	"file_format" varchar,
	"preferred_date" varchar,
	"payment_method" varchar,
	"payment_arrangement" varchar,
	"amount" integer NOT NULL,
	"paid_amount" integer DEFAULT 0,
	"files" json,
	"comments" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"student_id" varchar,
	"phone" varchar,
	"school" varchar,
	"role" varchar DEFAULT 'student',
	"profile_picture" varchar,
	"referral_code" varchar,
	"referral_points" integer DEFAULT 0,
	"total_paid" integer DEFAULT 0,
	"total_owed" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;