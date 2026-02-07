CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"entity_type" varchar,
	"entity_id" varchar,
	"details" jsonb,
	"ip_address" varchar,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "advertisements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"image_url" varchar,
	"link_url" varchar,
	"price" integer DEFAULT 500,
	"duration" integer DEFAULT 3,
	"payment_method" varchar,
	"status" varchar DEFAULT 'pending',
	"start_date" timestamp,
	"end_date" timestamp,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "chat_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"is_admin" boolean DEFAULT false,
	"last_read_message_id" integer,
	"joined_at" timestamp DEFAULT now()
);

CREATE TABLE "chat_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar DEFAULT 'group',
	"creator_id" varchar,
	"avatar_url" varchar,
	"description" text,
	"last_message_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"company_manager_name" varchar NOT NULL,
	"cr_number" varchar,
	"country" varchar NOT NULL,
	"city" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"subscription_duration_months" integer,
	"subscription_amount" integer,
	"status" varchar DEFAULT 'active',
	"storage_quota_gb" integer DEFAULT 10,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clients_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "clients_cr_number_unique" UNIQUE("cr_number")
);

CREATE TABLE "company_departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"name_ar" varchar,
	"description" text,
	"description_ar" text,
	"manager_id" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "company_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"name_ar" varchar,
	"description" text,
	"description_ar" text,
	"head_id" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar DEFAULT 'briefcase',
	"color" varchar DEFAULT 'blue',
	"manager_id" varchar NOT NULL,
	"password" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "employee_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"object_path" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"mime_type" varchar,
	"file_size" integer,
	"description" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"follower_user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "internal_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_starred" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"is_draft" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"parent_email_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "job_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" varchar NOT NULL,
	"location" varchar NOT NULL,
	"type" varchar DEFAULT 'full-time',
	"description" text,
	"requirements" text,
	"salary" varchar,
	"creator_id" varchar NOT NULL,
	"status" varchar DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "meeting_attendees" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending'
);

CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"organizer_id" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" varchar,
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"media_url" varchar,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "n8n_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"webhook_url" varchar,
	"api_key" varchar,
	"is_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "n8n_settings_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "office_followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"follower_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "office_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar,
	"content" text,
	"media_url" varchar,
	"thumbnail_url" varchar,
	"duration" integer,
	"is_pinned" boolean DEFAULT false,
	"expires_at" timestamp,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "office_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"session_id" varchar NOT NULL,
	"sender_type" varchar NOT NULL,
	"sender_name" varchar,
	"sender_email" varchar,
	"sender_id" varchar,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "office_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"media_url" text,
	"media_type" varchar,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "office_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"price" integer,
	"price_type" varchar DEFAULT 'fixed',
	"category" varchar,
	"image_url" varchar,
	"is_featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "offices" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"logo_url" varchar,
	"cover_url" varchar,
	"location" varchar,
	"category" varchar DEFAULT 'general',
	"owner_id" varchar NOT NULL,
	"receptionist_id" varchar,
	"is_published" boolean DEFAULT false,
	"subscription_status" varchar DEFAULT 'inactive',
	"contact_email" varchar,
	"contact_phone" varchar,
	"working_hours" varchar,
	"approval_status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "offices_slug_unique" UNIQUE("slug")
);

CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"type" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "post_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"media_url" text,
	"media_type" varchar,
	"scope" varchar DEFAULT 'public',
	"profile_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"display_name" varchar,
	"bio" text,
	"avatar_url" varchar,
	"cover_url" varchar,
	"website" varchar,
	"location" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_owner_id_unique" UNIQUE("owner_id")
);

CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "remote_employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"profile_image_url" varchar,
	"department_id" integer NOT NULL,
	"job_title" varchar,
	"bio" text,
	"skills" text,
	"status" varchar DEFAULT 'active',
	"hired_by_id" varchar NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "remote_employees_username_unique" UNIQUE("username")
);

CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);

CREATE TABLE "service_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"visitor_name" varchar,
	"visitor_email" varchar,
	"user_id" varchar,
	"content" text NOT NULL,
	"rating" integer,
	"status" varchar DEFAULT 'published',
	"parent_id" integer,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "service_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"office_id" integer NOT NULL,
	"created_by_user_id" varchar,
	"client_name" varchar NOT NULL,
	"client_email" varchar,
	"client_phone" varchar,
	"quoted_price" integer NOT NULL,
	"currency" varchar DEFAULT 'SAR',
	"notes" text,
	"status" varchar DEFAULT 'pending',
	"stripe_checkout_session_id" varchar,
	"stripe_payment_intent_id" varchar,
	"stripe_invoice_url" varchar,
	"chat_thread_id" integer,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "service_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"visitor_name" varchar,
	"user_id" varchar,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "service_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"office_id" integer NOT NULL,
	"visitor_name" varchar NOT NULL,
	"visitor_email" varchar NOT NULL,
	"visitor_phone" varchar,
	"message" text,
	"status" varchar DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"owner_user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"name_ar" varchar,
	"description" text,
	"description_ar" text,
	"price" integer NOT NULL,
	"currency" varchar DEFAULT 'SAR',
	"slug" varchar NOT NULL,
	"share_token" varchar NOT NULL,
	"image_url" varchar,
	"category" varchar,
	"is_active" boolean DEFAULT true,
	"stripe_product_id" varchar,
	"stripe_price_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "services_slug_unique" UNIQUE("slug"),
	CONSTRAINT "services_share_token_unique" UNIQUE("share_token")
);

CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

CREATE TABLE "status_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"status_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "status_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"status_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "status_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"status_id" integer NOT NULL,
	"viewer_id" varchar NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);

CREATE TABLE "statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar NOT NULL,
	"office_id" integer,
	"media_url" text NOT NULL,
	"media_type" varchar DEFAULT 'video',
	"caption" text,
	"expires_at" timestamp NOT NULL,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"billing_cycle" varchar NOT NULL,
	"base_price" integer NOT NULL,
	"add_on_count" integer DEFAULT 0,
	"add_on_price" integer DEFAULT 0,
	"total_price" integer NOT NULL,
	"currency" varchar DEFAULT 'SAR',
	"payment_method" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"add_on_services" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "task_automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"ai_suggestion" text,
	"ai_metadata" jsonb,
	"status" varchar DEFAULT 'pending',
	"approved_at" timestamp,
	"approved_by" varchar,
	"rejection_reason" text,
	"n8n_execution_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assignee_id" varchar,
	"creator_id" varchar,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'pending',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reporter_id" varchar,
	"assignee_id" varchar,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"type" varchar DEFAULT 'expense',
	"category" varchar,
	"submitter_id" varchar NOT NULL,
	"approver_id" varchar,
	"status" varchar DEFAULT 'pending',
	"receipt_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);

CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"username" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"department" varchar DEFAULT 'General',
	"role" varchar DEFAULT 'member',
	"status" varchar DEFAULT 'offline',
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE "video_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"session_id" varchar NOT NULL,
	"visitor_name" varchar,
	"room_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"receptionist_id" varchar,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_departments" ADD CONSTRAINT "company_departments_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_departments" ADD CONSTRAINT "company_departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_sections" ADD CONSTRAINT "company_sections_department_id_company_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "company_departments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_sections" ADD CONSTRAINT "company_sections_head_id_users_id_fk" FOREIGN KEY ("head_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "followers" ADD CONSTRAINT "followers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "followers" ADD CONSTRAINT "followers_follower_user_id_users_id_fk" FOREIGN KEY ("follower_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "internal_emails" ADD CONSTRAINT "internal_emails_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "internal_emails" ADD CONSTRAINT "internal_emails_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "n8n_settings" ADD CONSTRAINT "n8n_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_followers" ADD CONSTRAINT "office_followers_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_followers" ADD CONSTRAINT "office_followers_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_media" ADD CONSTRAINT "office_media_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_messages" ADD CONSTRAINT "office_messages_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_messages" ADD CONSTRAINT "office_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_posts" ADD CONSTRAINT "office_posts_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_posts" ADD CONSTRAINT "office_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "office_services" ADD CONSTRAINT "office_services_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "offices" ADD CONSTRAINT "offices_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "offices" ADD CONSTRAINT "offices_receptionist_id_users_id_fk" FOREIGN KEY ("receptionist_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "posts" ADD CONSTRAINT "posts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "remote_employees" ADD CONSTRAINT "remote_employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "remote_employees" ADD CONSTRAINT "remote_employees_hired_by_id_users_id_fk" FOREIGN KEY ("hired_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_comments" ADD CONSTRAINT "service_comments_service_id_office_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "office_services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_comments" ADD CONSTRAINT "service_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_chat_thread_id_chat_threads_id_fk" FOREIGN KEY ("chat_thread_id") REFERENCES "chat_threads"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_ratings" ADD CONSTRAINT "service_ratings_service_id_office_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "office_services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_ratings" ADD CONSTRAINT "service_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_office_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "office_services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "services" ADD CONSTRAINT "services_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "services" ADD CONSTRAINT "services_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "status_likes" ADD CONSTRAINT "status_likes_status_id_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "status_likes" ADD CONSTRAINT "status_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "status_replies" ADD CONSTRAINT "status_replies_status_id_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "status_replies" ADD CONSTRAINT "status_replies_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "status_views" ADD CONSTRAINT "status_views_status_id_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "status_views" ADD CONSTRAINT "status_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "task_automations" ADD CONSTRAINT "task_automations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "task_automations" ADD CONSTRAINT "task_automations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "task_automations" ADD CONSTRAINT "task_automations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "video_calls" ADD CONSTRAINT "video_calls_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "video_calls" ADD CONSTRAINT "video_calls_receptionist_id_users_id_fk" FOREIGN KEY ("receptionist_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
