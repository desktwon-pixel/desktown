import type { Express } from "express";
import { type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage.ts";
import { setupAuth, isAuthenticated } from "./replitAuth.ts";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage.ts";
import { ObjectPermission } from "./objectAcl.ts";
import {
  insertTaskSchema,
  insertTicketSchema,
  insertPostSchema,
  insertPostCommentSchema,
  insertChatThreadSchema,
  insertMessageSchema,
  insertMeetingSchema,
  insertJobPostingSchema,
  insertTransactionSchema,
  insertRoleSchema,
  updateUserSchema,
  insertSubscriptionSchema,
  insertAdvertisementSchema,
  insertN8nSettingsSchema,
  insertTaskAutomationSchema,
  insertOfficeSchema,
  insertOfficeServiceSchema,
  insertServiceRatingSchema,
  insertServiceCommentSchema,
  insertOfficeMediaSchema,
  insertOfficePostSchema,
  insertOfficeMessageSchema,
  insertVideoCallSchema,
  insertStatusSchema,
  insertStatusReplySchema,
  insertInternalEmailSchema,
  insertServiceSchema,
  insertServiceOrderSchema,
  insertCompanyDepartmentSchema,
  insertCompanySectionSchema,
  type InsertTask,
} from "../shared/schema.ts";
import { z } from "zod";

// Video call validation schemas
const videoCallRequestSchema = z.object({
  sessionId: z.string().min(10, "Session ID must be at least 10 characters"),
  visitorName: z.string().max(100).nullable().optional(),
});

const videoCallEndSchema = z.object({
  sessionId: z.string().min(10, "Session ID must be at least 10 characters"),
});

const roomIdSchema = z.string().regex(/^room_[a-f0-9]{32}$/, "Invalid room ID format");

// Shared param schemas for authenticated routes
const officeIdParamSchema = z.coerce.number().int().positive("Office ID must be a positive integer");
const callIdParamSchema = z.coerce.number().int().positive("Call ID must be a positive integer");

// Role-based access control middleware
type UserRole = "member" | "manager" | "admin";

function requireRole(...allowedRoles: UserRole[]) {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let userRole: UserRole = "member";
      
      try {
        const user = await storage.getUser(req.user.claims.sub);
        userRole = (user?.role || "member") as UserRole;
      } catch (err) {
        console.warn("Database role check failed, falling back to claims:", err);
        // Fallback to claims for mock auth or when DB is down
        userRole = (req.user.claims.role || "member") as UserRole;
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
          required: allowedRoles,
          current: userRole
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Failed to verify permissions" });
    }
  };
}

// Employee Portal Session Management
// Simple token-based authentication for the employee portal
interface EmployeeSession {
  userId: string;
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const employeeSessions = new Map<string, EmployeeSession>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function cleanExpiredSessions() {
  const now = new Date();
  employeeSessions.forEach((session, token) => {
    if (session.expiresAt < now) {
      employeeSessions.delete(token);
    }
  });
}

// Clean expired sessions every 5 minutes
setInterval(cleanExpiredSessions, 5 * 60 * 1000);

async function validateEmployeeSession(req: any, res: any, next: any) {
  const token = req.headers['x-employee-token'] as string;

  if (!token) {
    return res.status(401).json({ message: "Employee authentication required" });
  }

  const session = employeeSessions.get(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  if (session.expiresAt < new Date()) {
    employeeSessions.delete(token);
    return res.status(401).json({ message: "Session expired" });
  }

  req.employeeSession = session;
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  app.get('/api/health', async (_req, res) => {
    try {
      await storage.getTasks().catch(() => { }); // Simple DB probe
      res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database unreachable' });
    }
  });

  // =====================
  // Auth Routes
  // =====================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Heartbeat endpoint to update user activity (lastSeenAt only, preserves manual status)
  app.post('/api/auth/heartbeat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateLastSeen(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating heartbeat:", error);
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // =====================
  // User Routes
  // =====================
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const allowedStatuses = ['online', 'offline', 'away', 'busy'];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: online, offline, away, busy" });
      }
      const user = await storage.updateUserStatus(req.params.id, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = updateUserSchema.parse(req.body);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // =====================
  // Task Routes
  // =====================
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { dueDate, ...restBody } = req.body;
      const data = insertTaskSchema.parse({
        ...restBody,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: req.user.claims.sub,
      });
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });

  const updateTaskSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["pending", "in_progress", "completed"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  }).strict();

