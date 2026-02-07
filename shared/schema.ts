import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  index,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// Session storage table (Required for Replit Auth)
// ============================================
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ============================================
// Users table (Required for Replit Auth)
// ============================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  department: varchar("department").default("General"),
  role: varchar("role").default("member"),
  status: varchar("status").default("offline"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const validUserRoles = ['admin', 'manager', 'member', 'office_renter', 'visitor'] as const;
export type UserRoleType = typeof validUserRoles[number];

export const updateUserSchema = z.object({
  role: z.enum(validUserRoles).optional(),
  department: z.string().max(100).optional(),
  status: z.enum(['online', 'offline', 'away', 'busy']).optional(),
}).strict();
export type UpdateUser = z.infer<typeof updateUserSchema>;

// ============================================
// Tasks
// ============================================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  creatorId: varchar("creator_id").references(() => users.id),
  priority: varchar("priority").default("medium"),
  status: varchar("status").default("pending"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  creator: one(users, { fields: [tasks.creatorId], references: [users.id] }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ============================================
// Tickets (Support)
// ============================================
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reporterId: varchar("reporter_id").references(() => users.id),
  assigneeId: varchar("assignee_id").references(() => users.id),
  priority: varchar("priority").default("medium"),
  status: varchar("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketsRelations = relations(tickets, ({ one }) => ({
  reporter: one(users, { fields: [tickets.reporterId], references: [users.id] }),
  assignee: one(users, { fields: [tickets.assigneeId], references: [users.id] }),
}));

export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// ============================================
// Social Profiles
// ============================================
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull().unique(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  coverUrl: varchar("cover_url"),
  website: varchar("website"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  owner: one(users, { fields: [profiles.ownerId], references: [users.id] }),
  followers: many(followers),
}));

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// ============================================
// Followers
// ============================================
export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  followerUserId: varchar("follower_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followersRelations = relations(followers, ({ one }) => ({
  profile: one(profiles, { fields: [followers.profileId], references: [profiles.id] }),
  follower: one(users, { fields: [followers.followerUserId], references: [users.id] }),
}));

export type Follower = typeof followers.$inferSelect;

// ============================================
// Social Posts
// ============================================
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type"),
  scope: varchar("scope").default("public"),
  profileId: integer("profile_id").references(() => profiles.id),
  isReel: boolean("is_reel").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  profile: one(profiles, { fields: [posts.profileId], references: [profiles.id] }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// ============================================
// Post Likes
// ============================================
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

// ============================================
// Post Comments
// ============================================
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, { fields: [postComments.postId], references: [posts.id] }),
  author: one(users, { fields: [postComments.authorId], references: [users.id] }),
}));

export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, createdAt: true });
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;

// ============================================
// Chat Threads (WhatsApp-style messaging)
// ============================================
export const chatThreads = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").default("group"), // "group" or "direct"
  creatorId: varchar("creator_id").references(() => users.id),
  avatarUrl: varchar("avatar_url"),
  description: text("description"),
  lastMessageId: integer("last_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  creator: one(users, { fields: [chatThreads.creatorId], references: [users.id] }),
  participants: many(chatParticipants),
  messages: many(messages),
}));

export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({ id: true, createdAt: true, updatedAt: true, lastMessageId: true });
export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;

// ============================================
// Chat Participants
// ============================================
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => chatThreads.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),
  lastReadMessageId: integer("last_read_message_id"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  thread: one(chatThreads, { fields: [chatParticipants.threadId], references: [chatThreads.id] }),
  user: one(users, { fields: [chatParticipants.userId], references: [users.id] }),
}));

export type ChatParticipant = typeof chatParticipants.$inferSelect;

// ============================================
// Messages
// ============================================
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => chatThreads.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // "text", "image", "file"
  mediaUrl: varchar("media_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(chatThreads, { fields: [messages.threadId], references: [chatThreads.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ============================================
// Internal Emails (Company Mail System)
// ============================================
export const internalEmails = pgTable("internal_emails", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  isArchived: boolean("is_archived").default(false),
  isDraft: boolean("is_draft").default(false),
  isDeleted: boolean("is_deleted").default(false),
  parentEmailId: integer("parent_email_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const internalEmailsRelations = relations(internalEmails, ({ one }) => ({
  sender: one(users, { fields: [internalEmails.senderId], references: [users.id] }),
  recipient: one(users, { fields: [internalEmails.recipientId], references: [users.id] }),
}));

