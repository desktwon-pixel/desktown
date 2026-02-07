import {
  users,
  tasks,
  tickets,
  profiles,
  followers,
  posts,
  postLikes,
  postComments,
  chatThreads,
  chatParticipants,
  messages,
  meetings,
  meetingAttendees,
  jobPostings,
  transactions,
  roles,
  userRoles,
  notifications,
  departments,
  remoteEmployees,
  subscriptions,
  advertisements,
  n8nSettings,
  taskAutomations,
  offices,
  officeServices,
  serviceRatings,
  serviceComments,
  serviceRequests,
  officeMedia,
  officePosts,
  officeMessages,
  videoCalls,
  type User,
  type UpsertUser,
  type Task,
  type InsertTask,
  type Ticket,
  type InsertTicket,
  type Profile,
  type InsertProfile,
  type Follower,
  type Post,
  type InsertPost,
  type PostComment,
  type InsertPostComment,
  type ChatThread,
  type InsertChatThread,
  type Message,
  type InsertMessage,
  type Meeting,
  type InsertMeeting,
  type JobPosting,
  type InsertJobPosting,
  type Transaction,
  type InsertTransaction,
  type Role,
  type InsertRole,
  type Notification,
  type InsertNotification,
  type Department,
  type InsertDepartment,
  type RemoteEmployee,
  type InsertRemoteEmployee,
  type Subscription,
  type InsertSubscription,
  type Advertisement,
  type InsertAdvertisement,
  type N8nSettings,
  type InsertN8nSettings,
  type TaskAutomation,
  type InsertTaskAutomation,
  type Office,
  type InsertOffice,
  type OfficeService,
  type InsertOfficeService,
  type ServiceRating,
  type InsertServiceRating,
  type ServiceComment,
  type InsertServiceComment,
  type ServiceRequest,
  type InsertServiceRequest,
  type OfficeMedia,
  type InsertOfficeMedia,
  type OfficePost,
  type InsertOfficePost,
  type OfficeMessage,
  type InsertOfficeMessage,
  type VideoCall,
  type InsertVideoCall,
  statuses,
  statusReplies,
  statusViews,
  statusLikes,
  officeFollowers,
  internalEmails,
  type Status,
  type InsertStatus,
  type StatusReply,
  type InsertStatusReply,
  type StatusView,
  type InsertStatusView,
  type StatusLike,
  type InsertStatusLike,
  type OfficeFollower,
  type InsertOfficeFollower,
  type InternalEmail,
  type InsertInternalEmail,
  pushSubscriptions,
  type PushSubscription,
  type InsertPushSubscription,
  employeeDocuments,
  type EmployeeDocument,
  type InsertEmployeeDocument,
  services,
  serviceOrders,
  type Service,
  type InsertService,
  type ServiceOrder,
  type InsertServiceOrder,
  companyDepartments,
  companySections,
  type CompanyDepartment,
  type InsertCompanyDepartment,
  type CompanySection,
  type InsertCompanySection,
  stories,
  storyViews,
  type Story,
  type InsertStory,
} from "../shared/schema.ts";
import { db } from "./db.ts";
import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  updateLastSeen(id: string): Promise<void>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  getTasksByAssignee(assigneeId: string): Promise<Task[]>;

  // Ticket operations
  getTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<void>;

  // Profile operations
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByOwner(ownerId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  getOrCreateProfile(ownerId: string): Promise<Profile>;

  // Follower operations
  followProfile(profileId: number, followerUserId: string): Promise<void>;
  unfollowProfile(profileId: number, followerUserId: string): Promise<void>;
  getFollowerCount(profileId: number): Promise<number>;
  isFollowing(profileId: number, userId: string): Promise<boolean>;

  // Profile stats
  getProfileStats(profileId: number): Promise<{ likes: number; followers: number; videos: number; photos: number }>;

  // Post operations
  getPosts(): Promise<Post[]>;
  getPublicPosts(): Promise<Post[]>;
  getProfilePosts(profileId: number): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: number): Promise<void>;
  likePost(postId: number, userId: string): Promise<void>;
  unlikePost(postId: number, userId: string): Promise<void>;
  getPostLikes(postId: number): Promise<number>;
  hasUserLikedPost(postId: number, userId: string): Promise<boolean>;
  getPostComments(postId: number): Promise<PostComment[]>;
  addPostComment(comment: InsertPostComment): Promise<PostComment>;
  getTotalLikesForProfile(profileId: number): Promise<number>;

  // Chat operations (WhatsApp-style)
  getChatThreads(userId: string): Promise<ChatThread[]>;
  getChatThread(id: number): Promise<ChatThread | undefined>;
  createChatThread(thread: InsertChatThread, participantIds: string[], creatorId: string): Promise<ChatThread>;
  getOrCreateGlobalChat(): Promise<ChatThread>;
  createDirectChat(userId1: string, userId2: string): Promise<ChatThread>;
  getDirectChatBetweenUsers(userId1: string, userId2: string): Promise<ChatThread | undefined>;
  getMessages(threadId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getThreadParticipants(threadId: number): Promise<User[]>;
  addThreadParticipant(threadId: number, userId: string, isAdmin?: boolean): Promise<void>;
  removeThreadParticipant(threadId: number, userId: string): Promise<void>;
  updateThread(threadId: number, data: Partial<InsertChatThread>): Promise<ChatThread | undefined>;
  getLastMessage(threadId: number): Promise<Message | undefined>;
  getUnreadCount(threadId: number, userId: string): Promise<number>;
  markMessagesRead(threadId: number, userId: string): Promise<void>;
  deleteThread(threadId: number): Promise<void>;

  // Meeting operations
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting, attendeeIds: string[]): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<void>;
  getMeetingAttendees(meetingId: number): Promise<User[]>;

  // Job posting operations
  getJobPostings(): Promise<JobPosting[]>;
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  createJobPosting(job: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, job: Partial<InsertJobPosting>): Promise<JobPosting | undefined>;
  deleteJobPosting(id: number): Promise<void>;

  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<void>;
  getPendingTransactions(): Promise<Transaction[]>;

  // Role operations
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
  assignRole(userId: string, roleId: number): Promise<void>;
  removeRole(userId: string, roleId: number): Promise<void>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Department operations (standalone)
  getDepartments(): Promise<Department[]>;
  getDepartmentsByManager(managerId: string): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<void>;
  verifyDepartmentPassword(id: number, password: string): Promise<boolean>;

  // Remote Employee operations
  getAllRemoteEmployees(): Promise<RemoteEmployee[]>;
  getRemoteEmployees(departmentId: number): Promise<RemoteEmployee[]>;
  getRemoteEmployee(id: number): Promise<RemoteEmployee | undefined>;
  getRemoteEmployeeByUsername(username: string): Promise<RemoteEmployee | undefined>;
  getRemoteEmployeeByEmail(email: string): Promise<RemoteEmployee | undefined>;
  createRemoteEmployee(employee: InsertRemoteEmployee): Promise<RemoteEmployee>;
  updateRemoteEmployee(id: number, employee: Partial<InsertRemoteEmployee>): Promise<RemoteEmployee | undefined>;
  deleteRemoteEmployee(id: number): Promise<void>;

  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByUser(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;

  // Advertisement operations
  getAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisements(): Promise<Advertisement[]>;
  getAdvertisementsByUser(userId: string): Promise<Advertisement[]>;
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: number, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<void>;
  incrementAdViews(id: number): Promise<void>;
  incrementAdClicks(id: number): Promise<void>;

  // n8n Settings operations
  getN8nSettings(userId: string): Promise<N8nSettings | undefined>;
  createN8nSettings(settings: InsertN8nSettings): Promise<N8nSettings>;
  updateN8nSettings(userId: string, settings: Partial<InsertN8nSettings>): Promise<N8nSettings | undefined>;

  // Task Automation operations
  getTaskAutomations(userId: string): Promise<TaskAutomation[]>;
  getTaskAutomation(id: number): Promise<TaskAutomation | undefined>;
  getTaskAutomationByTask(taskId: number): Promise<TaskAutomation | undefined>;
  createTaskAutomation(automation: InsertTaskAutomation): Promise<TaskAutomation>;
  updateTaskAutomation(id: number, automation: Partial<InsertTaskAutomation>): Promise<TaskAutomation | undefined>;
  deleteTaskAutomation(id: number): Promise<void>;
  getPendingAutomations(userId: string): Promise<TaskAutomation[]>;

  // Office operations (Public Storefront)
  getPublishedOffices(): Promise<Office[]>;
  getOffices(ownerId?: string): Promise<Office[]>;
  getOffice(id: number): Promise<Office | undefined>;
  getOfficeBySlug(slug: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(id: number, office: Partial<InsertOffice>): Promise<Office | undefined>;
  deleteOffice(id: number): Promise<void>;

  // Company Department operations (hierarchical structure)
  getCompanyDepartments(officeId: number): Promise<CompanyDepartment[]>;
  getCompanyDepartment(id: number): Promise<CompanyDepartment | undefined>;
  createCompanyDepartment(department: InsertCompanyDepartment): Promise<CompanyDepartment>;
  updateCompanyDepartment(id: number, department: Partial<InsertCompanyDepartment>): Promise<CompanyDepartment | undefined>;
  deleteCompanyDepartment(id: number): Promise<void>;

  // Company Section operations
  getCompanySections(departmentId: number): Promise<CompanySection[]>;
  getCompanySection(id: number): Promise<CompanySection | undefined>;
  createCompanySection(section: InsertCompanySection): Promise<CompanySection>;
  updateCompanySection(id: number, section: Partial<InsertCompanySection>): Promise<CompanySection | undefined>;
  deleteCompanySection(id: number): Promise<void>;

  // Office Service operations
  getOfficeServices(officeId: number): Promise<OfficeService[]>;
  getOfficeService(id: number): Promise<OfficeService | undefined>;
  createOfficeService(service: InsertOfficeService): Promise<OfficeService>;
  updateOfficeService(id: number, service: Partial<InsertOfficeService>): Promise<OfficeService | undefined>;
  deleteOfficeService(id: number): Promise<void>;

  // Service Rating operations
  getServiceRatings(serviceId: number): Promise<ServiceRating[]>;
  getServiceAverageRating(serviceId: number): Promise<{ average: number; count: number }>;
  createServiceRating(rating: InsertServiceRating): Promise<ServiceRating>;

  // Service Comment operations
  getServiceComments(serviceId: number): Promise<ServiceComment[]>;
  createServiceComment(comment: InsertServiceComment): Promise<ServiceComment>;
  updateServiceCommentStatus(id: number, status: string): Promise<ServiceComment | undefined>;

  // Office Media operations
  getOfficeMedia(officeId: number): Promise<OfficeMedia[]>;
  getDailyVideos(): Promise<OfficeMedia[]>;
  getAnnouncements(): Promise<OfficeMedia[]>;
  createOfficeMedia(media: InsertOfficeMedia): Promise<OfficeMedia>;
  deleteOfficeMedia(id: number): Promise<void>;
  incrementMediaViews(id: number): Promise<void>;

  // Office Post operations
  getOfficePosts(officeId: number): Promise<OfficePost[]>;
  getAllOfficePosts(): Promise<OfficePost[]>;
  createOfficePost(post: InsertOfficePost): Promise<OfficePost>;
  deleteOfficePost(id: number): Promise<void>;
  likeOfficePost(id: number): Promise<void>;

  // Office Message (Chat) operations
  getOfficeMessages(officeId: number, sessionId?: string): Promise<OfficeMessage[]>;
  createOfficeMessage(message: InsertOfficeMessage): Promise<OfficeMessage>;
  markOfficeMessagesRead(officeId: number, sessionId: string): Promise<void>;
  getUnreadMessageCount(officeId: number): Promise<number>;

  // Video Call operations
  getVideoCall(id: number): Promise<VideoCall | undefined>;
  getVideoCallByRoom(roomId: string): Promise<VideoCall | undefined>;
  getVideoCallsByOffice(officeId: number): Promise<VideoCall[]>;
  getPendingVideoCallsForOffice(officeId: number): Promise<VideoCall[]>;
  createVideoCall(call: InsertVideoCall): Promise<VideoCall>;
  updateVideoCall(id: number, data: Partial<InsertVideoCall>): Promise<VideoCall | undefined>;
  startVideoCall(id: number, receptionistId: string): Promise<VideoCall | undefined>;
  endVideoCall(id: number): Promise<VideoCall | undefined>;

  // Daily Status (Stories) operations
  getActiveStatuses(): Promise<Status[]>;
  getStatus(id: number): Promise<Status | undefined>;
  getStatusesByAuthor(authorId: string): Promise<Status[]>;
  getStatusesByOffice(officeId: number): Promise<Status[]>;
  createStatus(status: InsertStatus): Promise<Status>;
  deleteStatus(id: number): Promise<void>;
  incrementStatusViews(id: number): Promise<void>;

  // Status Reply operations
  getStatusReplies(statusId: number): Promise<StatusReply[]>;
  createStatusReply(reply: InsertStatusReply): Promise<StatusReply>;
  markStatusRepliesRead(statusId: number): Promise<void>;
  getUnreadStatusRepliesCount(authorId: string): Promise<number>;

  // Status View operations
  getStatusViews(statusId: number): Promise<StatusView[]>;
  addStatusView(view: InsertStatusView): Promise<StatusView>;
  hasUserViewedStatus(statusId: number, userId: string): Promise<boolean>;

  // Status Like operations
  getStatusLike(statusId: number, userId: string): Promise<StatusLike | undefined>;
  createStatusLike(like: InsertStatusLike): Promise<StatusLike>;
  deleteStatusLike(statusId: number, userId: string): Promise<boolean>;
  getStatusLikeCount(statusId: number): Promise<number>;
  hasUserLikedStatus(statusId: number, userId: string): Promise<boolean>;

  // Office Follow operations
  followOffice(officeId: number, followerId: string): Promise<OfficeFollower>;
  unfollowOffice(officeId: number, followerId: string): Promise<void>;
  isFollowingOffice(officeId: number, userId: string): Promise<boolean>;
  getOfficeFollowerCount(officeId: number): Promise<number>;

  // Internal Email operations
  getInboxEmails(userId: string): Promise<InternalEmail[]>;
  getSentEmails(userId: string): Promise<InternalEmail[]>;
  getDraftEmails(userId: string): Promise<InternalEmail[]>;
  getStarredEmails(userId: string): Promise<InternalEmail[]>;
  getArchivedEmails(userId: string): Promise<InternalEmail[]>;
  getInternalEmail(id: number): Promise<InternalEmail | undefined>;
  createInternalEmail(email: InsertInternalEmail): Promise<InternalEmail>;
  updateInternalEmail(id: number, email: Partial<InsertInternalEmail>): Promise<InternalEmail | undefined>;
  deleteInternalEmail(id: number): Promise<void>;
  markEmailAsRead(id: number): Promise<void>;
  toggleEmailStarred(id: number): Promise<void>;
  moveEmailToArchive(id: number): Promise<void>;
  getUnreadEmailCount(userId: string): Promise<number>;

  // Push Subscription operations
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string, userId: string): Promise<void>;
  deletePushSubscriptionsByUser(userId: string): Promise<void>;

  // Employee Documents operations
  getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]>;
  getEmployeeDocument(id: number): Promise<EmployeeDocument | undefined>;
  createEmployeeDocument(doc: InsertEmployeeDocument): Promise<EmployeeDocument>;
  deleteEmployeeDocument(id: number): Promise<void>;

  // Stories operations (24-hour content)
  getActiveStories(): Promise<Story[]>;
  getStoriesByUser(authorId: string): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  deleteStory(id: number): Promise<void>;
  incrementStoryViews(id: number): Promise<void>;
  deleteExpiredStories(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // =====================
  // User Operations
  // =====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName);
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status, lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastSeen(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // =====================
  // Task Operations
  // =====================
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(taskAutomations).where(eq(taskAutomations.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assigneeId, assigneeId));
  }

  // =====================
  // Ticket Operations
  // =====================
  async getTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updated] = await db
      .update(tickets)
      .set({ ...ticket, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // =====================
  // Profile Operations
  // =====================
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByOwner(ownerId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.ownerId, ownerId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return updated;
  }

  async getOrCreateProfile(ownerId: string): Promise<Profile> {
    let profile = await this.getProfileByOwner(ownerId);
    if (!profile) {
      profile = await this.createProfile({ ownerId });
    }
    return profile;
  }

  // =====================
  // Follower Operations
  // =====================
  async followProfile(profileId: number, followerUserId: string): Promise<void> {
    await db.insert(followers).values({ profileId, followerUserId }).onConflictDoNothing();
  }

  async unfollowProfile(profileId: number, followerUserId: string): Promise<void> {
    await db
      .delete(followers)
      .where(and(eq(followers.profileId, profileId), eq(followers.followerUserId, followerUserId)));
  }

  async getFollowerCount(profileId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(followers)
      .where(eq(followers.profileId, profileId));
    return Number(result[0]?.count || 0);
  }

  async isFollowing(profileId: number, userId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(followers)
      .where(and(eq(followers.profileId, profileId), eq(followers.followerUserId, userId)));
    return !!follow;
  }

  // =====================
  // Profile Stats
  // =====================
  async getProfileStats(profileId: number): Promise<{ likes: number; followers: number; videos: number; photos: number }> {
    const followerCount = await this.getFollowerCount(profileId);
    const totalLikes = await this.getTotalLikesForProfile(profileId);

    const videoResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(eq(posts.profileId, profileId), eq(posts.mediaType, 'video')));
    const videos = Number(videoResult[0]?.count || 0);

    const photoResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(eq(posts.profileId, profileId), eq(posts.mediaType, 'image')));
    const photos = Number(photoResult[0]?.count || 0);

    return { likes: totalLikes, followers: followerCount, videos, photos };
  }

  async getTotalLikesForProfile(profileId: number): Promise<number> {
    const profilePosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.profileId, profileId));

    if (profilePosts.length === 0) return 0;

    const postIds = profilePosts.map(p => p.id);
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(postLikes)
      .where(sql`${postLikes.postId} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`);
    return Number(result[0]?.count || 0);
  }

  // =====================
  // Post Operations
  // =====================
  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPublicPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.scope, 'public'))
      .orderBy(desc(posts.createdAt));
  }

  async getProfilePosts(profileId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.profileId, profileId))
      .orderBy(desc(posts.createdAt));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(postComments).where(eq(postComments.postId, id));
    await db.delete(postLikes).where(eq(postLikes.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
  }

  async likePost(postId: number, userId: string): Promise<void> {
    await db.insert(postLikes).values({ postId, userId }).onConflictDoNothing();
  }

  async unlikePost(postId: number, userId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }

  async getPostLikes(postId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));
    return Number(result[0]?.count || 0);
  }

  async hasUserLikedPost(postId: number, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    return !!like;
  }

  async getPostComments(postId: number): Promise<PostComment[]> {
    return await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
  }

  async addPostComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db.insert(postComments).values(comment).returning();
    return newComment;
  }

  async deletePostComment(commentId: number, userId: string): Promise<void> {
    const [comment] = await db.select().from(postComments).where(eq(postComments.id, commentId));
    if (!comment) return;
    if (comment.authorId !== userId) {
      throw new Error("Not authorized");
    }
    await db.delete(postComments).where(eq(postComments.id, commentId));
  }

  // =====================
  // Chat Operations (WhatsApp-style)
  // =====================
  async getChatThreads(userId: string): Promise<ChatThread[]> {
    const participantThreads = await db
      .select({ threadId: chatParticipants.threadId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));

    const threadIds = participantThreads.map((p) => p.threadId);
    if (threadIds.length === 0) return [];

    return await db
      .select()
      .from(chatThreads)
      .where(inArray(chatThreads.id, threadIds))
      .orderBy(desc(chatThreads.updatedAt));
  }

  async getChatThread(id: number): Promise<ChatThread | undefined> {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    return thread;
  }

  async createChatThread(thread: InsertChatThread, participantIds: string[], creatorId: string): Promise<ChatThread> {
    const [newThread] = await db.insert(chatThreads).values({
      ...thread,
      creatorId,
    }).returning();

    const participants = participantIds.map((pUserId, index) => ({
      threadId: newThread.id,
      userId: pUserId,
      isAdmin: pUserId === creatorId,
    }));
    await db.insert(chatParticipants).values(participants);

    return newThread;
  }

  async getOrCreateGlobalChat(): Promise<ChatThread> {
    // Look for existing global chat (name = "Global Chat" and type = "global")
    const [existingGlobal] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.name, "Global Chat"));

    if (existingGlobal) {
      // Ensure all current users are participants
      const allUsers = await this.getAllUsers();
      const currentParticipants = await this.getThreadParticipants(existingGlobal.id);
      const currentParticipantIds = currentParticipants.map(p => p.id);

      for (const user of allUsers) {
        if (!currentParticipantIds.includes(user.id)) {
          await this.addThreadParticipant(existingGlobal.id, user.id);
        }
      }

      return existingGlobal;
    }

    // Create new global chat with all users
    const allUsers = await this.getAllUsers();
    const userIds = allUsers.map(u => u.id);
    const firstUserId = userIds[0] || 'system';

    const [newThread] = await db.insert(chatThreads).values({
      name: "Global Chat",
      type: "global",
      description: "Company-wide group chat for all employees",
    }).returning();

    if (userIds.length > 0) {
      const participants = userIds.map(userId => ({
        threadId: newThread.id,
        userId,
        isAdmin: false,
      }));
      await db.insert(chatParticipants).values(participants);
    }

    return newThread;
  }

  async createDirectChat(userId1: string, userId2: string): Promise<ChatThread> {
    // Check if direct chat already exists
    const existing = await this.getDirectChatBetweenUsers(userId1, userId2);
    if (existing) return existing;

    // Get both users for naming
    const user1 = await this.getUser(userId1);
    const user2 = await this.getUser(userId2);
    const name = `${user1?.firstName || user1?.email || 'User'} & ${user2?.firstName || user2?.email || 'User'}`;

    const [newThread] = await db.insert(chatThreads).values({
      name,
      type: "direct",
      creatorId: userId1,
    }).returning();

    await db.insert(chatParticipants).values([
      { threadId: newThread.id, userId: userId1, isAdmin: false },
      { threadId: newThread.id, userId: userId2, isAdmin: false },
    ]);

    return newThread;
  }

  async getDirectChatBetweenUsers(userId1: string, userId2: string): Promise<ChatThread | undefined> {
    // Find threads where both users are participants and type is "direct"
    const user1Threads = await db
      .select({ threadId: chatParticipants.threadId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId1));

    const user2Threads = await db
      .select({ threadId: chatParticipants.threadId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId2));

    const commonThreadIds = user1Threads
      .map(t => t.threadId)
      .filter(id => user2Threads.some(t => t.threadId === id));

    if (commonThreadIds.length === 0) return undefined;

    const [directThread] = await db
      .select()
      .from(chatThreads)
      .where(and(
        inArray(chatThreads.id, commonThreadIds),
        eq(chatThreads.type, "direct")
      ));

    return directThread;
  }

  async getMessages(threadId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();

    // Update thread's updatedAt and lastMessageId
    await db
      .update(chatThreads)
      .set({ updatedAt: new Date(), lastMessageId: newMessage.id })
      .where(eq(chatThreads.id, message.threadId));

    return newMessage;
  }

  async deleteMessage(messageId: number, userId: string): Promise<void> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
    if (!message) return;
    if (message.senderId !== userId) {
      throw new Error("Not authorized");
    }
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  async getThreadParticipants(threadId: number): Promise<User[]> {
    const participants = await db
      .select({ userId: chatParticipants.userId })
      .from(chatParticipants)
      .where(eq(chatParticipants.threadId, threadId));

    const userIds = participants.map(p => p.userId);
    if (userIds.length === 0) return [];

    return await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
  }

  async addThreadParticipant(threadId: number, userId: string, isAdmin: boolean = false): Promise<void> {
    await db.insert(chatParticipants).values({
      threadId,
      userId,
      isAdmin,
    }).onConflictDoNothing();
  }

  async removeThreadParticipant(threadId: number, userId: string): Promise<void> {
    await db.delete(chatParticipants).where(
      and(
        eq(chatParticipants.threadId, threadId),
        eq(chatParticipants.userId, userId)
      )
    );
  }

  async updateThread(threadId: number, data: Partial<InsertChatThread>): Promise<ChatThread | undefined> {
    const [updated] = await db
      .update(chatThreads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatThreads.id, threadId))
      .returning();
    return updated;
  }

  async getLastMessage(threadId: number): Promise<Message | undefined> {
    const [lastMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return lastMessage;
  }

  async getUnreadCount(threadId: number, userId: string): Promise<number> {
    const [participant] = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.threadId, threadId),
        eq(chatParticipants.userId, userId)
      ));

    if (!participant || !participant.lastReadMessageId) {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.threadId, threadId),
          sql`${messages.senderId} != ${userId}`
        ));
      return Number(result[0]?.count || 0);
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.threadId, threadId),
        sql`${messages.id} > ${participant.lastReadMessageId}`,
        sql`${messages.senderId} != ${userId}`
      ));
    return Number(result[0]?.count || 0);
  }

  async markMessagesRead(threadId: number, userId: string): Promise<void> {
    const lastMessage = await this.getLastMessage(threadId);
    if (lastMessage) {
      await db
        .update(chatParticipants)
        .set({ lastReadMessageId: lastMessage.id })
        .where(and(
          eq(chatParticipants.threadId, threadId),
          eq(chatParticipants.userId, userId)
        ));
    }
  }

  async deleteThread(threadId: number): Promise<void> {
    await db.delete(messages).where(eq(messages.threadId, threadId));
    await db.delete(chatParticipants).where(eq(chatParticipants.threadId, threadId));
    await db.delete(chatThreads).where(eq(chatThreads.id, threadId));
  }

  // =====================
  // Meeting Operations
  // =====================
  async getMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(meetings.startTime);
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting, attendeeIds: string[]): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();

    const attendees = attendeeIds.map((userId) => ({
      meetingId: newMeeting.id,
      userId,
    }));
    if (attendees.length > 0) {
      await db.insert(meetingAttendees).values(attendees);
    }

    return newMeeting;
  }

  async updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [updated] = await db
      .update(meetings)
      .set({ ...meeting, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return updated;
  }

  async deleteMeeting(id: number): Promise<void> {
    await db.delete(meetingAttendees).where(eq(meetingAttendees.meetingId, id));
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  async getMeetingAttendees(meetingId: number): Promise<User[]> {
    const attendeeRecords = await db
      .select({ userId: meetingAttendees.userId })
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, meetingId));

    const userIds = attendeeRecords.map((a) => a.userId);
    if (userIds.length === 0) return [];

    return await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
  }

  async getMeetingsForEmployee(employeeId: string): Promise<Meeting[]> {
    const attendeeRecords = await db
      .select({ meetingId: meetingAttendees.meetingId })
      .from(meetingAttendees)
      .where(eq(meetingAttendees.userId, employeeId));

    const meetingIds = attendeeRecords.map((a) => a.meetingId);
    if (meetingIds.length === 0) return [];

    return await db
      .select()
      .from(meetings)
      .where(inArray(meetings.id, meetingIds))
      .orderBy(desc(meetings.startTime));
  }

  async updateMeetingAttendeeStatus(meetingId: number, userId: string, status: string): Promise<void> {
    await db
      .update(meetingAttendees)
      .set({ status })
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.userId, userId)
      ));
  }

  async removeMeetingAttendee(meetingId: number, userId: string): Promise<void> {
    await db
      .delete(meetingAttendees)
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.userId, userId)
      ));
  }

  // =====================
  // Job Posting Operations
  // =====================
  async getJobPostings(): Promise<JobPosting[]> {
    return await db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt));
  }

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return job;
  }

  async createJobPosting(job: InsertJobPosting): Promise<JobPosting> {
    const [newJob] = await db.insert(jobPostings).values(job).returning();
    return newJob;
  }

  async updateJobPosting(id: number, job: Partial<InsertJobPosting>): Promise<JobPosting | undefined> {
    const [updated] = await db
      .update(jobPostings)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(jobPostings.id, id))
      .returning();
    return updated;
  }

  async deleteJobPosting(id: number): Promise<void> {
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
  }

  // =====================
  // Transaction Operations
  // =====================
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, "pending"))
      .orderBy(desc(transactions.createdAt));
  }

  // =====================
  // Role Operations
  // =====================
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db
      .update(roles)
      .set({ ...role, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updated;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.roleId, id));
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoleRecords = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    const roleIds = userRoleRecords.map((r) => r.roleId);
    if (roleIds.length === 0) return [];

    return await db
      .select()
      .from(roles)
      .where(inArray(roles.id, roleIds));
  }

  async assignRole(userId: string, roleId: number): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();
  }

  async removeRole(userId: string, roleId: number): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  // =====================
  // Notification Operations
  // =====================
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count || 0);
  }

  // =====================
  // Department Operations (Standalone)
  // =====================
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(desc(departments.createdAt));
  }

  async getDepartmentsByManager(managerId: string): Promise<Department[]> {
    return await db
      .select()
      .from(departments)
      .where(eq(departments.managerId, managerId))
      .orderBy(departments.name);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updated] = await db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }

  async deleteDepartment(id: number): Promise<void> {
    await db.delete(remoteEmployees).where(eq(remoteEmployees.departmentId, id));
    await db.delete(departments).where(eq(departments.id, id));
  }

  async verifyDepartmentPassword(id: number, password: string): Promise<boolean> {
    const dept = await this.getDepartment(id);
    if (!dept || !dept.password) return true;
    return dept.password === password;
  }

  // =====================
  // Remote Employee Operations
  // =====================
  async getAllRemoteEmployees(): Promise<RemoteEmployee[]> {
    return await db
      .select()
      .from(remoteEmployees)
      .orderBy(remoteEmployees.firstName);
  }

  async getRemoteEmployees(departmentId: number): Promise<RemoteEmployee[]> {
    return await db
      .select()
      .from(remoteEmployees)
      .where(eq(remoteEmployees.departmentId, departmentId))
      .orderBy(remoteEmployees.firstName);
  }

  async getRemoteEmployee(id: number): Promise<RemoteEmployee | undefined> {
    const [employee] = await db.select().from(remoteEmployees).where(eq(remoteEmployees.id, id));
    return employee;
  }

  async getRemoteEmployeeByUsername(username: string): Promise<RemoteEmployee | undefined> {
    const [employee] = await db.select().from(remoteEmployees).where(eq(remoteEmployees.username, username));
    return employee;
  }

  async getRemoteEmployeeByEmail(email: string): Promise<RemoteEmployee | undefined> {
    const [employee] = await db.select().from(remoteEmployees).where(eq(remoteEmployees.email, email.toLowerCase()));
    return employee;
  }

  async createRemoteEmployee(employee: InsertRemoteEmployee): Promise<RemoteEmployee> {
    const [newEmployee] = await db.insert(remoteEmployees).values(employee).returning();
    return newEmployee;
  }

  async updateRemoteEmployee(id: number, employee: Partial<InsertRemoteEmployee>): Promise<RemoteEmployee | undefined> {
    const [updated] = await db
      .update(remoteEmployees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(remoteEmployees.id, id))
      .returning();
    return updated;
  }

  async deleteRemoteEmployee(id: number): Promise<void> {
    await db.delete(remoteEmployees).where(eq(remoteEmployees.id, id));
  }

  // =====================
  // Subscription Operations
  // =====================
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByUser(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  // =====================
  // Advertisement Operations
  // =====================
  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  async getActiveAdvertisements(): Promise<Advertisement[]> {
    const now = new Date();
    return await db
      .select()
      .from(advertisements)
      .where(and(
        eq(advertisements.status, 'active'),
        sql`${advertisements.endDate} > ${now}`
      ))
      .orderBy(desc(advertisements.createdAt));
  }

  async getAdvertisementsByUser(userId: string): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.userId, userId))
      .orderBy(desc(advertisements.createdAt));
  }

  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    return ad;
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [newAd] = await db.insert(advertisements).values(ad).returning();
    return newAd;
  }

  async updateAdvertisement(id: number, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db
      .update(advertisements)
      .set({ ...ad, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return updated;
  }

  async deleteAdvertisement(id: number): Promise<void> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }

  async incrementAdViews(id: number): Promise<void> {
    await db
      .update(advertisements)
      .set({ views: sql`${advertisements.views} + 1` })
      .where(eq(advertisements.id, id));
  }

  async incrementAdClicks(id: number): Promise<void> {
    await db
      .update(advertisements)
      .set({ clicks: sql`${advertisements.clicks} + 1` })
      .where(eq(advertisements.id, id));
  }

  // =====================
  // n8n Settings Operations
  // =====================
  async getN8nSettings(userId: string): Promise<N8nSettings | undefined> {
    const [settings] = await db
      .select()
      .from(n8nSettings)
      .where(eq(n8nSettings.userId, userId));
    return settings;
  }

  async createN8nSettings(settings: InsertN8nSettings): Promise<N8nSettings> {
    const [newSettings] = await db.insert(n8nSettings).values(settings).returning();
    return newSettings;
  }

  async updateN8nSettings(userId: string, settings: Partial<InsertN8nSettings>): Promise<N8nSettings | undefined> {
    const [updated] = await db
      .update(n8nSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(n8nSettings.userId, userId))
      .returning();
    return updated;
  }

  // =====================
  // Task Automation Operations
  // =====================
  async getTaskAutomations(userId: string): Promise<TaskAutomation[]> {
    return await db
      .select()
      .from(taskAutomations)
      .where(eq(taskAutomations.userId, userId))
      .orderBy(desc(taskAutomations.createdAt));
  }

  async getTaskAutomation(id: number): Promise<TaskAutomation | undefined> {
    const [automation] = await db
      .select()
      .from(taskAutomations)
      .where(eq(taskAutomations.id, id));
    return automation;
  }

  async getTaskAutomationByTask(taskId: number): Promise<TaskAutomation | undefined> {
    const [automation] = await db
      .select()
      .from(taskAutomations)
      .where(eq(taskAutomations.taskId, taskId))
      .orderBy(desc(taskAutomations.createdAt))
      .limit(1);
    return automation;
  }

  async createTaskAutomation(automation: InsertTaskAutomation): Promise<TaskAutomation> {
    const [newAutomation] = await db.insert(taskAutomations).values(automation).returning();
    return newAutomation;
  }

  async updateTaskAutomation(id: number, automation: Partial<InsertTaskAutomation>): Promise<TaskAutomation | undefined> {
    const [updated] = await db
      .update(taskAutomations)
      .set({ ...automation, updatedAt: new Date() })
      .where(eq(taskAutomations.id, id))
      .returning();
    return updated;
  }

  async deleteTaskAutomation(id: number): Promise<void> {
    await db.delete(taskAutomations).where(eq(taskAutomations.id, id));
  }

  async getPendingAutomations(userId: string): Promise<TaskAutomation[]> {
    return await db
      .select()
      .from(taskAutomations)
      .where(and(
        eq(taskAutomations.userId, userId),
        eq(taskAutomations.status, 'ready')
      ))
      .orderBy(desc(taskAutomations.createdAt));
  }

  // =====================
  // Office Operations (Public Storefront)
  // =====================
  async getPublishedOffices(): Promise<Office[]> {
    return await db
      .select()
      .from(offices)
      .where(and(
        eq(offices.isPublished, true),
        eq(offices.subscriptionStatus, 'active')
      ))
      .orderBy(desc(offices.createdAt));
  }

  async getOffices(ownerId?: string): Promise<Office[]> {
    if (ownerId) {
      return await db
        .select()
        .from(offices)
        .where(eq(offices.ownerId, ownerId))
        .orderBy(desc(offices.createdAt));
    }
    return await db.select().from(offices).orderBy(desc(offices.createdAt));
  }

  async getOffice(id: number): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.id, id));
    return office;
  }

  async getOfficeBySlug(slug: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.slug, slug));
    return office;
  }

  async getOfficeByOwnerId(ownerId: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.ownerId, ownerId));
    return office;
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const [newOffice] = await db.insert(offices).values(office).returning();
    return newOffice;
  }

  async updateOffice(id: number, office: Partial<InsertOffice>): Promise<Office | undefined> {
    const [updated] = await db
      .update(offices)
      .set({ ...office, updatedAt: new Date() })
      .where(eq(offices.id, id))
      .returning();
    return updated;
  }

  async deleteOffice(id: number): Promise<void> {
    await db.delete(officeMessages).where(eq(officeMessages.officeId, id));
    await db.delete(officePosts).where(eq(officePosts.officeId, id));
    await db.delete(officeMedia).where(eq(officeMedia.officeId, id));
    const services = await db.select({ id: officeServices.id }).from(officeServices).where(eq(officeServices.officeId, id));
    for (const service of services) {
      await db.delete(serviceRatings).where(eq(serviceRatings.serviceId, service.id));
      await db.delete(serviceComments).where(eq(serviceComments.serviceId, service.id));
    }
    await db.delete(officeServices).where(eq(officeServices.officeId, id));
    // Delete company hierarchy (sections first, then departments)
    const departments = await db.select({ id: companyDepartments.id }).from(companyDepartments).where(eq(companyDepartments.officeId, id));
    for (const dept of departments) {
      await db.delete(companySections).where(eq(companySections.departmentId, dept.id));
    }
    await db.delete(companyDepartments).where(eq(companyDepartments.officeId, id));
    await db.delete(offices).where(eq(offices.id, id));
  }

  // =====================
  // Company Department Operations
  // =====================
  async getCompanyDepartments(officeId: number): Promise<CompanyDepartment[]> {
    return await db
      .select()
      .from(companyDepartments)
      .where(eq(companyDepartments.officeId, officeId))
      .orderBy(companyDepartments.sortOrder);
  }

  async getCompanyDepartment(id: number): Promise<CompanyDepartment | undefined> {
    const [department] = await db.select().from(companyDepartments).where(eq(companyDepartments.id, id));
    return department;
  }

  async createCompanyDepartment(department: InsertCompanyDepartment): Promise<CompanyDepartment> {
    const [newDepartment] = await db.insert(companyDepartments).values(department).returning();
    return newDepartment;
  }

  async updateCompanyDepartment(id: number, department: Partial<InsertCompanyDepartment>): Promise<CompanyDepartment | undefined> {
    const [updated] = await db
      .update(companyDepartments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(companyDepartments.id, id))
      .returning();
    return updated;
  }

  async deleteCompanyDepartment(id: number): Promise<void> {
    // Delete sections in this department first
    await db.delete(companySections).where(eq(companySections.departmentId, id));
    await db.delete(companyDepartments).where(eq(companyDepartments.id, id));
  }

  // =====================
  // Company Section Operations
  // =====================
  async getCompanySections(departmentId: number): Promise<CompanySection[]> {
    return await db
      .select()
      .from(companySections)
      .where(eq(companySections.departmentId, departmentId))
      .orderBy(companySections.sortOrder);
  }

  async getCompanySection(id: number): Promise<CompanySection | undefined> {
    const [section] = await db.select().from(companySections).where(eq(companySections.id, id));
    return section;
  }

  async createCompanySection(section: InsertCompanySection): Promise<CompanySection> {
    const [newSection] = await db.insert(companySections).values(section).returning();
    return newSection;
  }

  async updateCompanySection(id: number, section: Partial<InsertCompanySection>): Promise<CompanySection | undefined> {
    const [updated] = await db
      .update(companySections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(companySections.id, id))
      .returning();
    return updated;
  }

  async deleteCompanySection(id: number): Promise<void> {
    await db.delete(companySections).where(eq(companySections.id, id));
  }

  // =====================
  // Office Service Operations
  // =====================
  async getAllPublicServices(): Promise<(OfficeService & { officeName: string; officeSlug: string | null })[]> {
    const result = await db
      .select({
        id: officeServices.id,
        officeId: officeServices.officeId,
        title: officeServices.title,
        description: officeServices.description,
        price: officeServices.price,
        priceType: officeServices.priceType,
        category: officeServices.category,
        imageUrl: officeServices.imageUrl,
        isFeatured: officeServices.isFeatured,
        isActive: officeServices.isActive,
        sortOrder: officeServices.sortOrder,
        createdAt: officeServices.createdAt,
        updatedAt: officeServices.updatedAt,
        officeName: offices.name,
        officeSlug: offices.slug,
      })
      .from(officeServices)
      .innerJoin(offices, eq(officeServices.officeId, offices.id))
      .where(and(eq(officeServices.isActive, true), eq(offices.isPublished, true)))
      .orderBy(desc(officeServices.isFeatured), officeServices.sortOrder);
    return result;
  }

  async getOfficeServices(officeId: number): Promise<OfficeService[]> {
    return await db
      .select()
      .from(officeServices)
      .where(eq(officeServices.officeId, officeId))
      .orderBy(officeServices.sortOrder);
  }

  async getOfficeService(id: number): Promise<OfficeService | undefined> {
    const [service] = await db.select().from(officeServices).where(eq(officeServices.id, id));
    return service;
  }

  async createOfficeService(service: InsertOfficeService): Promise<OfficeService> {
    const [newService] = await db.insert(officeServices).values(service).returning();
    return newService;
  }

  async updateOfficeService(id: number, service: Partial<InsertOfficeService>): Promise<OfficeService | undefined> {
    const [updated] = await db
      .update(officeServices)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(officeServices.id, id))
      .returning();
    return updated;
  }

  async deleteOfficeService(id: number): Promise<void> {
    await db.delete(serviceRatings).where(eq(serviceRatings.serviceId, id));
    await db.delete(serviceComments).where(eq(serviceComments.serviceId, id));
    await db.delete(officeServices).where(eq(officeServices.id, id));
  }

  // =====================
  // Service Rating Operations
  // =====================
  async getServiceRatings(serviceId: number): Promise<ServiceRating[]> {
    return await db
      .select()
      .from(serviceRatings)
      .where(eq(serviceRatings.serviceId, serviceId))
      .orderBy(desc(serviceRatings.createdAt));
  }

  async getServiceAverageRating(serviceId: number): Promise<{ average: number; count: number }> {
    const result = await db
      .select({
        average: sql<number>`COALESCE(AVG(${serviceRatings.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(serviceRatings)
      .where(eq(serviceRatings.serviceId, serviceId));
    return {
      average: Number(result[0]?.average || 0),
      count: Number(result[0]?.count || 0),
    };
  }

  async createServiceRating(rating: InsertServiceRating): Promise<ServiceRating> {
    const [newRating] = await db.insert(serviceRatings).values(rating).returning();
    return newRating;
  }

  // =====================
  // Service Comment Operations
  // =====================
  async getServiceComments(serviceId: number): Promise<ServiceComment[]> {
    return await db
      .select()
      .from(serviceComments)
      .where(and(
        eq(serviceComments.serviceId, serviceId),
        eq(serviceComments.status, 'published')
      ))
      .orderBy(desc(serviceComments.createdAt));
  }

  async createServiceComment(comment: InsertServiceComment): Promise<ServiceComment> {
    const [newComment] = await db.insert(serviceComments).values(comment).returning();
    return newComment;
  }

  async updateServiceCommentStatus(id: number, status: string): Promise<ServiceComment | undefined> {
    const [updated] = await db
      .update(serviceComments)
      .set({ status })
      .where(eq(serviceComments.id, id))
      .returning();
    return updated;
  }

  // =====================
  // Office Media Operations
  // =====================
  async getOfficeMedia(officeId: number): Promise<OfficeMedia[]> {
    return await db
      .select()
      .from(officeMedia)
      .where(eq(officeMedia.officeId, officeId))
      .orderBy(desc(officeMedia.createdAt));
  }

  async getDailyVideos(): Promise<OfficeMedia[]> {
    const now = new Date();
    return await db
      .select()
      .from(officeMedia)
      .where(and(
        eq(officeMedia.type, 'video'),
        or(
          sql`${officeMedia.expiresAt} IS NULL`,
          sql`${officeMedia.expiresAt} > ${now}`
        )
      ))
      .orderBy(desc(officeMedia.createdAt));
  }

  async getAnnouncements(): Promise<OfficeMedia[]> {
    return await db
      .select()
      .from(officeMedia)
      .where(eq(officeMedia.type, 'announcement'))
      .orderBy(desc(officeMedia.createdAt))
      .limit(20);
  }

  async createOfficeMedia(media: InsertOfficeMedia): Promise<OfficeMedia> {
    const [newMedia] = await db.insert(officeMedia).values(media).returning();
    return newMedia;
  }

  async deleteOfficeMedia(id: number): Promise<void> {
    await db.delete(officeMedia).where(eq(officeMedia.id, id));
  }

  async incrementMediaViews(id: number): Promise<void> {
    await db
      .update(officeMedia)
      .set({ views: sql`${officeMedia.views} + 1` })
      .where(eq(officeMedia.id, id));
  }

  // =====================
  // Office Post Operations
  // =====================
  async getOfficePosts(officeId: number): Promise<OfficePost[]> {
    return await db
      .select()
      .from(officePosts)
      .where(eq(officePosts.officeId, officeId))
      .orderBy(desc(officePosts.createdAt));
  }

  async getAllOfficePosts(): Promise<OfficePost[]> {
    return await db
      .select()
      .from(officePosts)
      .orderBy(desc(officePosts.createdAt))
      .limit(50);
  }

  async createOfficePost(post: InsertOfficePost): Promise<OfficePost> {
    const [newPost] = await db.insert(officePosts).values(post).returning();
    return newPost;
  }

  async deleteOfficePost(id: number): Promise<void> {
    await db.delete(officePosts).where(eq(officePosts.id, id));
  }

  async likeOfficePost(id: number): Promise<void> {
    await db
      .update(officePosts)
      .set({ likes: sql`${officePosts.likes} + 1` })
      .where(eq(officePosts.id, id));
  }

  // =====================
  // Office Message Operations
  // =====================
  async getOfficeMessages(officeId: number, sessionId?: string): Promise<OfficeMessage[]> {
    if (sessionId) {
      return await db
        .select()
        .from(officeMessages)
        .where(and(
          eq(officeMessages.officeId, officeId),
          eq(officeMessages.sessionId, sessionId)
        ))
        .orderBy(officeMessages.createdAt);
    }
    return await db
      .select()
      .from(officeMessages)
      .where(eq(officeMessages.officeId, officeId))
      .orderBy(officeMessages.createdAt);
  }

  async createOfficeMessage(message: InsertOfficeMessage): Promise<OfficeMessage> {
    const [newMessage] = await db.insert(officeMessages).values(message).returning();
    return newMessage;
  }

  async markOfficeMessagesRead(officeId: number, sessionId: string): Promise<void> {
    await db
      .update(officeMessages)
      .set({ isRead: true })
      .where(and(
        eq(officeMessages.officeId, officeId),
        eq(officeMessages.sessionId, sessionId)
      ));
  }

  async getUnreadMessageCount(officeId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(officeMessages)
      .where(and(
        eq(officeMessages.officeId, officeId),
        eq(officeMessages.isRead, false)
      ));
    return Number(result[0]?.count || 0);
  }

  // =====================
  // Video Call Operations
  // =====================
  async getVideoCall(id: number): Promise<VideoCall | undefined> {
    const [call] = await db.select().from(videoCalls).where(eq(videoCalls.id, id));
    return call;
  }

  async getVideoCallByRoom(roomId: string): Promise<VideoCall | undefined> {
    const [call] = await db.select().from(videoCalls).where(eq(videoCalls.roomId, roomId));
    return call;
  }

  async getVideoCallsByOffice(officeId: number): Promise<VideoCall[]> {
    return await db
      .select()
      .from(videoCalls)
      .where(eq(videoCalls.officeId, officeId))
      .orderBy(desc(videoCalls.createdAt));
  }

  async getPendingVideoCallsForOffice(officeId: number): Promise<VideoCall[]> {
    return await db
      .select()
      .from(videoCalls)
      .where(and(
        eq(videoCalls.officeId, officeId),
        eq(videoCalls.status, 'pending')
      ))
      .orderBy(videoCalls.createdAt);
  }

  async createVideoCall(call: InsertVideoCall): Promise<VideoCall> {
    const [newCall] = await db.insert(videoCalls).values(call).returning();
    return newCall;
  }

  async updateVideoCall(id: number, data: Partial<InsertVideoCall>): Promise<VideoCall | undefined> {
    const [updated] = await db
      .update(videoCalls)
      .set(data)
      .where(eq(videoCalls.id, id))
      .returning();
    return updated;
  }

  async startVideoCall(id: number, receptionistId: string): Promise<VideoCall | undefined> {
    const [updated] = await db
      .update(videoCalls)
      .set({
        status: 'active',
        receptionistId,
        startedAt: new Date()
      })
      .where(eq(videoCalls.id, id))
      .returning();
    return updated;
  }

  async endVideoCall(id: number): Promise<VideoCall | undefined> {
    const [updated] = await db
      .update(videoCalls)
      .set({
        status: 'ended',
        endedAt: new Date()
      })
      .where(eq(videoCalls.id, id))
      .returning();
    return updated;
  }

  // =====================
  // Service Request Operations
  // =====================
  async getServiceRequests(officeId: number): Promise<ServiceRequest[]> {
    return await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.officeId, officeId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request;
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [newRequest] = await db.insert(serviceRequests).values(request).returning();
    return newRequest;
  }

  async updateServiceRequest(id: number, data: Partial<InsertServiceRequest>): Promise<ServiceRequest | undefined> {
    const [updated] = await db
      .update(serviceRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return updated;
  }

  // =====================
  // Daily Status (Stories) Operations
  // =====================
  async getActiveStatuses(): Promise<Status[]> {
    const now = new Date();
    return await db
      .select()
      .from(statuses)
      .where(sql`${statuses.expiresAt} > ${now}`)
      .orderBy(desc(statuses.createdAt));
  }

  async getStatus(id: number): Promise<Status | undefined> {
    const [status] = await db.select().from(statuses).where(eq(statuses.id, id));
    return status;
  }

  async getStatusesByAuthor(authorId: string): Promise<Status[]> {
    return await db
      .select()
      .from(statuses)
      .where(eq(statuses.authorId, authorId))
      .orderBy(desc(statuses.createdAt));
  }

  async getStatusesByOffice(officeId: number): Promise<Status[]> {
    return await db
      .select()
      .from(statuses)
      .where(eq(statuses.officeId, officeId))
      .orderBy(desc(statuses.createdAt));
  }

  async createStatus(status: InsertStatus): Promise<Status> {
    const [newStatus] = await db.insert(statuses).values(status).returning();
    return newStatus;
  }

  async deleteStatus(id: number): Promise<void> {
    await db.delete(statuses).where(eq(statuses.id, id));
  }

  async incrementStatusViews(id: number): Promise<void> {
    await db
      .update(statuses)
      .set({ viewCount: sql`${statuses.viewCount} + 1` })
      .where(eq(statuses.id, id));
  }

  // =====================
  // Status Reply Operations
  // =====================
  async getStatusReplies(statusId: number): Promise<StatusReply[]> {
    return await db
      .select()
      .from(statusReplies)
      .where(eq(statusReplies.statusId, statusId))
      .orderBy(statusReplies.createdAt);
  }

  async createStatusReply(reply: InsertStatusReply): Promise<StatusReply> {
    const [newReply] = await db.insert(statusReplies).values(reply).returning();
    return newReply;
  }

  async markStatusRepliesRead(statusId: number): Promise<void> {
    await db
      .update(statusReplies)
      .set({ isRead: true })
      .where(eq(statusReplies.statusId, statusId));
  }

  async getUnreadStatusRepliesCount(authorId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(statusReplies)
      .innerJoin(statuses, eq(statusReplies.statusId, statuses.id))
      .where(and(
        eq(statuses.authorId, authorId),
        eq(statusReplies.isRead, false)
      ));
    return Number(result[0]?.count || 0);
  }

  // =====================
  // Status View Operations
  // =====================
  async getStatusViews(statusId: number): Promise<StatusView[]> {
    return await db
      .select()
      .from(statusViews)
      .where(eq(statusViews.statusId, statusId))
      .orderBy(desc(statusViews.viewedAt));
  }

  async addStatusView(view: InsertStatusView): Promise<StatusView> {
    const [newView] = await db.insert(statusViews).values(view).returning();
    return newView;
  }

  async hasUserViewedStatus(statusId: number, userId: string): Promise<boolean> {
    const [view] = await db
      .select()
      .from(statusViews)
      .where(and(
        eq(statusViews.statusId, statusId),
        eq(statusViews.viewerId, userId)
      ));
    return !!view;
  }

  // =====================
  // Status Like Operations
  // =====================
  async getStatusLike(statusId: number, userId: string): Promise<StatusLike | undefined> {
    const [like] = await db
      .select()
      .from(statusLikes)
      .where(and(
        eq(statusLikes.statusId, statusId),
        eq(statusLikes.userId, userId)
      ));
    return like;
  }

  async createStatusLike(like: InsertStatusLike): Promise<StatusLike> {
    const [newLike] = await db.insert(statusLikes).values(like).returning();
    return newLike;
  }

  async deleteStatusLike(statusId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(statusLikes)
      .where(and(
        eq(statusLikes.statusId, statusId),
        eq(statusLikes.userId, userId)
      ));
    return true;
  }

  async getStatusLikeCount(statusId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(statusLikes)
      .where(eq(statusLikes.statusId, statusId));
    return Number(result[0]?.count || 0);
  }

  async hasUserLikedStatus(statusId: number, userId: string): Promise<boolean> {
    const like = await this.getStatusLike(statusId, userId);
    return !!like;
  }

  // =====================
  // Office Follow Operations
  // =====================
  async followOffice(officeId: number, followerId: string): Promise<OfficeFollower> {
    const [follower] = await db
      .insert(officeFollowers)
      .values({ officeId, followerId })
      .returning();
    return follower;
  }

  async unfollowOffice(officeId: number, followerId: string): Promise<void> {
    await db
      .delete(officeFollowers)
      .where(and(
        eq(officeFollowers.officeId, officeId),
        eq(officeFollowers.followerId, followerId)
      ));
  }

  async isFollowingOffice(officeId: number, userId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(officeFollowers)
      .where(and(
        eq(officeFollowers.officeId, officeId),
        eq(officeFollowers.followerId, userId)
      ));
    return !!follow;
  }

  async getOfficeFollowerCount(officeId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(officeFollowers)
      .where(eq(officeFollowers.officeId, officeId));
    return Number(result[0]?.count || 0);
  }

  // =====================
  // Internal Email Operations
  // =====================
  async getInboxEmails(userId: string): Promise<InternalEmail[]> {
    return await db
      .select()
      .from(internalEmails)
      .where(and(
        eq(internalEmails.recipientId, userId),
        eq(internalEmails.isDeleted, false),
        eq(internalEmails.isDraft, false),
        eq(internalEmails.isArchived, false)
      ))
      .orderBy(desc(internalEmails.createdAt));
  }

  async getSentEmails(userId: string): Promise<InternalEmail[]> {
    return await db
      .select()
      .from(internalEmails)
      .where(and(
        eq(internalEmails.senderId, userId),
        eq(internalEmails.isDeleted, false),
        eq(internalEmails.isDraft, false)
      ))
      .orderBy(desc(internalEmails.createdAt));
  }

  async getDraftEmails(userId: string): Promise<InternalEmail[]> {
    return await db
      .select()
      .from(internalEmails)
      .where(and(
        eq(internalEmails.senderId, userId),
        eq(internalEmails.isDraft, true),
        eq(internalEmails.isDeleted, false)
      ))
      .orderBy(desc(internalEmails.createdAt));
  }

  async getStarredEmails(userId: string): Promise<InternalEmail[]> {
    return await db
      .select()
      .from(internalEmails)
      .where(and(
        or(
          eq(internalEmails.senderId, userId),
          eq(internalEmails.recipientId, userId)
        ),
        eq(internalEmails.isStarred, true),
        eq(internalEmails.isDeleted, false)
      ))
      .orderBy(desc(internalEmails.createdAt));
  }

  async getArchivedEmails(userId: string): Promise<InternalEmail[]> {
    return await db
      .select()
      .from(internalEmails)
      .where(and(
        or(
          eq(internalEmails.senderId, userId),
          eq(internalEmails.recipientId, userId)
        ),
        eq(internalEmails.isArchived, true),
        eq(internalEmails.isDeleted, false)
      ))
      .orderBy(desc(internalEmails.createdAt));
  }

  async getInternalEmail(id: number): Promise<InternalEmail | undefined> {
    const [email] = await db
      .select()
      .from(internalEmails)
      .where(eq(internalEmails.id, id));
    return email;
  }

  async createInternalEmail(email: InsertInternalEmail): Promise<InternalEmail> {
    const [newEmail] = await db.insert(internalEmails).values(email).returning();
    return newEmail;
  }

  async updateInternalEmail(id: number, email: Partial<InsertInternalEmail>): Promise<InternalEmail | undefined> {
    const [updated] = await db
      .update(internalEmails)
      .set({ ...email, updatedAt: new Date() })
      .where(eq(internalEmails.id, id))
      .returning();
    return updated;
  }

  async deleteInternalEmail(id: number): Promise<void> {
    await db
      .update(internalEmails)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(internalEmails.id, id));
  }

  async markEmailAsRead(id: number): Promise<void> {
    await db
      .update(internalEmails)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(internalEmails.id, id));
  }

  async toggleEmailStarred(id: number): Promise<void> {
    const email = await this.getInternalEmail(id);
    if (email) {
      await db
        .update(internalEmails)
        .set({ isStarred: !email.isStarred, updatedAt: new Date() })
        .where(eq(internalEmails.id, id));
    }
  }

  async moveEmailToArchive(id: number): Promise<void> {
    await db
      .update(internalEmails)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(internalEmails.id, id));
  }

  async getUnreadEmailCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(internalEmails)
      .where(and(
        eq(internalEmails.recipientId, userId),
        eq(internalEmails.isRead, false),
        eq(internalEmails.isDeleted, false),
        eq(internalEmails.isDraft, false)
      ));
    return Number(result[0]?.count || 0);
  }

  // =====================
  // Push Subscription Operations
  // =====================
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    // Check if subscription with same endpoint already exists
    const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    if (existing.length > 0) {
      // Update existing subscription
      const [updated] = await db
        .update(pushSubscriptions)
        .set({ ...subscription, updatedAt: new Date() })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .returning();
      return updated;
    }
    const [newSubscription] = await db.insert(pushSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async deletePushSubscription(endpoint: string, userId: string): Promise<void> {
    await db.delete(pushSubscriptions).where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, userId)
      )
    );
  }

  async deletePushSubscriptionsByUser(userId: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  // =====================
  // Employee Documents Operations
  // =====================
  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return await db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(desc(employeeDocuments.createdAt));
  }

  async getEmployeeDocument(id: number): Promise<EmployeeDocument | undefined> {
    const [doc] = await db.select().from(employeeDocuments).where(eq(employeeDocuments.id, id));
    return doc;
  }

  async createEmployeeDocument(doc: InsertEmployeeDocument): Promise<EmployeeDocument> {
    const [newDoc] = await db.insert(employeeDocuments).values(doc).returning();
    return newDoc;
  }

  async deleteEmployeeDocument(id: number): Promise<void> {
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
  }

  // =====================
  // Services Operations (Service Sales System)
  // =====================
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(desc(services.createdAt));
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServiceByShareToken(token: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.shareToken, token));
    return service;
  }

  async getServicesByOwner(ownerId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.ownerUserId, ownerId))
      .orderBy(desc(services.createdAt));
  }

  async getServicesByOffice(officeId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.officeId, officeId))
      .orderBy(desc(services.createdAt));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, data: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // =====================
  // Service Orders Operations
  // =====================
  async getServiceOrder(id: number): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
    return order;
  }

  async getServiceOrdersByOwner(ownerId: string): Promise<ServiceOrder[]> {
    const ownerServices = await this.getServicesByOwner(ownerId);
    const serviceIds = ownerServices.map(s => s.id);

    if (serviceIds.length === 0) return [];

    return await db
      .select()
      .from(serviceOrders)
      .where(inArray(serviceOrders.serviceId, serviceIds))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async getServiceOrdersByService(serviceId: number): Promise<ServiceOrder[]> {
    return await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.serviceId, serviceId))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder> {
    const [newOrder] = await db.insert(serviceOrders).values(order).returning();
    return newOrder;
  }

  async updateServiceOrder(id: number, data: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> {
    const [updated] = await db
      .update(serviceOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceOrders.id, id))
      .returning();
    return updated;
  }

  // =====================
  // Stories Operations (24-hour content)
  // =====================
  async getActiveStories(): Promise<(Story & { author?: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]> {
    const now = new Date();
    const activeStories = await db
      .select({
        id: stories.id,
        authorId: stories.authorId,
        mediaUrl: stories.mediaUrl,
        mediaType: stories.mediaType,
        caption: stories.caption,
        viewCount: stories.viewCount,
        expiresAt: stories.expiresAt,
        createdAt: stories.createdAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorProfileImageUrl: users.profileImageUrl,
      })
      .from(stories)
      .leftJoin(users, eq(stories.authorId, users.id))
      .where(sql`${stories.expiresAt} > ${now}`)
      .orderBy(desc(stories.createdAt));

    return activeStories.map(s => ({
      id: s.id,
      authorId: s.authorId,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      viewCount: s.viewCount,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      author: {
        firstName: s.authorFirstName,
        lastName: s.authorLastName,
        profileImageUrl: s.authorProfileImageUrl,
      }
    }));
  }

  async getStoriesByUser(authorId: string): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.authorId, authorId))
      .orderBy(desc(stories.createdAt));
  }

  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  async deleteStory(id: number): Promise<void> {
    await db.delete(storyViews).where(eq(storyViews.storyId, id));
    await db.delete(stories).where(eq(stories.id, id));
  }

  async incrementStoryViews(id: number): Promise<void> {
    await db
      .update(stories)
      .set({ viewCount: sql`${stories.viewCount} + 1` })
      .where(eq(stories.id, id));
  }

  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    const expiredStories = await db
      .select({ id: stories.id })
      .from(stories)
      .where(sql`${stories.expiresAt} <= ${now}`);

    for (const story of expiredStories) {
      await this.deleteStory(story.id);
    }
  }
}

export const storage = new DatabaseStorage();