  app.patch('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const validationResult = updateTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: validationResult.error.errors
        });
      }

      const { dueDate, ...restData } = validationResult.data;
      const updateData: Partial<InsertTask> = {
        ...restData,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      };

      const task = await storage.updateTask(taskId, updateData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTask(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Get tasks assigned to current user
  app.get('/api/me/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch your tasks" });
    }
  });

  // =====================
  // Employee Portal Routes (Token-based authentication)
  // =====================

  // Login endpoint - creates session token
  app.post('/api/employee/login', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      let user = await storage.getUserByEmail(email.toLowerCase());

      // DEV FALLBACK: Auto-create user if in dummy mode and not found
      const isDummy = process.env.REPL_ID?.toLowerCase().includes('dummy') ||
        process.env.REPL_ID?.toLowerCase().includes('render') ||
        !process.env.REPL_ID;

      if (!user && isDummy) {
        user = await storage.upsertUser({
          id: `dev-employee-${Date.now()}`,
          email: email.toLowerCase(),
          username: email.split('@')[0],
          firstName: "Employee",
          lastName: "User",
          role: "member",
          status: "online",
        });
      }

      if (!user) {
        return res.status(404).json({ message: "No employee found with this email" });
      }

      // Generate session token
      const token = generateToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours

      const session: EmployeeSession = {
        userId: user.id,
        email: email.toLowerCase(),
        token,
        createdAt: now,
        expiresAt,
      };

      employeeSessions.set(token, session);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("Error logging in employee:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout endpoint
  app.post('/api/employee/logout', validateEmployeeSession, async (req: any, res) => {
    try {
      employeeSessions.delete(req.employeeSession.token);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out employee:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get tasks for authenticated employee
  app.get('/api/employee/tasks', validateEmployeeSession, async (req: any, res) => {
    try {
      const tasks = await storage.getTasksByAssignee(req.employeeSession.userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get chat threads for authenticated employee
  app.get('/api/employee/threads', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const threads = await storage.getChatThreads(userId);

      const enhancedThreads = await Promise.all(threads.map(async (thread) => {
        const lastMessage = await storage.getLastMessage(thread.id);
        const unreadCount = await storage.getUnreadCount(thread.id, userId);
        const participants = await storage.getThreadParticipants(thread.id);

        return {
          ...thread,
          lastMessage,
          unreadCount,
          participants,
        };
      }));

      res.json(enhancedThreads);
    } catch (error) {
      console.error("Error fetching employee threads:", error);
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });

  // Get messages in a thread for authenticated employee
  app.get('/api/employee/threads/:id/messages', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const threadId = parseInt(req.params.id);

      // Verify user is a participant in this thread
      const participants = await storage.getThreadParticipants(threadId);
      if (!participants.some(p => p.id === userId)) {
        return res.status(403).json({ message: "Not authorized to view this thread" });
      }

      const threadMessages = await storage.getMessages(threadId);
      await storage.markMessagesRead(threadId, userId);

      res.json(threadMessages);
    } catch (error) {
      console.error("Error fetching employee messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message from authenticated employee (supports text, image, video, voice, file)
  app.post('/api/employee/threads/:id/messages', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const threadId = parseInt(req.params.id);
      const { content, messageType, mediaUrl } = req.body;

      if (!content && !mediaUrl) {
        return res.status(400).json({ message: "Message content or media is required" });
      }

      // Verify user is a participant in this thread
      const participants = await storage.getThreadParticipants(threadId);
      if (!participants.some(p => p.id === userId)) {
        return res.status(403).json({ message: "Not authorized to send to this thread" });
      }

      const message = await storage.createMessage({
        threadId,
        senderId: userId,
        content: content || "",
        messageType: messageType || "text",
        mediaUrl: mediaUrl || null,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending employee message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get inbox emails for authenticated employee
  app.get('/api/employee/emails/inbox', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const emails = await storage.getInboxEmails(userId);

      const enhancedEmails = await Promise.all(emails.map(async (email) => {
        const sender = email.senderId ? await storage.getUser(email.senderId) : null;
        return { ...email, sender };
      }));

      res.json(enhancedEmails);
    } catch (error) {
      console.error("Error fetching employee emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  // Get sent emails for authenticated employee
  app.get('/api/employee/emails/sent', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const emails = await storage.getSentEmails(userId);

      const enhancedEmails = await Promise.all(emails.map(async (email) => {
        const recipient = email.recipientId ? await storage.getUser(email.recipientId) : null;
        return { ...email, recipient };
      }));

      res.json(enhancedEmails);
    } catch (error) {
      console.error("Error fetching sent emails:", error);
      res.status(500).json({ message: "Failed to fetch sent emails" });
    }
  });

  // Send email from authenticated employee
  app.post('/api/employee/emails', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const { recipientId, subject, body } = req.body;

      if (!recipientId || !subject) {
        return res.status(400).json({ message: "Recipient and subject are required" });
      }

      const newEmail = await storage.createInternalEmail({
        senderId: userId,
        recipientId,
        subject,
        body: body || "",
        isDraft: false,
      });

      res.status(201).json(newEmail);
    } catch (error) {
      console.error("Error sending employee email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Get team members for authenticated employee
  app.get('/api/employee/team', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const allUsers = await storage.getAllUsers();

      const teamMembers = allUsers.filter(u => u.id !== userId).map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        profileImageUrl: u.profileImageUrl,
        role: u.role,
      }));

      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Create or get direct chat for authenticated employee
  app.post('/api/employee/threads/direct', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }

      const thread = await storage.createDirectChat(userId, targetUserId);
      const participants = await storage.getThreadParticipants(thread.id);

      res.status(201).json({ ...thread, participants });
    } catch (error) {
      console.error("Error creating direct chat:", error);
      res.status(500).json({ message: "Failed to create direct chat" });
    }
  });

  // Get upload URL for employee portal media files
  // Stores pending uploads for validation
  const pendingEmployeeUploads = new Map<string, { userId: string; objectPath: string; expiresAt: Date }>();

  app.post('/api/employee/upload/media', validateEmployeeSession, async (req: any, res) => {
    try {
      const { fileType, fileSize } = req.body;
      const userId = req.employeeSession.userId;

      // Validate file type - only allow safe extensions
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'pdf', 'doc', 'docx'];
      const ext = (fileType || '').toLowerCase().replace('.', '');
      if (!allowedTypes.includes(ext)) {
        return res.status(400).json({ message: "File type not allowed" });
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileSize && fileSize > maxSize) {
        return res.status(400).json({ message: "File too large. Maximum size is 50MB" });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getObjectEntityUploadURL(ext);

      // Store this upload for validation (expires in 10 minutes)
      pendingEmployeeUploads.set(result.objectPath, {
        userId,
        objectPath: result.objectPath,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      // Clean up expired pending uploads
      pendingEmployeeUploads.forEach((upload, path) => {
        if (upload.expiresAt < new Date()) {
          pendingEmployeeUploads.delete(path);
        }
      });

      res.json({ uploadURL: result.uploadURL, objectPath: result.objectPath });
    } catch (error) {
      console.error("Error getting employee upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Set media ACL for employee portal - only allows setting ACL on objects the user uploaded
  app.put('/api/employee/media', validateEmployeeSession, async (req: any, res) => {
    const { objectPath } = req.body;
    if (!objectPath) {
      return res.status(400).json({ error: "objectPath is required" });
    }

    const userId = req.employeeSession.userId;

    try {
      // Verify this is a pending upload from this user
      const pendingUpload = pendingEmployeeUploads.get(objectPath);
      if (!pendingUpload) {
        return res.status(403).json({ error: "Upload not authorized" });
      }

      if (pendingUpload.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this object" });
      }

      if (pendingUpload.expiresAt < new Date()) {
        pendingEmployeeUploads.delete(objectPath);
        return res.status(403).json({ error: "Upload authorization expired" });
      }

      // Remove from pending since it's now being finalized
      pendingEmployeeUploads.delete(objectPath);

      const objectStorageService = new ObjectStorageService();
      const finalPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectPath,
        {
          owner: userId,
          visibility: "public",
        }
      );
      res.status(200).json({ objectPath: finalPath });
    } catch (error) {
      console.error("Error setting employee media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // =====================
  // Employee Documents (Personal File Storage)
  // =====================

  // Stores pending document uploads for validation
  const pendingDocumentUploads = new Map<string, { userId: string; objectPath: string; expiresAt: Date }>();

  // Get upload URL for employee documents
  app.post('/api/employee/documents/upload', validateEmployeeSession, async (req: any, res) => {
    try {
      const { fileType, fileSize } = req.body;
      const userId = req.employeeSession.userId;

      // Validate file type - only allow safe document extensions
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
      const ext = (fileType || '').toLowerCase().replace('.', '');
      if (!allowedTypes.includes(ext)) {
        return res.status(400).json({ message: "File type not allowed. Allowed: images, PDF, Word, Excel, text, CSV" });
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileSize && fileSize > maxSize) {
        return res.status(400).json({ message: "File too large. Maximum size is 50MB" });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getObjectEntityUploadURL(ext);

      // Store this upload for validation (expires in 10 minutes)
      pendingDocumentUploads.set(result.objectPath, {
        userId,
        objectPath: result.objectPath,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      // Clean up expired pending uploads
      pendingDocumentUploads.forEach((upload, path) => {
        if (upload.expiresAt < new Date()) {
          pendingDocumentUploads.delete(path);
        }
      });

      res.json({ uploadURL: result.uploadURL, objectPath: result.objectPath });
    } catch (error) {
      console.error("Error getting employee document upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Create document record after upload completes
  app.post('/api/employee/documents', validateEmployeeSession, async (req: any, res) => {
    try {
      const { objectPath, originalName, mimeType, fileSize, description } = req.body;
      const userId = req.employeeSession.userId;

      if (!objectPath || !originalName) {
        return res.status(400).json({ message: "objectPath and originalName are required" });
      }

      // Verify this is a pending upload from this user
      const pendingUpload = pendingDocumentUploads.get(objectPath);
      if (!pendingUpload) {
        return res.status(403).json({ error: "Upload not authorized" });
      }

      if (pendingUpload.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to save this document" });
      }

      if (pendingUpload.expiresAt < new Date()) {
        pendingDocumentUploads.delete(objectPath);
        return res.status(403).json({ error: "Upload authorization expired" });
      }

      // Remove from pending
      pendingDocumentUploads.delete(objectPath);

      // Set private ACL (owner-only access)
      const objectStorageService = new ObjectStorageService();
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
        owner: userId,
        visibility: "private",
      });

      // Create document record
      const doc = await storage.createEmployeeDocument({
        employeeId: userId,
        objectPath,
        originalName,
        mimeType: mimeType || null,
        fileSize: fileSize || null,
        description: description || null,
      });

      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating employee document:", error);
      res.status(500).json({ message: "Failed to save document" });
    }
  });

  // List employee's documents (excludes internal objectPath for security)
  app.get('/api/employee/documents', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const documents = await storage.getEmployeeDocuments(userId);
      // Exclude objectPath from client response for security
      const sanitizedDocs = documents.map(({ objectPath, ...rest }) => rest);
      res.json(sanitizedDocs);
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get signed download URL for a specific document (5-min expiry)
  app.get('/api/employee/documents/:id/download', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const docId = parseInt(req.params.id);

      const doc = await storage.getEmployeeDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify ownership
      if (doc.employeeId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this document" });
      }

      // Generate signed download URL with 5-minute expiry
      const objectStorageService = new ObjectStorageService();
      const signedUrl = await objectStorageService.getSignedDownloadURL(doc.objectPath, 300);

      // Return the signed URL for client to use
      res.json({ downloadUrl: signedUrl, filename: doc.originalName });
    } catch (error) {
      console.error("Error downloading employee document:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to download document" });
      }
    }
  });

  // Delete a document
  app.delete('/api/employee/documents/:id', validateEmployeeSession, async (req: any, res) => {
    try {
      const userId = req.employeeSession.userId;
      const docId = parseInt(req.params.id);

      const doc = await storage.getEmployeeDocument(docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify ownership
      if (doc.employeeId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this document" });
      }

      // Delete the storage object
      try {
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(doc.objectPath);
        await objectFile.delete();
      } catch (storageError) {
        console.error("Error deleting storage object:", storageError);
        // Continue to delete the record even if storage deletion fails
      }

      // Delete the database record
      await storage.deleteEmployeeDocument(docId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Get meeting invitations for employee
  app.get('/api/employee/meetings', validateEmployeeSession, async (req: any, res) => {
    try {
      const session = req.employeeSession;
      const userId = session.userId;
      const email = session.email;

      // First, get meetings where user ID is an attendee
      let meetingInvites = await storage.getMeetingsForEmployee(userId);

      // Also check if this user has a remote_employee entry and get meetings for that ID too
      const remoteEmployee = await storage.getRemoteEmployeeByEmail(email);
      if (remoteEmployee) {
        const remoteEmployeeMeetings = await storage.getMeetingsForEmployee(String(remoteEmployee.id));
        // Merge and deduplicate meetings
        const existingIds = new Set(meetingInvites.map(m => m.id));
        for (const m of remoteEmployeeMeetings) {
          if (!existingIds.has(m.id)) {
            meetingInvites.push(m);
          }
        }
      }

      res.json(meetingInvites);
    } catch (error) {
      console.error("Error fetching employee meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  // Accept meeting invitation
  app.patch('/api/employee/meetings/:id/accept', validateEmployeeSession, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const session = req.employeeSession;

      // Try with user ID first, then with remote employee ID
      await storage.updateMeetingAttendeeStatus(meetingId, session.userId, 'accepted');

      // Also try with remote employee ID
      const remoteEmployee = await storage.getRemoteEmployeeByEmail(session.email);
      if (remoteEmployee) {
        await storage.updateMeetingAttendeeStatus(meetingId, String(remoteEmployee.id), 'accepted');
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting meeting:", error);
      res.status(500).json({ message: "Failed to accept meeting" });
    }
  });

  // Decline/delete meeting invitation
  app.delete('/api/employee/meetings/:id', validateEmployeeSession, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const session = req.employeeSession;

      // Try removing with user ID
      await storage.removeMeetingAttendee(meetingId, session.userId);

      // Also try with remote employee ID
      const remoteEmployee = await storage.getRemoteEmployeeByEmail(session.email);
      if (remoteEmployee) {
        await storage.removeMeetingAttendee(meetingId, String(remoteEmployee.id));
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error declining meeting:", error);
      res.status(500).json({ message: "Failed to decline meeting" });
    }
  });

  // =====================
  // Ticket Routes
  // =====================
  app.get('/api/tickets', isAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      const ticket = await storage.getTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertTicketSchema.parse({
        ...req.body,
        reporterId: req.user.claims.sub,
      });
      const ticket = await storage.createTicket(data);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(400).json({ message: "Failed to create ticket" });
    }
  });

  app.patch('/api/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      const ticket = await storage.updateTicket(parseInt(req.params.id), req.body);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  app.delete('/api/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTicket(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // =====================
  // Profile Routes
  // =====================
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getOrCreateProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/profile/:id', isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfile(parseInt(req.params.id));
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getOrCreateProfile(userId);
      const { displayName, bio, avatarUrl, coverUrl, website, location } = req.body;
      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName?.trim() || null;
      if (bio !== undefined) updateData.bio = bio?.trim() || null;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
      if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null;
      if (website !== undefined) updateData.website = website?.trim() || null;
      if (location !== undefined) updateData.location = location?.trim() || null;
      const updated = await storage.updateProfile(profile.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/profile/:id/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getProfileStats(parseInt(req.params.id));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  app.post('/api/profile/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.followProfile(profileId, userId);
      const followers = await storage.getFollowerCount(profileId);
      res.json({ followers });
    } catch (error) {
      console.error("Error following profile:", error);
      res.status(500).json({ message: "Failed to follow profile" });
    }
  });

  app.delete('/api/profile/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.unfollowProfile(profileId, userId);
      const followers = await storage.getFollowerCount(profileId);
      res.json({ followers });
    } catch (error) {
      console.error("Error unfollowing profile:", error);
      res.status(500).json({ message: "Failed to unfollow profile" });
    }
  });

  app.get('/api/profile/:id/following', isAuthenticated, async (req: any, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const isFollowing = await storage.isFollowing(profileId, userId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get('/api/profile/:id/posts', isAuthenticated, async (req, res) => {
    try {
      const posts = await storage.getProfilePosts(parseInt(req.params.id));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching profile posts:", error);
      res.status(500).json({ message: "Failed to fetch profile posts" });
    }
  });

  // =====================
  // Post Routes (Social Feed)
  // =====================
  app.get('/api/posts', isAuthenticated, async (req, res) => {
    try {
      const posts = await storage.getPublicPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, mediaUrl, mediaType, dualPostToPublic, isReel } = req.body;

      const profile = await storage.getOrCreateProfile(userId);

      const profilePost = await storage.createPost({
        authorId: userId,
        content: content || '',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        scope: 'profile',
        profileId: profile.id,
        isReel: isReel || false,
      });

      if (dualPostToPublic !== false) {
        await storage.createPost({
          authorId: userId,
          content: content || '',
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          scope: 'public',
          profileId: profile.id,
          isReel: isReel || false,
        });
      }

      res.status(201).json(profilePost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const post = await storage.getPost(postId);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }

      await storage.deletePost(postId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.likePost(postId, userId);
      const likes = await storage.getPostLikes(postId);
      res.json({ likes });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      await storage.unlikePost(postId, userId);
      const likes = await storage.getPostLikes(postId);
      res.json({ likes });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.get('/api/posts/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const comments = await storage.getPostComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPostCommentSchema.parse({
        postId: parseInt(req.params.id),
        authorId: req.user.claims.sub,
        content: req.body.content,
      });
      const comment = await storage.addPostComment(data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: "Failed to add comment" });
    }
  });

  app.delete('/api/posts/:postId/comments/:commentId', isAuthenticated, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user.claims.sub;
      await storage.deletePostComment(commentId, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      if (error.message === "Not authorized") {
        res.status(403).json({ message: "Not authorized to delete this comment" });
      } else {
        res.status(500).json({ message: "Failed to delete comment" });
      }
    }
  });

  // =====================
  // Chat Routes (WhatsApp-style messaging)
  // =====================

  // Get all threads for current user with last message and unread count
  app.get('/api/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threads = await storage.getChatThreads(userId);

      // Enhance threads with last message and unread count
      const enhancedThreads = await Promise.all(threads.map(async (thread) => {
        const lastMessage = await storage.getLastMessage(thread.id);
        const unreadCount = await storage.getUnreadCount(thread.id, userId);
        const participants = await storage.getThreadParticipants(thread.id);

        return {
          ...thread,
          lastMessage,
          unreadCount,
          participants,
        };
      }));

      res.json(enhancedThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });

  // Create a new group chat
  app.post('/api/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds, ...threadData } = req.body;
      const data = insertChatThreadSchema.parse({
        ...threadData,
        type: "group",
        creatorId: userId,
      });
      const allParticipants = Array.from(new Set([userId, ...(participantIds || [])]));
      const thread = await storage.createChatThread(data, allParticipants, userId);
      res.status(201).json(thread);
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(400).json({ message: "Failed to create thread" });
    }
  });

  // Create or get direct chat between two users
  app.post('/api/threads/direct', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }

      const thread = await storage.createDirectChat(userId, targetUserId);
      const participants = await storage.getThreadParticipants(thread.id);

      res.status(201).json({ ...thread, participants });
    } catch (error) {
      console.error("Error creating direct chat:", error);
      res.status(400).json({ message: "Failed to create direct chat" });
    }
  });

  // Get or create global chat for all employees
  app.get('/api/threads/global', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const thread = await storage.getOrCreateGlobalChat();

      // Add the current user if not already a participant
      const participants = await storage.getThreadParticipants(thread.id);
      const isParticipant = participants.some(p => p.id === userId);
      if (!isParticipant) {
        await storage.addThreadParticipant(thread.id, userId);
      }

      const messages = await storage.getMessages(thread.id);
      const lastMessage = await storage.getLastMessage(thread.id);
      const unreadCount = await storage.getUnreadCount(thread.id, userId);
      const updatedParticipants = await storage.getThreadParticipants(thread.id);

      res.json({
        ...thread,
        participants: updatedParticipants,
        lastMessage,
        unreadCount,
        messages
      });
    } catch (error) {
      console.error("Error fetching global chat:", error);
      res.status(500).json({ message: "Failed to fetch global chat" });
    }
  });

  // Get thread details with participants
  app.get('/api/threads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const thread = await storage.getChatThread(threadId);
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      const participants = await storage.getThreadParticipants(threadId);
      const lastMessage = await storage.getLastMessage(threadId);
      const unreadCount = await storage.getUnreadCount(threadId, req.user.claims.sub);

      res.json({ ...thread, participants, lastMessage, unreadCount });
    } catch (error) {
      console.error("Error fetching thread:", error);
      res.status(500).json({ message: "Failed to fetch thread" });
    }
  });

  // Update thread (name, description, avatar)
  app.patch('/api/threads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const { name, description, avatarUrl } = req.body;

      const updated = await storage.updateThread(threadId, { name, description, avatarUrl });
      if (!updated) {
        return res.status(404).json({ message: "Thread not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating thread:", error);
      res.status(500).json({ message: "Failed to update thread" });
    }
  });

  // Delete thread
  app.delete('/api/threads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      await storage.deleteThread(threadId);
      res.json({ message: "Thread deleted" });
    } catch (error) {
      console.error("Error deleting thread:", error);
      res.status(500).json({ message: "Failed to delete thread" });
    }
  });

  // Get thread participants
  app.get('/api/threads/:id/participants', isAuthenticated, async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const participants = await storage.getThreadParticipants(threadId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Add participant to thread
  app.post('/api/threads/:id/participants', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const { userId, isAdmin } = req.body;

      await storage.addThreadParticipant(threadId, userId, isAdmin || false);
      res.status(201).json({ message: "Participant added" });
    } catch (error) {
      console.error("Error adding participant:", error);
      res.status(400).json({ message: "Failed to add participant" });
    }
  });

  // Remove participant from thread
  app.delete('/api/threads/:id/participants/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const { userId } = req.params;

      await storage.removeThreadParticipant(threadId, userId);
      res.json({ message: "Participant removed" });
    } catch (error) {
      console.error("Error removing participant:", error);
      res.status(500).json({ message: "Failed to remove participant" });
    }
  });

  // Get messages in thread
  app.get('/api/threads/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const messages = await storage.getMessages(threadId);

      // Mark messages as read when fetching
      await storage.markMessagesRead(threadId, userId);

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message in thread
  app.post('/api/threads/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaUrl = req.body.mediaUrl;

      // If there's a media URL, set the object to public
      if (mediaUrl && mediaUrl.startsWith('/objects/')) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.trySetObjectEntityAclPolicy(mediaUrl, {
            owner: userId,
            visibility: "public",
          });
        } catch (aclError) {
          console.error("Error setting media ACL:", aclError);
          // Continue anyway - file may still be accessible
        }
      }

      const data = insertMessageSchema.parse({
        threadId: parseInt(req.params.id),
        senderId: userId,
        content: req.body.content,
        messageType: req.body.messageType || "text",
        mediaUrl: mediaUrl,
      });
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Delete message
  app.delete('/api/threads/:threadId/messages/:messageId', isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const userId = req.user.claims.sub;
      await storage.deleteMessage(messageId, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting message:", error);
      if (error.message === "Not authorized") {
        res.status(403).json({ message: "Not authorized to delete this message" });
      } else {
        res.status(500).json({ message: "Failed to delete message" });
      }
    }
  });

  // Mark thread messages as read
  app.post('/api/threads/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      await storage.markMessagesRead(threadId, userId);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // =====================
  // Object Storage / File Upload Routes
  // =====================

  // Get upload URL for media files (images, voice notes)
  app.post('/api/upload/media', isAuthenticated, async (req: any, res) => {
    try {
      const { fileType } = req.body; // e.g., "jpg", "png", "webm", "ogg"
      console.log("Upload media request, fileType:", fileType);
      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getObjectEntityUploadURL(fileType);
      console.log("Upload URL result:", result);
      res.json(result);
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Serve uploaded objects - allows public access for objects with public visibility
  // Or allows any authenticated user to access internal uploads
  app.get('/objects/:objectPath(*)', async (req: any, res, next) => {
    try {
      const objectStorageService = new ObjectStorageService();
      // Normalize path to fix corrupted URLs like /objects//objects/uploads/xxx
      let objectPath = req.path;
      // Fix double /objects/ prefix
      objectPath = objectPath.replace(/^\/objects\/\/objects\//, '/objects/');
      // Fix any remaining double slashes
      objectPath = objectPath.replace(/\/+/g, '/');
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

      // Check if object is public - if so, serve it without auth
      const canAccessPublic = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: undefined, // No user - checking public access
        requestedPermission: ObjectPermission.READ,
      });

      if (canAccessPublic) {
        return objectStorageService.downloadObject(objectFile, res, 3600, req);
      }

      // If not public, require authentication
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user?.claims?.sub;

      // Allow any authenticated user to access internal uploads (chat media, etc.)
      // This is a fallback for files that don't have ACL set
      if (objectPath.includes('/uploads/')) {
        return objectStorageService.downloadObject(objectFile, res, 3600, req);
      }

      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      objectStorageService.downloadObject(objectFile, res, 3600, req);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Object not found" });
      }
      res.status(500).json({ message: "Failed to serve object" });
    }
  });

  // =====================
  // Meeting Routes
  // =====================
  app.get('/api/meetings', isAuthenticated, async (req, res) => {
    try {
      const meetings = await storage.getMeetings();
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get('/api/meetings/:id', isAuthenticated, async (req, res) => {
    try {
      const meeting = await storage.getMeeting(parseInt(req.params.id));
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  app.post('/api/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const { attendeeIds, startTime, endTime, ...meetingData } = req.body;
      const data = insertMeetingSchema.parse({
        ...meetingData,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        organizerId: req.user.claims.sub,
      });
      const meeting = await storage.createMeeting(data, attendeeIds || []);

      // Create notifications for attendees who are registered users (skip remote employees)
      if (attendeeIds && attendeeIds.length > 0) {
        await Promise.all(attendeeIds.map(async (attendeeId: string) => {
          try {
            // Check if attendee is a registered user (not just a remote employee)
            const user = await storage.getUser(attendeeId);
            if (user) {
              await storage.createNotification({
                userId: attendeeId,
                type: "meeting_invite",
                title: meeting.title,
                message: `لقد تمت دعوتك لحضور اجتماع: ${meeting.title}`,
                data: {
                  meetingId: meeting.id,
                  action: "meeting_invite",
                  startTime: meeting.startTime.toISOString(),
                }
              });
            }
          } catch (err) {
            // Skip notification for non-registered users (remote employees)
            console.log(`Skipping notification for attendee ${attendeeId} - not a registered user`);
          }
        }));
      }

      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(400).json({ message: "Failed to create meeting" });
    }
  });

  app.patch('/api/meetings/:id', isAuthenticated, async (req, res) => {
    try {
      const meeting = await storage.updateMeeting(parseInt(req.params.id), req.body);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

  app.delete('/api/meetings/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMeeting(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  app.get('/api/meetings/:id/attendees', isAuthenticated, async (req, res) => {
    try {
      const attendees = await storage.getMeetingAttendees(parseInt(req.params.id));
      res.json(attendees);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      res.status(500).json({ message: "Failed to fetch attendees" });
    }
  });

  // =====================
  // Video Meeting Participant Management (for PeerJS video rooms)
  // =====================
  // In-memory storage for active meeting participants (peerId tracking)
  const meetingParticipants = new Map<number, Set<string>>();

  // Join a meeting (add participant's peerId)
  app.post('/api/meetings/:id/join', async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const { peerId } = req.body;

      if (!peerId || typeof peerId !== 'string') {
        return res.status(400).json({ message: "peerId is required" });
      }

      // Initialize set if meeting doesn't exist
      if (!meetingParticipants.has(meetingId)) {
        meetingParticipants.set(meetingId, new Set());
      }

      // Add participant
      meetingParticipants.get(meetingId)!.add(peerId);

      console.log(`Participant ${peerId} joined meeting ${meetingId}`);
      res.status(200).json({ success: true, peerId });
    } catch (error) {
      console.error("Error joining meeting:", error);
      res.status(500).json({ message: "Failed to join meeting" });
    }
  });

  // Get all participants in a meeting
  app.get('/api/meetings/:id/participants', async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);

      const participants = meetingParticipants.get(meetingId);
      const participantList = participants ? Array.from(participants) : [];

      console.log(`Meeting ${meetingId} has ${participantList.length} participants:`, participantList);
      res.json(participantList);
    } catch (error) {
      console.error("Error fetching meeting participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Leave a meeting (remove participant's peerId)
  app.post('/api/meetings/:id/leave', async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const { peerId } = req.body;

      if (!peerId || typeof peerId !== 'string') {
        return res.status(400).json({ message: "peerId is required" });
      }

      const participants = meetingParticipants.get(meetingId);
      if (participants) {
        participants.delete(peerId);

        // Clean up empty meetings
        if (participants.size === 0) {
          meetingParticipants.delete(meetingId);
        }
      }

      console.log(`Participant ${peerId} left meeting ${meetingId}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error leaving meeting:", error);
      res.status(500).json({ message: "Failed to leave meeting" });
    }
  });

  // =====================
  // Job Posting Routes (Manager & Admin only)
  // =====================
  app.get('/api/jobs', isAuthenticated, requireRole("manager", "admin"), async (req, res) => {
    try {
      const jobs = await storage.getJobPostings();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/jobs/:id', isAuthenticated, requireRole("manager", "admin"), async (req, res) => {
    try {
      const job = await storage.getJobPosting(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post('/api/jobs', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const data = insertJobPostingSchema.parse({
        ...req.body,
        creatorId: req.user.claims.sub,
      });
      const job = await storage.createJobPosting(data);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: "Failed to create job" });
    }
  });

  app.patch('/api/jobs/:id', isAuthenticated, requireRole("manager", "admin"), async (req, res) => {
    try {
      const job = await storage.updateJobPosting(parseInt(req.params.id), req.body);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete('/api/jobs/:id', isAuthenticated, requireRole("manager", "admin"), async (req, res) => {
    try {
      await storage.deleteJobPosting(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // =====================
  // Transaction Routes (Finance - Admin only)
  // =====================
  app.get('/api/transactions', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/transactions/pending', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      res.status(500).json({ message: "Failed to fetch pending transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const data = insertTransactionSchema.parse({
        ...req.body,
        submitterId: req.user.claims.sub,
      });
      const transaction = await storage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.patch('/api/transactions/:id', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const updateData = { ...req.body };
      if (req.body.status === 'approved' || req.body.status === 'rejected') {
        updateData.approverId = req.user.claims.sub;
      }
      const transaction = await storage.updateTransaction(parseInt(req.params.id), updateData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteTransaction(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // =====================
  // Role Routes (Access Control - Admin only)
  // =====================
  app.get('/api/roles', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post('/api/roles', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(400).json({ message: "Failed to create role" });
    }
  });

  app.patch('/api/roles/:id', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const role = await storage.updateRole(parseInt(req.params.id), req.body);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/roles/:id', isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteRole(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  app.get('/api/users/:id/roles', isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getUserRoles(req.params.id);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.post('/api/users/:userId/roles/:roleId', isAuthenticated, async (req, res) => {
    try {
      await storage.assignRole(req.params.userId, parseInt(req.params.roleId));
      res.status(200).json({ message: "Role assigned" });
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  app.delete('/api/users/:userId/roles/:roleId', isAuthenticated, async (req, res) => {
    try {
      await storage.removeRole(req.params.userId, parseInt(req.params.roleId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing role:", error);
      res.status(500).json({ message: "Failed to remove role" });
    }
  });

  // =====================
  // Notification Routes
  // =====================
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ message: "Failed to mark all notifications read" });
    }
  });

  // =====================
  // Push Notification Routes
  // =====================
  app.post('/api/push/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { endpoint, p256dh, auth, userAgent } = req.body;

      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ message: "Missing required push subscription data" });
      }

      await storage.createPushSubscription({
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent || null,
      });

      res.status(201).json({ message: "Push subscription created" });
    } catch (error) {
      console.error("Error creating push subscription:", error);
      res.status(500).json({ message: "Failed to create push subscription" });
    }
  });

  app.post('/api/push/unsubscribe', isAuthenticated, async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      const userId = req.user?.claims?.sub;

      if (!endpoint) {
        return res.status(400).json({ message: "Missing endpoint" });
      }

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.deletePushSubscription(endpoint, userId);
      res.status(200).json({ message: "Push subscription deleted" });
    } catch (error) {
      console.error("Error deleting push subscription:", error);
      res.status(500).json({ message: "Failed to delete push subscription" });
    }
  });

  app.get('/api/push/vapid-public-key', (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    res.json({ publicKey });
  });

  // =====================
  // Department Routes (Standalone)
  // =====================

  const verifyDepartmentOwnership = async (departmentId: number, userId: string) => {
    const department = await storage.getDepartment(departmentId);
    if (!department) return { error: 'not_found' as const };
    if (department.managerId !== userId) return { error: 'forbidden' as const };
    return { department };
  };

  app.get("/api/departments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const departments = await storage.getDepartmentsByManager(userId);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const departmentId = parseInt(req.params.id);
      const result = await verifyDepartmentOwnership(departmentId, userId);
      if (result.error === 'not_found') {
        return res.status(404).json({ message: "Department not found" });
      }
      if (result.error === 'forbidden') {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(result.department);
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  app.post("/api/departments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { name, description, icon, color, password } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }
      const department = await storage.createDepartment({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || 'briefcase',
        color: color || 'blue',
        password: password?.trim() || null,
        managerId: userId,
      });
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.patch("/api/departments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const departmentId = parseInt(req.params.id);
      const result = await verifyDepartmentOwnership(departmentId, userId);
      if (result.error === 'not_found') {
        return res.status(404).json({ message: "Department not found" });
      }
      if (result.error === 'forbidden') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { name, description, icon, color, password } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (password !== undefined) updateData.password = password?.trim() || null;
      const department = await storage.updateDepartment(departmentId, updateData);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const departmentId = parseInt(req.params.id);
      const result = await verifyDepartmentOwnership(departmentId, userId);
      if (result.error === 'not_found') {
        return res.status(404).json({ message: "Department not found" });
      }
      if (result.error === 'forbidden') {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteDepartment(departmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  app.post("/api/departments/:id/verify-password", isAuthenticated, async (req: any, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      const { password } = req.body;
      const department = await storage.getDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      const isValid = await storage.verifyDepartmentPassword(departmentId, password || '');
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  // =====================
  // Remote Employee Routes
  // =====================

  // Get all employees from all departments (for meeting participant selection)
  app.get("/api/departments/employees/all", isAuthenticated, async (req: any, res) => {
    try {
      const allEmployees = await storage.getAllRemoteEmployees();
      res.json(allEmployees);
    } catch (error) {
      console.error("Error fetching all employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/departments/:departmentId/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const departmentId = parseInt(req.params.departmentId);
      const result = await verifyDepartmentOwnership(departmentId, userId);
      if (result.error === 'not_found') {
        return res.status(404).json({ message: "Department not found" });
      }
      if (result.error === 'forbidden') {
        return res.status(403).json({ message: "Access denied" });
      }
      const employees = await storage.getRemoteEmployees(departmentId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getRemoteEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const deptResult = await verifyDepartmentOwnership(employee.departmentId, userId);
      if (deptResult.error) {
        return res.status(deptResult.error === 'not_found' ? 404 : 403).json({ message: "Access denied" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.get("/api/employees/username/:username", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employee = await storage.getRemoteEmployeeByUsername(req.params.username);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const result = await verifyDepartmentOwnership(employee.departmentId, userId);
      if (result.error === 'forbidden') {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee by username:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/departments/:departmentId/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const departmentId = parseInt(req.params.departmentId);
      const result = await verifyDepartmentOwnership(departmentId, userId);
      if (result.error === 'not_found') {
        return res.status(404).json({ message: "Department not found" });
      }
      if (result.error === 'forbidden') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { username, firstName, lastName, email, phone, jobTitle, bio, skills, status, profileImageUrl } = req.body;
      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({ message: "Username is required" });
      }
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        return res.status(400).json({ message: "Last name is required" });
      }
      const existingEmployee = await storage.getRemoteEmployeeByUsername(username.trim().toLowerCase());
      if (existingEmployee) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const employee = await storage.createRemoteEmployee({
        username: username.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        bio: bio?.trim() || null,
        skills: skills?.trim() || null,
        status: status || 'active',
        profileImageUrl: profileImageUrl || null,
        departmentId,
        hiredById: userId,
      });
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getRemoteEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const deptResult = await verifyDepartmentOwnership(employee.departmentId, userId);
      if (deptResult.error) {
        return res.status(deptResult.error === 'not_found' ? 404 : 403).json({ message: "Access denied" });
      }
      const { firstName, lastName, email, phone, jobTitle, bio, skills, status, profileImageUrl } = req.body;
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (email !== undefined) updateData.email = email?.trim() || null;
      if (phone !== undefined) updateData.phone = phone?.trim() || null;
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle?.trim() || null;
      if (bio !== undefined) updateData.bio = bio?.trim() || null;
      if (skills !== undefined) updateData.skills = skills?.trim() || null;
      if (status !== undefined) updateData.status = status;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      const updatedEmployee = await storage.updateRemoteEmployee(employeeId, updateData);
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getRemoteEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const deptResult = await verifyDepartmentOwnership(employee.departmentId, userId);
      if (deptResult.error) {
        return res.status(deptResult.error === 'not_found' ? 404 : 403).json({ message: "Access denied" });
      }
      await storage.deleteRemoteEmployee(employeeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // =====================
  // Subscription Routes
  // =====================
  app.get('/api/subscriptions/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getActiveSubscription(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching active subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.get('/api/subscriptions/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getSubscriptionByUser(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertSubscriptionSchema.parse({
        ...req.body,
        userId,
        status: 'active', // Mock: Set to active immediately (real implementation would wait for payment confirmation)
      });
      const subscription = await storage.createSubscription(data);
      res.status(201).json(subscription);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.patch('/api/subscriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getSubscription(subscriptionId);

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Verify ownership
      const userId = req.user.claims.sub;
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateSubscription(subscriptionId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // =====================
  // Advertisement Routes
  // =====================

  // Public: Get all active advertisements (for landing page)
  app.get('/api/advertisements/active', async (req, res) => {
    try {
      const ads = await storage.getActiveAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching active advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Get user's advertisements
  app.get('/api/advertisements/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ads = await storage.getAdvertisementsByUser(userId);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching user advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Get single advertisement
  app.get('/api/advertisements/:id', async (req, res) => {
    try {
      const ad = await storage.getAdvertisement(parseInt(req.params.id));
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      res.json(ad);
    } catch (error) {
      console.error("Error fetching advertisement:", error);
      res.status(500).json({ message: "Failed to fetch advertisement" });
    }
  });

  // Create advertisement (requires subscription)
  app.post('/api/advertisements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Check if user has active subscription
      const subscription = await storage.getActiveSubscription(userId);
      if (!subscription) {
        return res.status(403).json({ message: "Active subscription required to create advertisements" });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3); // 3 days duration

      const data = insertAdvertisementSchema.parse({
        ...req.body,
        userId,
        price: 500,
        duration: 3,
        startDate,
        endDate,
        status: 'active', // Mock: Set to active immediately (real implementation would wait for payment)
      });

      const ad = await storage.createAdvertisement(data);
      res.status(201).json(ad);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid advertisement data", errors: error.errors });
      }
      console.error("Error creating advertisement:", error);
      res.status(500).json({ message: "Failed to create advertisement" });
    }
  });

  // Update advertisement
  app.patch('/api/advertisements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adId = parseInt(req.params.id);
      const ad = await storage.getAdvertisement(adId);

      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }

      // Verify ownership
      const userId = req.user.claims.sub;
      if (ad.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateAdvertisement(adId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Failed to update advertisement" });
    }
  });

  // Delete advertisement
  app.delete('/api/advertisements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adId = parseInt(req.params.id);
      const ad = await storage.getAdvertisement(adId);

      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }

      // Verify ownership
      const userId = req.user.claims.sub;
      if (ad.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteAdvertisement(adId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Failed to delete advertisement" });
    }
  });

  // Track ad view (public)
  app.post('/api/advertisements/:id/view', async (req, res) => {
    try {
      const adId = parseInt(req.params.id);
      await storage.incrementAdViews(adId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error tracking ad view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Track ad click (public)
  app.post('/api/advertisements/:id/click', async (req, res) => {
    try {
      const adId = parseInt(req.params.id);
      await storage.incrementAdClicks(adId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error tracking ad click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // =====================
  // n8n Settings Routes (Manager & Admin only)
  // =====================
  app.get('/api/n8n/settings', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let settings = await storage.getN8nSettings(userId);
      if (!settings) {
        settings = await storage.createN8nSettings({ userId, isEnabled: false });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching n8n settings:", error);
      res.status(500).json({ message: "Failed to fetch n8n settings" });
    }
  });

  app.put('/api/n8n/settings', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { webhookUrl, apiKey, isEnabled } = req.body;

      let settings = await storage.getN8nSettings(userId);
      if (!settings) {
        settings = await storage.createN8nSettings({
          userId,
          webhookUrl,
          apiKey,
          isEnabled: isEnabled ?? false,
        });
      } else {
        settings = await storage.updateN8nSettings(userId, {
          webhookUrl,
          apiKey,
          isEnabled,
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error updating n8n settings:", error);
      res.status(500).json({ message: "Failed to update n8n settings" });
    }
  });

  // =====================
  // Task Automation Routes
  // =====================
  app.get('/api/automations', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automations = await storage.getTaskAutomations(userId);
      res.json(automations);
    } catch (error) {
      console.error("Error fetching automations:", error);
      res.status(500).json({ message: "Failed to fetch automations" });
    }
  });

  app.get('/api/automations/pending', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automations = await storage.getPendingAutomations(userId);
      res.json(automations);
    } catch (error) {
      console.error("Error fetching pending automations:", error);
      res.status(500).json({ message: "Failed to fetch pending automations" });
    }
  });

  app.get('/api/automations/task/:taskId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const automation = await storage.getTaskAutomationByTask(taskId);
      res.json(automation || null);
    } catch (error) {
      console.error("Error fetching task automation:", error);
      res.status(500).json({ message: "Failed to fetch task automation" });
    }
  });

  // Send task to n8n for automation
  app.post('/api/automations/send', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { taskId } = req.body;

      if (!taskId) {
        return res.status(400).json({ message: "taskId is required" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const settings = await storage.getN8nSettings(userId);
      if (!settings || !settings.isEnabled || !settings.webhookUrl) {
        return res.status(400).json({ message: "n8n is not configured. Please set up your webhook URL in Settings." });
      }

      // Create automation record with processing status
      const automation = await storage.createTaskAutomation({
        taskId,
        userId,
        status: 'processing',
      });

      // Send task to n8n webhook
      try {
        const webhookPayload = {
          automationId: automation.id,
          taskId: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          callbackUrl: `${process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : ''}/api/automations/callback`,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (settings.apiKey) {
          headers['X-API-Key'] = settings.apiKey;
        }

        const response = await fetch(settings.webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          await storage.updateTaskAutomation(automation.id, { status: 'pending' });
          return res.status(502).json({ message: "Failed to send task to n8n. Please check your webhook URL." });
        }

        res.json({
          message: "Task sent to n8n for processing",
          automationId: automation.id
        });
      } catch (fetchError) {
        await storage.updateTaskAutomation(automation.id, { status: 'pending' });
        console.error("Error calling n8n webhook:", fetchError);
        res.status(502).json({ message: "Failed to connect to n8n. Please check your webhook URL." });
      }
    } catch (error) {
      console.error("Error sending task to n8n:", error);
      res.status(500).json({ message: "Failed to send task to n8n" });
    }
  });

  // Callback endpoint for n8n to return AI results (public webhook with API key validation)
  app.post('/api/automations/callback', async (req, res) => {
    try {
      const { automationId, aiSuggestion, aiMetadata, executionId } = req.body;

      if (!automationId) {
        return res.status(400).json({ message: "automationId is required" });
      }

      const automation = await storage.getTaskAutomation(automationId);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      // Validate API key from n8n settings
      const settings = await storage.getN8nSettings(automation.userId);
      if (settings?.apiKey) {
        const providedApiKey = req.headers['x-api-key'];
        if (providedApiKey !== settings.apiKey) {
          return res.status(401).json({ message: "Invalid API key" });
        }
      }

      // Only allow updating if automation is in processing state
      if (automation.status !== 'processing') {
        return res.status(400).json({ message: "Automation is not in processing state" });
      }

      await storage.updateTaskAutomation(automationId, {
        aiSuggestion,
        aiMetadata: aiMetadata || {},
        status: 'ready',
        n8nExecutionId: executionId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing n8n callback:", error);
      res.status(500).json({ message: "Failed to process callback" });
    }
  });

  // Approve automation result
  app.post('/api/automations/:id/approve', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automationId = parseInt(req.params.id);

      const automation = await storage.getTaskAutomation(automationId);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      if (automation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (automation.status !== 'ready') {
        return res.status(400).json({ message: "Automation is not ready for approval" });
      }

      await storage.updateTaskAutomation(automationId, {
        status: 'approved',
        approvedBy: userId,
      });

      // Update the task status to completed
      if (automation.taskId) {
        await storage.updateTask(automation.taskId, { status: 'completed' });
      }

      res.json({ success: true, message: "Automation approved and task completed" });
    } catch (error) {
      console.error("Error approving automation:", error);
      res.status(500).json({ message: "Failed to approve automation" });
    }
  });

  // Reject automation result
  app.post('/api/automations/:id/reject', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automationId = parseInt(req.params.id);
      const { reason } = req.body;

      const automation = await storage.getTaskAutomation(automationId);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      if (automation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.updateTaskAutomation(automationId, {
        status: 'rejected',
        rejectionReason: reason,
      });

      res.json({ success: true, message: "Automation rejected" });
    } catch (error) {
      console.error("Error rejecting automation:", error);
      res.status(500).json({ message: "Failed to reject automation" });
    }
  });

  // Delete automation
  app.delete('/api/automations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automationId = parseInt(req.params.id);

      const automation = await storage.getTaskAutomation(automationId);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }

      if (automation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteTaskAutomation(automationId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting automation:", error);
      res.status(500).json({ message: "Failed to delete automation" });
    }
  });

  // =====================
  // Object Storage Routes (additional upload/media endpoints)
  // Note: The main /objects/:objectPath(*) route is defined earlier with public access support
  // =====================

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/media", isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaURL) {
      return res.status(400).json({ error: "mediaURL is required" });
    }
    const userId = req.user?.claims?.sub;
    const mediaURL = req.body.mediaURL;

    try {
      const objectStorageService = new ObjectStorageService();
      const privateDir = objectStorageService.getPrivateObjectDir();

      if (mediaURL.includes("storage.googleapis.com")) {
        const url = new URL(mediaURL);
        if (!url.pathname.startsWith(privateDir)) {
          return res.status(400).json({ error: "Invalid media URL" });
        }
      }

      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        mediaURL,
        {
          owner: userId,
          visibility: "public",
        }
      );
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // =====================
  // PUBLIC STOREFRONT ROUTES (No Authentication Required)
  // =====================

  // Get public reels (video posts marked as isReel=true) - for landing page Videos section
  app.get('/api/public/reels', async (req, res) => {
    try {
      const allPosts = await storage.getPublicPosts();
      const reels = allPosts.filter((post: any) => post.isReel && post.mediaType === 'video' && post.mediaUrl);
      res.json(reels);
    } catch (error) {
      console.error("Error fetching public reels:", error);
      res.status(500).json({ message: "Failed to fetch reels" });
    }
  });

  // Get public news feed (all public posts excluding reels) - for landing page news section
  app.get('/api/public/news', async (req, res) => {
    try {
      const allPosts = await storage.getPublicPosts();
      const news = allPosts.filter((post: any) => !post.isReel);
      res.json(news);
    } catch (error) {
      console.error("Error fetching public news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Get public users for reels display
  app.get('/api/public/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Return only basic info for public display
      const publicUsers = users.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        profileImageUrl: u.profileImageUrl
      }));
      res.json(publicUsers);
    } catch (error) {
      console.error("Error fetching public users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all published offices (public)
  app.get('/api/public/offices', async (req, res) => {
    try {
      const offices = await storage.getPublishedOffices();
      res.json(offices);
    } catch (error) {
      console.error("Error fetching public offices:", error);
      res.status(500).json({ message: "Failed to fetch offices" });
    }
  });

  // Get single office by slug (public)
  app.get('/api/public/offices/:slug', async (req, res) => {
    try {
      const office = await storage.getOfficeBySlug(req.params.slug);
      if (!office || !office.isPublished) {
        return res.status(404).json({ message: "Office not found" });
      }
      res.json(office);
    } catch (error) {
      console.error("Error fetching office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
    }
  });

  // Get all public services across all offices
  app.get('/api/public/services', async (req, res) => {
    try {
      const services = await storage.getAllPublicServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching public services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get office services (public)
  app.get('/api/public/offices/:officeId/services', async (req, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const services = await storage.getOfficeServices(officeId);
      const activeServices = services.filter(s => s.isActive);
      res.json(activeServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get service ratings and average (public)
  app.get('/api/public/services/:serviceId/ratings', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const [ratings, stats] = await Promise.all([
        storage.getServiceRatings(serviceId),
        storage.getServiceAverageRating(serviceId),
      ]);
      res.json({ ratings, average: stats.average, count: stats.count });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Submit service rating (public - visitor can rate)
  app.post('/api/public/services/:serviceId/ratings', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const { rating, visitorName } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      const data = insertServiceRatingSchema.parse({
        serviceId,
        rating,
        visitorName: visitorName || null,
      });
      const newRating = await storage.createServiceRating(data);
      res.status(201).json(newRating);
    } catch (error) {
      console.error("Error submitting rating:", error);
      res.status(400).json({ message: "Failed to submit rating" });
    }
  });

  // Get service comments (public)
  app.get('/api/public/services/:serviceId/comments', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const comments = await storage.getServiceComments(serviceId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Submit service comment (public - visitor can comment)
  app.post('/api/public/services/:serviceId/comments', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const { content, visitorName, visitorEmail, rating } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }
      const data = insertServiceCommentSchema.parse({
        serviceId,
        content: content.trim(),
        visitorName: visitorName || null,
        visitorEmail: visitorEmail || null,
        rating: rating || null,
        status: 'published',
      });
      const comment = await storage.createServiceComment(data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error submitting comment:", error);
      res.status(400).json({ message: "Failed to submit comment" });
    }
  });

  // Submit service request (public - visitor can request a service)
  app.post('/api/public/services/:serviceId/request', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const service = await storage.getOfficeService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const { visitorName, visitorEmail, visitorPhone, message } = req.body;
      if (!visitorName || !visitorEmail) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      const request = await storage.createServiceRequest({
        serviceId,
        officeId: service.officeId,
        visitorName,
        visitorEmail,
        visitorPhone: visitorPhone || null,
        message: message || null,
        status: 'pending',
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Error submitting service request:", error);
      res.status(400).json({ message: "Failed to submit request" });
    }
  });

  // Get daily videos (public)
  app.get('/api/public/videos', async (req, res) => {
    try {
      const videos = await storage.getDailyVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Get announcements (public)
  app.get('/api/public/announcements', async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // ============================================
  // Stories API (24-hour content)
  // ============================================

  // Get active stories (public)
  app.get('/api/public/stories', async (req, res) => {
    try {
      await storage.deleteExpiredStories();
      const activeStories = await storage.getActiveStories();
      res.json(activeStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // Create a new story (authenticated)
  app.post('/api/stories', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { mediaUrl, mediaType, caption } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!mediaUrl || !mediaType) {
        return res.status(400).json({ message: "Media URL and type are required" });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await storage.createStory({
        authorId: userId,
        mediaUrl,
        mediaType,
        caption: caption || null,
        expiresAt
      });

      res.status(201).json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // Get user's stories
  app.get('/api/stories/my', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const myStories = await storage.getStoriesByUser(userId);
      res.json(myStories);
    } catch (error) {
      console.error("Error fetching user stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // View a story (increment views)
  app.post('/api/public/stories/:id/view', async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      await storage.incrementStoryViews(storyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error incrementing story views:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Delete a story (authenticated, owner only)
  app.delete('/api/stories/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const storyId = parseInt(req.params.id);
      const story = await storage.getStory(storyId);

      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      if (story.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this story" });
      }

      await storage.deleteStory(storyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Get office media (public)
  app.get('/api/public/offices/:officeId/media', async (req, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const media = await storage.getOfficeMedia(officeId);
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Increment media views (public)
  app.post('/api/public/media/:id/view', async (req, res) => {
    try {
      await storage.incrementMediaViews(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error incrementing views:", error);
      res.status(500).json({ message: "Failed to increment views" });
    }
  });

  // Get all office posts for storefront (public)
  app.get('/api/public/posts', async (req, res) => {
    try {
      const posts = await storage.getAllOfficePosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching office posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get social feed posts for landing page (public)
  app.get('/api/public/social-feed', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);
      const posts = await storage.getPublicPosts();
      const limitedPosts = posts.slice(0, limit);

      // Get author info for each post
      const postsWithAuthors = await Promise.all(
        limitedPosts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
          return {
            id: post.id,
            content: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            createdAt: post.createdAt,
            author: author ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              email: author.email,
              profileImageUrl: author.profileImageUrl,
            } : null,
          };
        })
      );

      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching social feed posts:", error);
      res.status(500).json({ message: "Failed to fetch social feed" });
    }
  });

  // Get office posts (public)
  app.get('/api/public/offices/:officeId/posts', async (req, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const posts = await storage.getOfficePosts(officeId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Like office post (public)
  app.post('/api/public/posts/:id/like', async (req, res) => {
    try {
      await storage.likeOfficePost(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Office Chat (Receptionist Chat) - Public visitor can chat
  // Get chat messages for a session
  app.get('/api/public/offices/:officeId/messages', async (req, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      const messages = await storage.getOfficeMessages(officeId, sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send chat message as visitor
  app.post('/api/public/offices/:officeId/messages', async (req, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const { sessionId, content, senderName, senderEmail } = req.body;
      if (!sessionId || !content || content.trim().length === 0) {
        return res.status(400).json({ message: "Session ID and content are required" });
      }
      const data = insertOfficeMessageSchema.parse({
        officeId,
        sessionId,
        senderType: 'visitor',
        senderName: senderName || null,
        senderEmail: senderEmail || null,
        content: content.trim(),
      });
      const message = await storage.createOfficeMessage(data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // =====================
  // PUBLIC JOBS / CAREERS ROUTES
  // =====================

  // Get all published job postings (public)
  app.get('/api/public/jobs', async (req, res) => {
    try {
      const jobs = await storage.getJobPostings();
      const publishedJobs = jobs.filter((job: any) => job.status === 'published');
      res.json(publishedJobs);
    } catch (error) {
      console.error("Error fetching public jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Apply for a job (public)
  app.post('/api/public/jobs/:id/apply', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { fullName, email, phone, experience, resume, coverLetter, jobTitle, department } = req.body;

      if (!fullName || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Check if job exists and is published
      const job = await storage.getJobPosting(jobId);
      if (!job || job.status !== 'published') {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Create a service request entry for the job application
      await storage.createServiceRequest({
        officeId: 0,
        serviceId: 0,
        visitorName: fullName,
        visitorEmail: email,
        visitorPhone: phone || null,
        message: `Job Application for: ${jobTitle || job.title}\nDepartment: ${department || job.department}\nExperience: ${experience || 'Not specified'}\nResume: ${resume || 'Not provided'}\nCover Letter: ${coverLetter || 'Not provided'}`,
        status: 'pending',
      });

      res.status(201).json({ message: "Application submitted successfully" });
    } catch (error) {
      console.error("Error submitting job application:", error);
      res.status(400).json({ message: "Failed to submit application" });
    }
  });

  // =====================
  // VIDEO CALL PUBLIC ROUTES (Visitor)
  // =====================

  // Request a video call as visitor
  app.post('/api/public/offices/:officeId/video-calls', async (req, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      if (isNaN(officeId)) {
        return res.status(400).json({ message: "Invalid office ID" });
      }

      // Validate request body
      const parsed = videoCallRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid request" });
      }
      const { sessionId, visitorName } = parsed.data;

      // Verify office exists
      const office = await storage.getOffice(officeId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      // Generate cryptographically secure room ID
      const crypto = require('crypto');
      const roomId = `room_${crypto.randomBytes(16).toString('hex')}`;

      const call = await storage.createVideoCall({
        officeId,
        sessionId,
        visitorName: visitorName || null,
        roomId,
        status: 'pending',
      });

      res.status(201).json(call);
    } catch (error) {
      console.error("Error creating video call:", error);
      res.status(400).json({ message: "Failed to request video call" });
    }
  });

  // Get video call status as visitor
  app.get('/api/public/video-calls/:roomId', async (req, res) => {
    try {
      const roomId = req.params.roomId;

      // Validate roomId format
      const roomIdResult = roomIdSchema.safeParse(roomId);
      if (!roomIdResult.success) {
        return res.status(400).json({ message: "Invalid room ID format" });
      }

      const call = await storage.getVideoCallByRoom(roomId);

      if (!call) {
        return res.status(404).json({ message: "Video call not found" });
      }

      res.json(call);
    } catch (error) {
      console.error("Error fetching video call:", error);
      res.status(500).json({ message: "Failed to fetch video call status" });
    }
  });

  // End video call as visitor (requires sessionId verification)
  app.post('/api/public/video-calls/:roomId/end', async (req, res) => {
    try {
      const roomId = req.params.roomId;

      // Validate roomId format
      const roomIdResult = roomIdSchema.safeParse(roomId);
      if (!roomIdResult.success) {
        return res.status(400).json({ message: "Invalid room ID format" });
      }

      // Validate request body
      const parsed = videoCallEndSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Session ID is required" });
      }
      const { sessionId } = parsed.data;

      const call = await storage.getVideoCallByRoom(roomId);

      if (!call) {
        return res.status(404).json({ message: "Video call not found" });
      }

      // Verify the caller owns this session
      if (call.sessionId !== sessionId) {
        return res.status(403).json({ message: "Not authorized to end this call" });
      }

      const updated = await storage.endVideoCall(call.id);
      res.json(updated);
    } catch (error) {
      console.error("Error ending video call:", error);
      res.status(500).json({ message: "Failed to end video call" });
    }
  });

  // =====================
  // AUTHENTICATED OFFICE MANAGEMENT ROUTES (Manager & Admin only)
  // =====================

  // Get all offices for owner management
  app.get('/api/offices', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offices = await storage.getOffices(userId);
      res.json(offices);
    } catch (error) {
      console.error("Error fetching offices:", error);
      res.status(500).json({ message: "Failed to fetch offices" });
    }
  });

  // Create new office
  app.post('/api/offices', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, slug, description, category, location, contactEmail, contactPhone, workingHours } = req.body;

      // Check if slug already exists
      const existingOffice = await storage.getOfficeBySlug(slug);
      if (existingOffice) {
        return res.status(400).json({ message: "Office with this URL slug already exists" });
      }

      const data = insertOfficeSchema.parse({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: description || null,
        category: category || 'general',
        location: location || null,
        ownerId: userId,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        workingHours: workingHours || null,
        isPublished: false,
        subscriptionStatus: 'inactive',
      });
      const office = await storage.createOffice(data);
      res.status(201).json(office);
    } catch (error) {
      console.error("Error creating office:", error);
      res.status(400).json({ message: "Failed to create office" });
    }
  });

  // Update office
  app.patch('/api/offices/:id', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      if (office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateOffice(officeId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating office:", error);
      res.status(500).json({ message: "Failed to update office" });
    }
  });

  // Delete office
  app.delete('/api/offices/:id', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      if (office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteOffice(officeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting office:", error);
      res.status(500).json({ message: "Failed to delete office" });
    }
  });

  // Manage office services (Manager & Admin only)
  app.get('/api/offices/:officeId/services', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const services = await storage.getOfficeServices(officeId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/offices/:officeId/services', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const data = insertOfficeServiceSchema.parse({
        officeId,
        ...req.body,
      });
      const service = await storage.createOfficeService(data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: "Failed to create service" });
    }
  });

  app.patch('/api/offices/:officeId/services/:serviceId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const userId = req.user.claims.sub;

      const service = await storage.getOfficeService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const office = await storage.getOffice(service.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateOfficeService(serviceId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/offices/:officeId/services/:serviceId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const userId = req.user.claims.sub;

      const service = await storage.getOfficeService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const office = await storage.getOffice(service.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteOfficeService(serviceId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // =============================================
  // Company Department Routes (hierarchical structure)
  // =============================================

  // Get departments for an office/company
  app.get('/api/offices/:officeId/departments', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const departments = await storage.getCompanyDepartments(officeId);
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Create a department
  app.post('/api/offices/:officeId/departments', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const data = insertCompanyDepartmentSchema.parse({
        officeId,
        ...req.body,
      });
      const department = await storage.createCompanyDepartment(data);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(400).json({ message: "Failed to create department" });
    }
  });

  // Update a department
  app.patch('/api/offices/:officeId/departments/:departmentId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const userId = req.user.claims.sub;

      const department = await storage.getCompanyDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const office = await storage.getOffice(department.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateCompanyDepartment(departmentId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  // Delete a department
  app.delete('/api/offices/:officeId/departments/:departmentId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const userId = req.user.claims.sub;

      const department = await storage.getCompanyDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const office = await storage.getOffice(department.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteCompanyDepartment(departmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // =============================================
  // Company Section Routes (under departments)
  // =============================================

  // Get sections for a department
  app.get('/api/departments/:departmentId/sections', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const userId = req.user.claims.sub;

      const department = await storage.getCompanyDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const office = await storage.getOffice(department.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const sections = await storage.getCompanySections(departmentId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Create a section
  app.post('/api/departments/:departmentId/sections', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const userId = req.user.claims.sub;

      const department = await storage.getCompanyDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const office = await storage.getOffice(department.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const data = insertCompanySectionSchema.parse({
        departmentId,
        ...req.body,
      });
      const section = await storage.createCompanySection(data);
      res.status(201).json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(400).json({ message: "Failed to create section" });
    }
  });

  // Update a section
  app.patch('/api/sections/:sectionId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const userId = req.user.claims.sub;

      const section = await storage.getCompanySection(sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      const department = await storage.getCompanyDepartment(section.departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const office = await storage.getOffice(department.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateCompanySection(sectionId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  // Delete a section
  app.delete('/api/sections/:sectionId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const userId = req.user.claims.sub;

      const section = await storage.getCompanySection(sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      const department = await storage.getCompanyDepartment(section.departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const office = await storage.getOffice(department.officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteCompanySection(sectionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  // Manage office media (authenticated)
  app.post('/api/offices/:officeId/media', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const data = insertOfficeMediaSchema.parse({
        officeId,
        ...req.body,
      });
      const media = await storage.createOfficeMedia(data);
      res.status(201).json(media);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(400).json({ message: "Failed to create media" });
    }
  });

  app.delete('/api/offices/:officeId/media/:mediaId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.mediaId);
      const userId = req.user.claims.sub;
      const officeId = parseInt(req.params.officeId);

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteOfficeMedia(mediaId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Manage office posts (authenticated)
  app.post('/api/offices/:officeId/posts', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const data = insertOfficePostSchema.parse({
        officeId,
        authorId: userId,
        ...req.body,
      });
      const post = await storage.createOfficePost(data);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/offices/:officeId/posts/:postId', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user.claims.sub;
      const officeId = parseInt(req.params.officeId);

      const office = await storage.getOffice(officeId);
      if (!office || office.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteOfficePost(postId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Office chat for receptionist (authenticated - get all messages)
  app.get('/api/offices/:officeId/messages', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const messages = await storage.getOfficeMessages(officeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Reply to visitor message (receptionist)
  app.post('/api/offices/:officeId/messages', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { sessionId, content } = req.body;
      if (!sessionId || !content) {
        return res.status(400).json({ message: "Session ID and content are required" });
      }

      const data = insertOfficeMessageSchema.parse({
        officeId,
        sessionId,
        senderType: 'receptionist',
        senderId: userId,
        content: content.trim(),
      });
      const message = await storage.createOfficeMessage(data);

      // Mark visitor messages as read
      await storage.markOfficeMessagesRead(officeId, sessionId);

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Get unread message count for office
  app.get('/api/offices/:officeId/messages/unread', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const count = await storage.getUnreadMessageCount(officeId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark messages as read for a specific session
  app.post('/api/offices/:officeId/messages/:sessionId/read', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      const sessionId = req.params.sessionId;
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.markOfficeMessagesRead(officeId, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // =====================
  // AUTHENTICATED VIDEO CALL ROUTES (Receptionist/Owner)
  // =====================

  // Get pending video calls for office
  app.get('/api/offices/:officeId/video-calls', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeIdResult = officeIdParamSchema.safeParse(req.params.officeId);
      if (!officeIdResult.success) {
        return res.status(400).json({ message: officeIdResult.error.errors[0]?.message || "Invalid office ID" });
      }
      const officeId = officeIdResult.data;
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const calls = await storage.getPendingVideoCallsForOffice(officeId);
      res.json(calls);
    } catch (error) {
      console.error("Error fetching video calls:", error);
      res.status(500).json({ message: "Failed to fetch video calls" });
    }
  });

  // Accept/Start video call as receptionist
  app.post('/api/offices/:officeId/video-calls/:callId/accept', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeIdResult = officeIdParamSchema.safeParse(req.params.officeId);
      const callIdResult = callIdParamSchema.safeParse(req.params.callId);

      if (!officeIdResult.success) {
        return res.status(400).json({ message: officeIdResult.error.errors[0]?.message || "Invalid office ID" });
      }
      if (!callIdResult.success) {
        return res.status(400).json({ message: callIdResult.error.errors[0]?.message || "Invalid call ID" });
      }

      const officeId = officeIdResult.data;
      const callId = callIdResult.data;
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const call = await storage.getVideoCall(callId);
      if (!call || call.officeId !== officeId) {
        return res.status(404).json({ message: "Video call not found" });
      }

      if (call.status !== 'pending') {
        return res.status(400).json({ message: "Video call is no longer pending" });
      }

      const updated = await storage.startVideoCall(callId, userId);
      res.json(updated);
    } catch (error) {
      console.error("Error accepting video call:", error);
      res.status(500).json({ message: "Failed to accept video call" });
    }
  });

  // Decline video call as receptionist
  app.post('/api/offices/:officeId/video-calls/:callId/decline', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeIdResult = officeIdParamSchema.safeParse(req.params.officeId);
      const callIdResult = callIdParamSchema.safeParse(req.params.callId);

      if (!officeIdResult.success) {
        return res.status(400).json({ message: officeIdResult.error.errors[0]?.message || "Invalid office ID" });
      }
      if (!callIdResult.success) {
        return res.status(400).json({ message: callIdResult.error.errors[0]?.message || "Invalid call ID" });
      }

      const officeId = officeIdResult.data;
      const callId = callIdResult.data;
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const call = await storage.getVideoCall(callId);
      if (!call || call.officeId !== officeId) {
        return res.status(404).json({ message: "Video call not found" });
      }

      if (call.status !== 'pending') {
        return res.status(400).json({ message: "Video call is no longer pending" });
      }

      const updated = await storage.updateVideoCall(callId, { status: 'declined' });
      res.json(updated);
    } catch (error) {
      console.error("Error declining video call:", error);
      res.status(500).json({ message: "Failed to decline video call" });
    }
  });

  // End video call as receptionist
  app.post('/api/offices/:officeId/video-calls/:callId/end', isAuthenticated, requireRole("manager", "admin"), async (req: any, res) => {
    try {
      const officeIdResult = officeIdParamSchema.safeParse(req.params.officeId);
      const callIdResult = callIdParamSchema.safeParse(req.params.callId);

      if (!officeIdResult.success) {
        return res.status(400).json({ message: officeIdResult.error.errors[0]?.message || "Invalid office ID" });
      }
      if (!callIdResult.success) {
        return res.status(400).json({ message: callIdResult.error.errors[0]?.message || "Invalid call ID" });
      }

      const officeId = officeIdResult.data;
      const callId = callIdResult.data;
      const userId = req.user.claims.sub;

      const office = await storage.getOffice(officeId);
      if (!office || (office.ownerId !== userId && office.receptionistId !== userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const call = await storage.getVideoCall(callId);
      if (!call || call.officeId !== officeId) {
        return res.status(404).json({ message: "Video call not found" });
      }

      if (call.status !== 'active') {
        return res.status(400).json({ message: "Video call is not active" });
      }

      const updated = await storage.endVideoCall(callId);
      res.json(updated);
    } catch (error) {
      console.error("Error ending video call:", error);
      res.status(500).json({ message: "Failed to end video call" });
    }
  });

  // ============================================
  // Daily Statuses (Stories) API
  // ============================================

  // Get active statuses (not expired)
  app.get('/api/statuses', isAuthenticated, async (req: any, res) => {
    try {
      const activeStatuses = await storage.getActiveStatuses();

      // Get author info for each status
      const statusesWithAuthors = await Promise.all(
        activeStatuses.map(async (status) => {
          const author = await storage.getUser(status.authorId);
          const office = status.officeId ? await storage.getOffice(status.officeId) : null;
          const replyCount = (await storage.getStatusReplies(status.id)).length;
          const likeCount = await storage.getStatusLikeCount(status.id);

          return {
            ...status,
            author: author ? {
              id: author.id,
              name: `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Anonymous',
              avatar: author.profileImageUrl
            } : null,
            office: office ? {
              id: office.id,
              name: office.name,
              logo: office.logoUrl
            } : null,
            replyCount,
            likeCount
          };
        })
      );

      res.json(statusesWithAuthors);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      res.status(500).json({ message: "Failed to fetch statuses" });
    }
  });

  // Get a single status
  app.get('/api/statuses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      const author = await storage.getUser(status.authorId);
      const office = status.officeId ? await storage.getOffice(status.officeId) : null;
      const userId = req.user.claims.sub;

      // Record view if not the author
      if (status.authorId !== userId) {
        const hasViewed = await storage.hasUserViewedStatus(statusId, userId);
        if (!hasViewed) {
          await storage.addStatusView({ statusId, viewerId: userId });
          await storage.incrementStatusViews(statusId);
        }
      }

      // Get view count, like count, and status
      const views = await storage.getStatusViews(statusId);
      const likeCount = await storage.getStatusLikeCount(statusId);
      const isLiked = await storage.hasUserLikedStatus(statusId, userId);
      const replyCount = (await storage.getStatusReplies(statusId)).length;
      const isFollowingOffice = office ? await storage.isFollowingOffice(office.id, userId) : false;

      res.json({
        ...status,
        author: author ? {
          id: author.id,
          name: `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Anonymous',
          avatar: author.profileImageUrl
        } : null,
        office: office ? {
          id: office.id,
          name: office.name,
          logo: office.logoUrl
        } : null,
        viewCount: views.length,
        likeCount,
        isLiked,
        replyCount,
        isFollowingOffice
      });
    } catch (error) {
      console.error("Error fetching status:", error);
      res.status(500).json({ message: "Failed to fetch status" });
    }
  });

  // Create a new status
  app.post('/api/statuses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const statusData = insertStatusSchema.safeParse({
        ...req.body,
        authorId: userId,
        expiresAt
      });

      if (!statusData.success) {
        return res.status(400).json({
          message: "Invalid status data",
          errors: statusData.error.errors
        });
      }

      const newStatus = await storage.createStatus(statusData.data);
      res.status(201).json(newStatus);
    } catch (error) {
      console.error("Error creating status:", error);
      res.status(500).json({ message: "Failed to create status" });
    }
  });

  // Delete a status
  app.delete('/api/statuses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      const userId = req.user.claims.sub;
      if (status.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this status" });
      }

      await storage.deleteStatus(statusId);
      res.json({ message: "Status deleted" });
    } catch (error) {
      console.error("Error deleting status:", error);
      res.status(500).json({ message: "Failed to delete status" });
    }
  });

  // Get replies for a status
  app.get('/api/statuses/:id/replies', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      const replies = await storage.getStatusReplies(statusId);

      // Get sender info for each reply
      const repliesWithSenders = await Promise.all(
        replies.map(async (reply) => {
          const sender = await storage.getUser(reply.senderId);
          return {
            ...reply,
            sender: sender ? {
              id: sender.id,
              name: `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Anonymous',
              avatar: sender.profileImageUrl
            } : null
          };
        })
      );

      res.json(repliesWithSenders);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  // Create a reply to a status
  app.post('/api/statuses/:id/replies', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      const userId = req.user.claims.sub;

      const replyData = insertStatusReplySchema.safeParse({
        statusId,
        senderId: userId,
        message: req.body.message
      });

      if (!replyData.success) {
        return res.status(400).json({
          message: "Invalid reply data",
          errors: replyData.error.errors
        });
      }

      const newReply = await storage.createStatusReply(replyData.data);

      // Get sender info
      const sender = await storage.getUser(userId);

      res.status(201).json({
        ...newReply,
        sender: sender ? {
          id: sender.id,
          name: `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Anonymous',
          avatar: sender.profileImageUrl
        } : null
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Like a status
  app.post('/api/statuses/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      const userId = req.user.claims.sub;

      // Check if already liked
      const existingLike = await storage.getStatusLike(statusId, userId);
      if (existingLike) {
        return res.status(400).json({ message: "Already liked this status" });
      }

      const like = await storage.createStatusLike({ statusId, userId });
      res.status(201).json(like);
    } catch (error) {
      console.error("Error liking status:", error);
      res.status(500).json({ message: "Failed to like status" });
    }
  });

  // Unlike a status
  app.delete('/api/statuses/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const userId = req.user.claims.sub;

      const deleted = await storage.deleteStatusLike(statusId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Like not found" });
      }

      res.json({ message: "Like removed" });
    } catch (error) {
      console.error("Error unliking status:", error);
      res.status(500).json({ message: "Failed to unlike status" });
    }
  });

  // Get status views
  app.get('/api/statuses/:id/views', isAuthenticated, async (req: any, res) => {
    try {
      const statusId = parseInt(req.params.id);
      if (isNaN(statusId)) {
        return res.status(400).json({ message: "Invalid status ID" });
      }

      const status = await storage.getStatus(statusId);
      if (!status) {
        return res.status(404).json({ message: "Status not found" });
      }

      const userId = req.user.claims.sub;
      if (status.authorId !== userId) {
        return res.status(403).json({ message: "Only the author can view who saw the status" });
      }

      const views = await storage.getStatusViews(statusId);

      // Get viewer info
      const viewsWithViewers = await Promise.all(
        views.map(async (view) => {
          const viewer = await storage.getUser(view.viewerId);
          return {
            ...view,
            viewer: viewer ? {
              id: viewer.id,
              name: `${viewer.firstName || ''} ${viewer.lastName || ''}`.trim() || 'Anonymous',
              avatar: viewer.profileImageUrl
            } : null
          };
        })
      );

      res.json(viewsWithViewers);
    } catch (error) {
      console.error("Error fetching views:", error);
      res.status(500).json({ message: "Failed to fetch views" });
    }
  });

  // ============================================
  // Office Follow API
  // ============================================

  // Follow an office
  app.post('/api/offices/:officeId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      if (isNaN(officeId)) {
        return res.status(400).json({ message: "Invalid office ID" });
      }

      const office = await storage.getOffice(officeId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const userId = req.user.claims.sub;

      const isFollowing = await storage.isFollowingOffice(officeId, userId);
      if (isFollowing) {
        return res.status(400).json({ message: "Already following this office" });
      }

      const follow = await storage.followOffice(officeId, userId);
      res.status(201).json({
        message: "Now following office",
        followerCount: await storage.getOfficeFollowerCount(officeId)
      });
    } catch (error) {
      console.error("Error following office:", error);
      res.status(500).json({ message: "Failed to follow office" });
    }
  });

  // Unfollow an office
  app.delete('/api/offices/:officeId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      if (isNaN(officeId)) {
        return res.status(400).json({ message: "Invalid office ID" });
      }

      const office = await storage.getOffice(officeId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const userId = req.user.claims.sub;

      const isFollowing = await storage.isFollowingOffice(officeId, userId);
      if (!isFollowing) {
        return res.status(400).json({ message: "Not following this office" });
      }

      await storage.unfollowOffice(officeId, userId);
      res.json({
        message: "Unfollowed office",
        followerCount: await storage.getOfficeFollowerCount(officeId)
      });
    } catch (error) {
      console.error("Error unfollowing office:", error);
      res.status(500).json({ message: "Failed to unfollow office" });
    }
  });

  // Check if following an office
  app.get('/api/offices/:officeId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const officeId = parseInt(req.params.officeId);
      if (isNaN(officeId)) {
        return res.status(400).json({ message: "Invalid office ID" });
      }

      const office = await storage.getOffice(officeId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const userId = req.user.claims.sub;

      const isFollowing = await storage.isFollowingOffice(officeId, userId);
      const followerCount = await storage.getOfficeFollowerCount(officeId);

      res.json({ isFollowing, followerCount });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // =====================
  // Internal Email Routes
  // =====================

  // Get inbox emails
  app.get('/api/emails/inbox', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getInboxEmails(userId);

      // Enhance with sender info
      const emailsWithSender = await Promise.all(emails.map(async (email) => {
        const sender = await storage.getUser(email.senderId);
        return { ...email, sender };
      }));

      res.json(emailsWithSender);
    } catch (error) {
      console.error("Error fetching inbox:", error);
      res.status(500).json({ message: "Failed to fetch inbox" });
    }
  });

  // Get sent emails
  app.get('/api/emails/sent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getSentEmails(userId);

      // Enhance with recipient info
      const emailsWithRecipient = await Promise.all(emails.map(async (email) => {
        const recipient = await storage.getUser(email.recipientId);
        return { ...email, recipient };
      }));

      res.json(emailsWithRecipient);
    } catch (error) {
      console.error("Error fetching sent emails:", error);
      res.status(500).json({ message: "Failed to fetch sent emails" });
    }
  });

  // Get draft emails
  app.get('/api/emails/drafts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getDraftEmails(userId);

      const emailsWithRecipient = await Promise.all(emails.map(async (email) => {
        const recipient = await storage.getUser(email.recipientId);
        return { ...email, recipient };
      }));

      res.json(emailsWithRecipient);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ message: "Failed to fetch drafts" });
    }
  });

  // Get starred emails
  app.get('/api/emails/starred', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getStarredEmails(userId);

      const emailsWithUsers = await Promise.all(emails.map(async (email) => {
        const sender = await storage.getUser(email.senderId);
        const recipient = await storage.getUser(email.recipientId);
        return { ...email, sender, recipient };
      }));

      res.json(emailsWithUsers);
    } catch (error) {
      console.error("Error fetching starred emails:", error);
      res.status(500).json({ message: "Failed to fetch starred emails" });
    }
  });

  // Get archived emails
  app.get('/api/emails/archived', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getArchivedEmails(userId);

      const emailsWithUsers = await Promise.all(emails.map(async (email) => {
        const sender = await storage.getUser(email.senderId);
        const recipient = await storage.getUser(email.recipientId);
        return { ...email, sender, recipient };
      }));

      res.json(emailsWithUsers);
    } catch (error) {
      console.error("Error fetching archived emails:", error);
      res.status(500).json({ message: "Failed to fetch archived emails" });
    }
  });

  // Get unread email count
  app.get('/api/emails/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadEmailCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Get single email
  app.get('/api/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      const email = await storage.getInternalEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const userId = req.user.claims.sub;
      if (email.senderId !== userId && email.recipientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Mark as read if recipient is viewing
      if (email.recipientId === userId && !email.isRead) {
        await storage.markEmailAsRead(emailId);
      }

      const sender = await storage.getUser(email.senderId);
      const recipient = await storage.getUser(email.recipientId);

      res.json({ ...email, sender, recipient });
    } catch (error) {
      console.error("Error fetching email:", error);
      res.status(500).json({ message: "Failed to fetch email" });
    }
  });

  // Send or save draft email
  app.post('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipientId, subject, body, isDraft } = req.body;

      if (!recipientId || !subject) {
        return res.status(400).json({ message: "Recipient and subject are required" });
      }

      // Verify recipient exists
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        return res.status(400).json({ message: "Recipient not found" });
      }

      const emailData = {
        senderId: userId,
        recipientId,
        subject,
        body: body || "",
        isDraft: isDraft || false,
      };

      const email = await storage.createInternalEmail(emailData);
      res.status(201).json(email);
    } catch (error) {
      console.error("Error creating email:", error);
      res.status(400).json({ message: "Failed to create email" });
    }
  });

  // Update email (for drafts)
  app.patch('/api/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      const email = await storage.getInternalEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const userId = req.user.claims.sub;
      if (email.senderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { recipientId, subject, body, isDraft } = req.body;

      const updated = await storage.updateInternalEmail(emailId, {
        recipientId: recipientId || email.recipientId,
        subject: subject || email.subject,
        body: body !== undefined ? body : email.body,
        isDraft: isDraft !== undefined ? isDraft : email.isDraft,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(400).json({ message: "Failed to update email" });
    }
  });

  // Delete email
  app.delete('/api/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      const email = await storage.getInternalEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const userId = req.user.claims.sub;
      if (email.senderId !== userId && email.recipientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteInternalEmail(emailId);
      res.json({ message: "Email deleted" });
    } catch (error) {
      console.error("Error deleting email:", error);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  // Toggle starred
  app.post('/api/emails/:id/star', isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      const email = await storage.getInternalEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const userId = req.user.claims.sub;
      if (email.senderId !== userId && email.recipientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.toggleEmailStarred(emailId);
      const updated = await storage.getInternalEmail(emailId);
      res.json(updated);
    } catch (error) {
      console.error("Error toggling star:", error);
      res.status(500).json({ message: "Failed to toggle star" });
    }
  });

  // Archive email
  app.post('/api/emails/:id/archive', isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      const email = await storage.getInternalEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const userId = req.user.claims.sub;
      if (email.senderId !== userId && email.recipientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.moveEmailToArchive(emailId);
      res.json({ message: "Email archived" });
    } catch (error) {
      console.error("Error archiving email:", error);
      res.status(500).json({ message: "Failed to archive email" });
    }
  });

  // Mark as read
  app.post('/api/emails/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      const email = await storage.getInternalEmail(emailId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const userId = req.user.claims.sub;
      if (email.recipientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.markEmailAsRead(emailId);
      res.json({ message: "Email marked as read" });
    } catch (error) {
      console.error("Error marking as read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // =====================
  // n8n Internal Email Webhook (Public endpoint for n8n to send internal emails)
  // =====================
  const n8nInternalEmailSchema = z.object({
    recipientEmail: z.string().email("Valid email required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    taskId: z.number().optional(),
    automationId: z.number().optional(),
  });

  app.post('/api/n8n/internal-email', async (req, res) => {
    try {
      const validationResult = n8nInternalEmailSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }

      const { recipientEmail, subject, body, taskId, automationId } = validationResult.data;

      // Find recipient user by email
      const recipient = await storage.getUserByEmail(recipientEmail);

      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found with email: " + recipientEmail });
      }

      // Use system user or first admin as sender
      const allUsers = await storage.getAllUsers();
      const admins = allUsers.filter(u => u.role === 'admin');
      const systemSender = admins[0] || allUsers[0];

      if (!systemSender) {
        return res.status(500).json({ message: "No system sender available" });
      }

      // Create internal email
      const email = await storage.createInternalEmail({
        senderId: systemSender.id,
        recipientId: recipient.id,
        subject,
        body,
        isDraft: false,
      });

      // Also create a notification
      await storage.createNotification({
        userId: recipient.id,
        type: 'n8n_task',
        title: subject,
        message: body.substring(0, 200),
        read: false,
        data: { taskId, automationId, emailId: email.id },
      });

      // Update automation status if provided
      if (automationId) {
        await storage.updateTaskAutomation(automationId, {
          status: 'completed',
          aiMetadata: { emailId: email.id, sentAt: new Date().toISOString(), internalEmailSent: true }
        });
      }

      console.log(`n8n internal email sent to ${recipientEmail}: ${subject}`);
      res.status(201).json({
        success: true,
        message: "Internal email sent successfully",
        emailId: email.id
      });
    } catch (error) {
      console.error("Error processing n8n internal email:", error);
      res.status(500).json({ message: "Failed to send internal email" });
    }
  });

  // =====================
  // n8n AI Task Processing (AI-powered task research and response)
  // =====================
  const n8nAiTaskSchema = z.object({
    taskId: z.number(),
    automationId: z.number(),
    title: z.string(),
    description: z.string().nullable().optional(),
    priority: z.string().optional(),
    assigneeEmail: z.string().email().optional(),
  });

  app.post('/api/n8n/ai-process', async (req, res) => {
    try {
      const validationResult = n8nAiTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }

      const { taskId, automationId, title, description, priority, assigneeEmail } = validationResult.data;

      // Import OpenAI
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Create AI prompt based on task
      const taskPrompt = `أنت مساعد ذكي في مكتب افتراضي. تم تكليفك بالمهمة التالية:

العنوان: ${title}
${description ? `الوصف: ${description}` : ''}
${priority ? `الأولوية: ${priority}` : ''}

من فضلك قم بـ:
1. تحليل المهمة المطلوبة
2. البحث وتقديم معلومات مفيدة
3. تقديم إجابة شاملة ومفصلة
4. اقتراح خطوات العمل التالية إن وجدت

أجب باللغة العربية بشكل مهني ومفصل.`;

      console.log(`Processing AI task: ${title}`);

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "أنت مساعد ذكي متخصص في البحث والتحليل. تقدم إجابات دقيقة ومفصلة باللغة العربية." },
          { role: "user", content: taskPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "لم أتمكن من معالجة هذه المهمة.";

      // Update task automation with AI response
      await storage.updateTaskAutomation(automationId, {
        status: 'ready',
        aiSuggestion: aiResponse,
        aiMetadata: {
          processedAt: new Date().toISOString(),
          model: "gpt-4o-mini",
          tokensUsed: completion.usage?.total_tokens || 0
        }
      });

      // Find recipient and send internal email with AI response
      let recipientId: string | null = null;
      if (assigneeEmail) {
        const recipient = await storage.getUserByEmail(assigneeEmail);
        if (recipient) {
          recipientId = recipient.id;
        }
      }

      // If no assignee, send to first admin
      if (!recipientId) {
        const allUsers = await storage.getAllUsers();
        const admins = allUsers.filter(u => u.role === 'admin');
        recipientId = admins[0]?.id || allUsers[0]?.id || null;
      }

      if (recipientId) {
        const allUsers = await storage.getAllUsers();
        const systemSender = allUsers.find(u => u.role === 'admin') || allUsers[0];

        if (systemSender) {
          // Send internal email with AI response
          const email = await storage.createInternalEmail({
            senderId: systemSender.id,
            recipientId: recipientId,
            subject: `نتيجة البحث: ${title}`,
            body: `تم معالجة المهمة بواسطة الذكاء الاصطناعي:\n\n${aiResponse}\n\n---\nتم إرسالها تلقائياً من n8n + AI`,
            isDraft: false,
          });

          // Create notification
          await storage.createNotification({
            userId: recipientId,
            type: 'ai_task_completed',
            title: `اكتمل البحث: ${title}`,
            message: aiResponse.substring(0, 200) + '...',
            read: false,
            data: { taskId, automationId, emailId: email.id },
          });
        }
      }

      console.log(`AI task processed successfully: ${title}`);
      res.status(200).json({
        success: true,
        message: "Task processed by AI successfully",
        aiResponse: aiResponse.substring(0, 500) + '...',
        automationId
      });
    } catch (error) {
      console.error("Error processing AI task:", error);
      res.status(500).json({ message: "Failed to process task with AI" });
    }
  });

  // =====================
  // Service Sales System Routes
  // =====================

  // Generate unique slug from name
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + crypto.randomBytes(4).toString('hex');
  }

  // Generate share token
  function generateShareToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Get all services for office renter
  app.get('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'office_renter' && user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Only office renters can manage services" });
      }

      const services = await storage.getServicesByOwner(userId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get single service by ID
  app.get('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Create new service
  const createServiceSchema = z.object({
    name: z.string().min(1).max(200),
    nameAr: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    descriptionAr: z.string().max(5000).optional(),
    price: z.number().int().positive(),
    currency: z.string().default('SAR'),
    category: z.string().max(100).optional(),
    imageUrl: z.string().url().optional(),
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'office_renter' && user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Only office renters can create services" });
      }

      const validationResult = createServiceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid service data",
          errors: validationResult.error.errors
        });
      }

      const data = validationResult.data;

      // Get user's office
      const office = await storage.getOfficeByOwnerId(userId);
      if (!office) {
        return res.status(400).json({ message: "You must have an office to create services" });
      }

      const service = await storage.createService({
        ...data,
        officeId: office.id,
        ownerUserId: userId,
        slug: generateSlug(data.name),
        shareToken: generateShareToken(),
        isActive: true,
      });

      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Update service
  app.patch('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const serviceId = parseInt(req.params.id);

      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (service.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only update your own services" });
      }

      const updateData = req.body;
      const updatedService = await storage.updateService(serviceId, updateData);
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Delete service
  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const serviceId = parseInt(req.params.id);

      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (service.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only delete your own services" });
      }

      await storage.deleteService(serviceId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Public: Get all active paid services (for visitor services page)
  app.get('/api/public/paid-services', async (req, res) => {
    try {
      const allServices = await storage.getAllServices();
      const activeServices = allServices.filter(s => s.isActive && s.shareToken);
      res.json(activeServices);
    } catch (error) {
      console.error("Error fetching public paid services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Public: Get service by share token (for customers)
  app.get('/api/public/services/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const service = await storage.getServiceByShareToken(token);

      if (!service || !service.isActive) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get office info
      const office = await storage.getOffice(service.officeId);

      res.json({
        ...service,
        office: office ? {
          id: office.id,
          name: office.name,
          logoUrl: office.logoUrl,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching public service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Public: Create order and checkout session by share token
  const publicCheckoutSchema = z.object({
    clientName: z.string().min(1).max(200),
    clientEmail: z.string().email(),
    clientPhone: z.string().max(20).optional(),
  });

  app.post('/api/public/services/:token/checkout', async (req, res) => {
    try {
      const { token } = req.params;
      const validationResult = publicCheckoutSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid checkout data",
          errors: validationResult.error.errors
        });
      }

      const { clientName, clientEmail, clientPhone } = validationResult.data;

      // Get service by token
      const service = await storage.getServiceByShareToken(token);
      if (!service || !service.isActive) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Create the order
      const order = await storage.createServiceOrder({
        serviceId: service.id,
        officeId: service.officeId,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        quotedPrice: service.price,
        currency: service.currency || 'SAR',
        status: 'pending',
        notes: null,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        stripeInvoiceUrl: null,
        chatThreadId: null,
        createdByUserId: null,
      });

      // Get Stripe instance
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing is not configured" });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: (service.currency || 'SAR').toLowerCase(),
            product_data: {
              name: service.name,
              description: service.description || undefined,
            },
            unit_amount: service.price,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/payment-success?order=${order.id}`,
        cancel_url: `${baseUrl}/s/${token}`,
        customer_email: clientEmail,
        metadata: {
          orderId: order.id.toString(),
          serviceId: service.id.toString(),
        },
      });

      // Update order with checkout session ID
      await storage.updateServiceOrder(order.id, {
        stripeCheckoutSessionId: session.id,
        status: 'awaiting_payment',
      });

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Error creating public checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // =====================
  // Service Orders Routes
  // =====================

  // Get orders for office owner
  app.get('/api/service-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getServiceOrdersByOwner(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Create order (can be public or authenticated)
  const createOrderSchema = z.object({
    serviceToken: z.string(),
    clientName: z.string().min(1).max(200),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().max(20).optional(),
    notes: z.string().max(1000).optional(),
  });

  app.post('/api/service-orders', async (req: any, res) => {
    try {
      const validationResult = createOrderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid order data",
          errors: validationResult.error.errors
        });
      }

      const { serviceToken, clientName, clientEmail, clientPhone, notes } = validationResult.data;

      // Get service by token
      const service = await storage.getServiceByShareToken(serviceToken);
      if (!service || !service.isActive) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Create order
      const order = await storage.createServiceOrder({
        serviceId: service.id,
        officeId: service.officeId,
        clientName,
        clientEmail,
        clientPhone,
        notes,
        quotedPrice: service.price,
        currency: service.currency || 'SAR',
        status: 'pending',
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Create checkout session for order payment
  app.post('/api/service-orders/:id/checkout', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getServiceOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === 'paid') {
        return res.status(400).json({ message: "Order already paid" });
      }

      const service = await storage.getService(order.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Import Stripe client
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();

      // Get base URL
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: order.currency?.toLowerCase() || 'sar',
            product_data: {
              name: service.name,
              description: service.description || undefined,
            },
            unit_amount: order.quotedPrice * 100, // Convert to cents/halalas
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/service/payment-success?order=${orderId}`,
        cancel_url: `${baseUrl}/service/${service.shareToken}?cancelled=true`,
        customer_email: order.clientEmail || undefined,
        metadata: {
          orderId: orderId.toString(),
          serviceId: service.id.toString(),
        },
      });

      // Update order with checkout session ID
      await storage.updateServiceOrder(orderId, {
        stripeCheckoutSessionId: session.id,
        status: 'awaiting_payment',
      });

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Update order status (for office owner)
  app.patch('/api/service-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orderId = parseInt(req.params.id);

      const order = await storage.getServiceOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify ownership via service
      const service = await storage.getService(order.serviceId);
      if (!service || service.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only update orders for your services" });
      }

      const { status, notes } = req.body;
      const updatedOrder = await storage.updateServiceOrder(orderId, { status, notes });
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Get service share link for chat
  app.get('/api/services/:id/share-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const serviceId = parseInt(req.params.id);

      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (service.ownerUserId !== userId) {
        return res.status(403).json({ message: "You can only get links for your own services" });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const shareLink = `${baseUrl}/service/${service.shareToken}`;

      res.json({
        shareLink,
        shareToken: service.shareToken,
        serviceName: service.name,
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      res.status(500).json({ message: "Failed to generate share link" });
    }
  });

  // Stripe publishable key endpoint
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe key:", error);
      res.status(500).json({ message: "Failed to get payment configuration" });
    }
  });

  return httpServer;
}