export const insertInternalEmailSchema = createInsertSchema(internalEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRead: true,
  isStarred: true,
  isArchived: true,
  isDeleted: true,
});
export type InsertInternalEmail = z.infer<typeof insertInternalEmailSchema>;
export type InternalEmail = typeof internalEmails.$inferSelect;

// ============================================
// Employee Documents (Personal File Storage)
// ============================================
export const employeeDocuments = pgTable("employee_documents", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  objectPath: varchar("object_path").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(users, { fields: [employeeDocuments.employeeId], references: [users.id] }),
}));

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({
  id: true,
  createdAt: true,
});
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;

// ============================================
// Meetings
// ============================================
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  organizerId: varchar("organizer_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: varchar("location"),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  organizer: one(users, { fields: [meetings.organizerId], references: [users.id] }),
  attendees: many(meetingAttendees),
}));

export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// ============================================
// Meeting Attendees
// ============================================
export const meetingAttendees = pgTable("meeting_attendees", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id).notNull(),
  userId: varchar("user_id").notNull(),
  status: varchar("status").default("pending"),
});

export const meetingAttendeesRelations = relations(meetingAttendees, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingAttendees.meetingId], references: [meetings.id] }),
}));

// ============================================
// Job Postings
// ============================================
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: varchar("department").notNull(),
  location: varchar("location").notNull(),
  type: varchar("type").default("full-time"),
  description: text("description"),
  requirements: text("requirements"),
  salary: varchar("salary"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  status: varchar("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobPostingsRelations = relations(jobPostings, ({ one }) => ({
  creator: one(users, { fields: [jobPostings.creatorId], references: [users.id] }),
}));

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

// ============================================
// Transactions (Finance)
// ============================================
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  type: varchar("type").default("expense"),
  category: varchar("category"),
  submitterId: varchar("submitter_id").references(() => users.id).notNull(),
  approverId: varchar("approver_id").references(() => users.id),
  status: varchar("status").default("pending"),
  receiptUrl: varchar("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  submitter: one(users, { fields: [transactions.submitterId], references: [users.id] }),
  approver: one(users, { fields: [transactions.approverId], references: [users.id] }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ============================================
// Roles (Access Control)
// ============================================
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// ============================================
// User Roles (many-to-many)
// ============================================
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

// ============================================
// Departments (Standalone - Manager Owned)
// ============================================
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("briefcase"),
  color: varchar("color").default("blue"),
  managerId: varchar("manager_id").references(() => users.id).notNull(),
  password: varchar("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(users, { fields: [departments.managerId], references: [users.id] }),
  employees: many(remoteEmployees),
}));

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// ============================================
// Remote Employees
// ============================================
export const remoteEmployees = pgTable("remote_employees", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  jobTitle: varchar("job_title"),
  bio: text("bio"),
  skills: text("skills"),
  status: varchar("status").default("active"),
  hiredById: varchar("hired_by_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const remoteEmployeesRelations = relations(remoteEmployees, ({ one }) => ({
  department: one(departments, { fields: [remoteEmployees.departmentId], references: [departments.id] }),
  hiredBy: one(users, { fields: [remoteEmployees.hiredById], references: [users.id] }),
}));

export const insertRemoteEmployeeSchema = createInsertSchema(remoteEmployees).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRemoteEmployee = z.infer<typeof insertRemoteEmployeeSchema>;
export type RemoteEmployee = typeof remoteEmployees.$inferSelect;

// ============================================
// Notifications
// ============================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  read: boolean("read").default(false),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================
// Subscriptions (Office Plans)
// ============================================
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // 'monthly' or 'yearly'
  basePrice: integer("base_price").notNull(), // 499 monthly or 3000 yearly in riyals
  addOnCount: integer("add_on_count").default(0),
  addOnPrice: integer("add_on_price").default(0), // Total add-on price
  totalPrice: integer("total_price").notNull(),
  currency: varchar("currency").default("SAR"),
  paymentMethod: varchar("payment_method").notNull(), // 'apple_pay', 'visa', 'credit_card'
  status: varchar("status").default("pending"), // 'pending', 'active', 'cancelled', 'expired'
  addOnServices: jsonb("add_on_services").default([]), // Array of selected add-on service keys
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// ============================================
// Advertisements
// ============================================
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  price: integer("price").default(500), // 500 SAR for 3 days
  duration: integer("duration").default(3), // Duration in days
  paymentMethod: varchar("payment_method"), // 'apple_pay', 'visa', 'credit_card'
  status: varchar("status").default("pending"), // 'pending', 'active', 'expired', 'cancelled'
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const advertisementsRelations = relations(advertisements, ({ one }) => ({
  user: one(users, { fields: [advertisements.userId], references: [users.id] }),
}));

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({ id: true, createdAt: true, updatedAt: true, views: true, clicks: true });
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;

// ============================================
// n8n Integration Settings
// ============================================
export const n8nSettings = pgTable("n8n_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  webhookUrl: varchar("webhook_url"), // n8n webhook URL for task automation
  apiKey: varchar("api_key"), // Optional API key for authentication
  isEnabled: boolean("is_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const n8nSettingsRelations = relations(n8nSettings, ({ one }) => ({
  user: one(users, { fields: [n8nSettings.userId], references: [users.id] }),
}));

export const insertN8nSettingsSchema = createInsertSchema(n8nSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertN8nSettings = z.infer<typeof insertN8nSettingsSchema>;
export type N8nSettings = typeof n8nSettings.$inferSelect;

// ============================================
// Task Automation (AI suggestions from n8n)
// ============================================
export const taskAutomations = pgTable("task_automations", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  aiSuggestion: text("ai_suggestion"), // AI-generated work/response
  aiMetadata: jsonb("ai_metadata"), // Additional data from n8n (sources, confidence, etc.)
  status: varchar("status").default("pending"), // 'pending', 'processing', 'ready', 'approved', 'rejected'
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  n8nExecutionId: varchar("n8n_execution_id"), // Track n8n workflow execution
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskAutomationsRelations = relations(taskAutomations, ({ one }) => ({
  task: one(tasks, { fields: [taskAutomations.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAutomations.userId], references: [users.id] }),
  approver: one(users, { fields: [taskAutomations.approvedBy], references: [users.id] }),
}));

export const insertTaskAutomationSchema = createInsertSchema(taskAutomations).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true });
export type InsertTaskAutomation = z.infer<typeof insertTaskAutomationSchema>;
export type TaskAutomation = typeof taskAutomations.$inferSelect;

// ============================================
// Offices (Virtual Office Storefront)
// ============================================
export const offices = pgTable("offices", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  coverUrl: varchar("cover_url"),
  location: varchar("location"),
  category: varchar("category").default("general"), // e.g., 'legal', 'tech', 'consulting', 'medical'
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  receptionistId: varchar("receptionist_id").references(() => users.id), // Employee acting as receptionist
  isPublished: boolean("is_published").default(false),
  subscriptionStatus: varchar("subscription_status").default("inactive"), // 'active', 'inactive', 'expired'
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  workingHours: varchar("working_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const officesRelations = relations(offices, ({ one, many }) => ({
  owner: one(users, { fields: [offices.ownerId], references: [users.id] }),
  receptionist: one(users, { fields: [offices.receptionistId], references: [users.id] }),
  services: many(officeServices),
  media: many(officeMedia),
  posts: many(officePosts),
  messages: many(officeMessages),
  departments: many(companyDepartments),
}));

export const insertOfficeSchema = createInsertSchema(offices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOffice = z.infer<typeof insertOfficeSchema>;
export type Office = typeof offices.$inferSelect;

// ============================================
// Company Departments (Hierarchical structure under offices/companies)
// ============================================
export const companyDepartments = pgTable("company_departments", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  name: varchar("name").notNull(),
  nameAr: varchar("name_ar"), // Arabic name
  description: text("description"),
  descriptionAr: text("description_ar"), // Arabic description
  managerId: varchar("manager_id").references(() => users.id), // Department manager
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyDepartmentsRelations = relations(companyDepartments, ({ one, many }) => ({
  office: one(offices, { fields: [companyDepartments.officeId], references: [offices.id] }),
  manager: one(users, { fields: [companyDepartments.managerId], references: [users.id] }),
  sections: many(companySections),
}));

export const insertCompanyDepartmentSchema = createInsertSchema(companyDepartments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanyDepartment = z.infer<typeof insertCompanyDepartmentSchema>;
export type CompanyDepartment = typeof companyDepartments.$inferSelect;

// ============================================
// Company Sections (Under departments)
// ============================================
export const companySections = pgTable("company_sections", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").references(() => companyDepartments.id).notNull(),
  name: varchar("name").notNull(),
  nameAr: varchar("name_ar"), // Arabic name
  description: text("description"),
  descriptionAr: text("description_ar"), // Arabic description
  headId: varchar("head_id").references(() => users.id), // Section head
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companySectionsRelations = relations(companySections, ({ one }) => ({
  department: one(companyDepartments, { fields: [companySections.departmentId], references: [companyDepartments.id] }),
  head: one(users, { fields: [companySections.headId], references: [users.id] }),
}));

export const insertCompanySectionSchema = createInsertSchema(companySections).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanySection = z.infer<typeof insertCompanySectionSchema>;
export type CompanySection = typeof companySections.$inferSelect;

// ============================================
// Office Services
// ============================================
export const officeServices = pgTable("office_services", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  price: integer("price"), // Price in SAR (smallest unit)
  priceType: varchar("price_type").default("fixed"), // 'fixed', 'hourly', 'negotiable', 'free'
  category: varchar("category"),
  imageUrl: varchar("image_url"),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const officeServicesRelations = relations(officeServices, ({ one, many }) => ({
  office: one(offices, { fields: [officeServices.officeId], references: [offices.id] }),
  ratings: many(serviceRatings),
  comments: many(serviceComments),
}));

export const insertOfficeServiceSchema = createInsertSchema(officeServices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOfficeService = z.infer<typeof insertOfficeServiceSchema>;
export type OfficeService = typeof officeServices.$inferSelect;

// ============================================
// Service Ratings
// ============================================
export const serviceRatings = pgTable("service_ratings", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => officeServices.id).notNull(),
  visitorName: varchar("visitor_name"), // For anonymous visitors
  userId: varchar("user_id").references(() => users.id), // For logged-in users
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceRatingsRelations = relations(serviceRatings, ({ one }) => ({
  service: one(officeServices, { fields: [serviceRatings.serviceId], references: [officeServices.id] }),
  user: one(users, { fields: [serviceRatings.userId], references: [users.id] }),
}));

export const insertServiceRatingSchema = createInsertSchema(serviceRatings).omit({ id: true, createdAt: true });
export type InsertServiceRating = z.infer<typeof insertServiceRatingSchema>;
export type ServiceRating = typeof serviceRatings.$inferSelect;

// ============================================
// Service Comments (Reviews)
// ============================================
export const serviceComments = pgTable("service_comments", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => officeServices.id).notNull(),
  visitorName: varchar("visitor_name"), // For anonymous visitors
  visitorEmail: varchar("visitor_email"), // For contact
  userId: varchar("user_id").references(() => users.id), // For logged-in users
  content: text("content").notNull(),
  rating: integer("rating"), // Optional rating with comment (1-5)
  status: varchar("status").default("published"), // 'published', 'pending', 'hidden'
  parentId: integer("parent_id"), // For reply threading
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceCommentsRelations = relations(serviceComments, ({ one }) => ({
  service: one(officeServices, { fields: [serviceComments.serviceId], references: [officeServices.id] }),
  user: one(users, { fields: [serviceComments.userId], references: [users.id] }),
}));

export const insertServiceCommentSchema = createInsertSchema(serviceComments).omit({ id: true, createdAt: true });
export type InsertServiceComment = z.infer<typeof insertServiceCommentSchema>;
export type ServiceComment = typeof serviceComments.$inferSelect;

// ============================================
// Service Requests (Visitor Inquiries)
// ============================================
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => officeServices.id).notNull(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  visitorName: varchar("visitor_name").notNull(),
  visitorEmail: varchar("visitor_email").notNull(),
  visitorPhone: varchar("visitor_phone"),
  message: text("message"),
  status: varchar("status").default("pending"), // 'pending', 'contacted', 'completed', 'cancelled'
  notes: text("notes"), // Internal notes from office staff
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  service: one(officeServices, { fields: [serviceRequests.serviceId], references: [officeServices.id] }),
  office: one(offices, { fields: [serviceRequests.officeId], references: [offices.id] }),
}));

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

// ============================================
// Office Media (Daily Videos, Announcements)
// ============================================
export const officeMedia = pgTable("office_media", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  type: varchar("type").notNull(), // 'video', 'announcement', 'image'
  title: varchar("title"),
  content: text("content"), // For announcements
  mediaUrl: varchar("media_url"), // URL for video/image
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // Video duration in seconds
  isPinned: boolean("is_pinned").default(false),
  expiresAt: timestamp("expires_at"), // For story-style content that expires
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const officeMediaRelations = relations(officeMedia, ({ one }) => ({
  office: one(offices, { fields: [officeMedia.officeId], references: [offices.id] }),
}));

export const insertOfficeMediaSchema = createInsertSchema(officeMedia).omit({ id: true, createdAt: true, views: true });
export type InsertOfficeMedia = z.infer<typeof insertOfficeMediaSchema>;
export type OfficeMedia = typeof officeMedia.$inferSelect;

// ============================================
// Office Posts (Social Media for Office)
// ============================================
export const officePosts = pgTable("office_posts", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type"),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const officePostsRelations = relations(officePosts, ({ one }) => ({
  office: one(offices, { fields: [officePosts.officeId], references: [offices.id] }),
  author: one(users, { fields: [officePosts.authorId], references: [users.id] }),
}));

export const insertOfficePostSchema = createInsertSchema(officePosts).omit({ id: true, createdAt: true, updatedAt: true, likes: true });
export type InsertOfficePost = z.infer<typeof insertOfficePostSchema>;
export type OfficePost = typeof officePosts.$inferSelect;

// ============================================
// Office Messages (Visitor to Receptionist Chat)
// ============================================
export const officeMessages = pgTable("office_messages", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  sessionId: varchar("session_id").notNull(), // For tracking visitor session
  senderType: varchar("sender_type").notNull(), // 'visitor' or 'receptionist'
  senderName: varchar("sender_name"), // Visitor name
  senderEmail: varchar("sender_email"), // Visitor email for follow-up
  senderId: varchar("sender_id").references(() => users.id), // If receptionist
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const officeMessagesRelations = relations(officeMessages, ({ one }) => ({
  office: one(offices, { fields: [officeMessages.officeId], references: [offices.id] }),
  sender: one(users, { fields: [officeMessages.senderId], references: [users.id] }),
}));

export const insertOfficeMessageSchema = createInsertSchema(officeMessages).omit({ id: true, createdAt: true, isRead: true });
export type InsertOfficeMessage = z.infer<typeof insertOfficeMessageSchema>;
export type OfficeMessage = typeof officeMessages.$inferSelect;

// ============================================
// Video Calls (Visitor to Receptionist Video Chat)
// ============================================
export const videoCalls = pgTable("video_calls", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  sessionId: varchar("session_id").notNull(), // Visitor session ID
  visitorName: varchar("visitor_name"),
  roomId: varchar("room_id").notNull(), // Unique room identifier for the call
  status: varchar("status").notNull().default("pending"), // 'pending', 'active', 'ended', 'declined'
  receptionistId: varchar("receptionist_id").references(() => users.id), // Who answered the call
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoCallsRelations = relations(videoCalls, ({ one }) => ({
  office: one(offices, { fields: [videoCalls.officeId], references: [offices.id] }),
  receptionist: one(users, { fields: [videoCalls.receptionistId], references: [users.id] }),
}));

export const insertVideoCallSchema = createInsertSchema(videoCalls).omit({ id: true, createdAt: true, startedAt: true, endedAt: true });
export type InsertVideoCall = z.infer<typeof insertVideoCallSchema>;
export type VideoCall = typeof videoCalls.$inferSelect;

// ============================================
// Daily Statuses (Stories)
// ============================================
export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  officeId: integer("office_id").references(() => offices.id),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type").default("video"),
  caption: text("caption"),
  expiresAt: timestamp("expires_at").notNull(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statusesRelations = relations(statuses, ({ one, many }) => ({
  author: one(users, { fields: [statuses.authorId], references: [users.id] }),
  office: one(offices, { fields: [statuses.officeId], references: [offices.id] }),
  replies: many(statusReplies),
  views: many(statusViews),
}));

export const insertStatusSchema = createInsertSchema(statuses).omit({ id: true, createdAt: true, viewCount: true });
export type InsertStatus = z.infer<typeof insertStatusSchema>;
export type Status = typeof statuses.$inferSelect;

// ============================================
// Status Replies (Chat Messages on Stories)
// ============================================
export const statusReplies = pgTable("status_replies", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id").references(() => statuses.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statusRepliesRelations = relations(statusReplies, ({ one }) => ({
  status: one(statuses, { fields: [statusReplies.statusId], references: [statuses.id] }),
  sender: one(users, { fields: [statusReplies.senderId], references: [users.id] }),
}));

export const insertStatusReplySchema = createInsertSchema(statusReplies).omit({ id: true, createdAt: true, isRead: true });
export type InsertStatusReply = z.infer<typeof insertStatusReplySchema>;
export type StatusReply = typeof statusReplies.$inferSelect;

// ============================================
// Status Views (Who Viewed the Story)
// ============================================
export const statusViews = pgTable("status_views", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id").references(() => statuses.id).notNull(),
  viewerId: varchar("viewer_id").references(() => users.id).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const statusViewsRelations = relations(statusViews, ({ one }) => ({
  status: one(statuses, { fields: [statusViews.statusId], references: [statuses.id] }),
  viewer: one(users, { fields: [statusViews.viewerId], references: [users.id] }),
}));

export const insertStatusViewSchema = createInsertSchema(statusViews).omit({ id: true, viewedAt: true });
export type InsertStatusView = z.infer<typeof insertStatusViewSchema>;
export type StatusView = typeof statusViews.$inferSelect;

// ============================================
// Status Likes (Like a Story)
// ============================================
export const statusLikes = pgTable("status_likes", {
  id: serial("id").primaryKey(),
  statusId: integer("status_id").references(() => statuses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statusLikesRelations = relations(statusLikes, ({ one }) => ({
  status: one(statuses, { fields: [statusLikes.statusId], references: [statuses.id] }),
  user: one(users, { fields: [statusLikes.userId], references: [users.id] }),
}));

export const insertStatusLikeSchema = createInsertSchema(statusLikes).omit({ id: true, createdAt: true });
export type InsertStatusLike = z.infer<typeof insertStatusLikeSchema>;
export type StatusLike = typeof statusLikes.$inferSelect;

// ============================================
// Office Follows (Follow Office Profile)
// ============================================
export const officeFollowers = pgTable("office_followers", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const officeFollowersRelations = relations(officeFollowers, ({ one }) => ({
  office: one(offices, { fields: [officeFollowers.officeId], references: [offices.id] }),
  follower: one(users, { fields: [officeFollowers.followerId], references: [users.id] }),
}));

export const insertOfficeFollowerSchema = createInsertSchema(officeFollowers).omit({ id: true, createdAt: true });
export type InsertOfficeFollower = z.infer<typeof insertOfficeFollowerSchema>;
export type OfficeFollower = typeof officeFollowers.$inferSelect;

// ============================================
// Push Subscriptions (Browser Push Notifications)
// ============================================
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// ============================================
// Services (Office-provided services for sale)
// ============================================
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  ownerUserId: varchar("owner_user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  nameAr: varchar("name_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: integer("price").notNull(),
  currency: varchar("currency").default("SAR"),
  slug: varchar("slug").notNull().unique(),
  shareToken: varchar("share_token").notNull().unique(),
  imageUrl: varchar("image_url"),
  category: varchar("category"),
  isActive: boolean("is_active").default(true),
  stripeProductId: varchar("stripe_product_id"),
  stripePriceId: varchar("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const servicesRelations = relations(services, ({ one, many }) => ({
  office: one(offices, { fields: [services.officeId], references: [offices.id] }),
  owner: one(users, { fields: [services.ownerUserId], references: [users.id] }),
  orders: many(serviceOrders),
}));

export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// ============================================
// Service Orders (Customer orders and invoices)
// ============================================
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  quotedPrice: integer("quoted_price").notNull(),
  currency: varchar("currency").default("SAR"),
  notes: text("notes"),
  status: varchar("status").default("pending"),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeInvoiceUrl: varchar("stripe_invoice_url"),
  chatThreadId: integer("chat_thread_id").references(() => chatThreads.id),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceOrdersRelations = relations(serviceOrders, ({ one }) => ({
  service: one(services, { fields: [serviceOrders.serviceId], references: [services.id] }),
  office: one(offices, { fields: [serviceOrders.officeId], references: [offices.id] }),
  createdBy: one(users, { fields: [serviceOrders.createdByUserId], references: [users.id] }),
  chatThread: one(chatThreads, { fields: [serviceOrders.chatThreadId], references: [chatThreads.id] }),
}));

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({ id: true, createdAt: true, updatedAt: true, paidAt: true });
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type ServiceOrder = typeof serviceOrders.$inferSelect;

// ============================================
// Stories (24-hour content)
// ============================================
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type").notNull(), // 'image' or 'video'
  caption: text("caption"),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(users, { fields: [stories.authorId], references: [users.id] }),
  views: many(storyViews),
}));

export const insertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true, viewCount: true });
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

// ============================================
// Story Views
// ============================================
export const storyViews = pgTable("story_views", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").references(() => stories.id).notNull(),
  viewerId: varchar("viewer_id").references(() => users.id).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(stories, { fields: [storyViews.storyId], references: [stories.id] }),
  viewer: one(users, { fields: [storyViews.viewerId], references: [users.id] }),
}));
