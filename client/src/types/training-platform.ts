/**
 * Training Platform - TypeScript Type Definitions
 * تعريفات الأنواع لمنصة التدريب
 */

// ============================================
// User & Authentication Types
// أنواع المستخدم والمصادقة
// ============================================

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role: UserRole;
    language: Language;
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole = 'admin' | 'trainer' | 'participant';
export type Language = 'ar' | 'en';

// ============================================
// Training Session Types
// أنواع جلسات التدريب
// ============================================

export interface TrainingSession {
    id: string;
    title: BilingualText;
    description: BilingualText;
    instructor: Instructor;
    scheduledTime: Date;
    duration: number; // minutes
    status: SessionStatus;
    maxParticipants: number;
    currentParticipants: number;
    isRecording: boolean;
    recordingUrl?: string;
    thumbnailUrl?: string;
    category: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface Instructor {
    id: string;
    name: string;
    avatar: string;
    bio?: BilingualText;
    expertise: string[];
    rating: number;
    totalSessions: number;
}

// ============================================
// Lesson Types
// أنواع الدروس
// ============================================

export interface Lesson {
    id: string;
    title: BilingualText;
    description: BilingualText;
    thumbnail: string;
    videoUrl: string;
    instructor: Instructor;
    duration: string; // "HH:MM:SS"
    publishedDate: Date;
    viewCount: number;
    rating: number;
    category: string;
    tags: string[];
    resources: LessonResource[];
    isNew?: boolean;
    isFeatured?: boolean;
}

export interface LessonResource {
    id: string;
    name: string;
    type: ResourceType;
    url: string;
    size: number; // bytes
}

export type ResourceType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'video' | 'image' | 'other';

export interface LessonProgress {
    lessonId: string;
    userId: string;
    progress: number; // 0-100
    lastWatchedPosition: number; // seconds
    completed: boolean;
    completedAt?: Date;
    rating?: number;
    review?: string;
}

// ============================================
// Chat Types
// أنواع الدردشة
// ============================================

export interface ChatMessage {
    id: string;
    sender: MessageSender;
    content: MessageContent;
    timestamp: Date;
    isPinned?: boolean;
    isAnnouncement?: boolean;
    reactions?: MessageReaction[];
    replyTo?: string; // message ID
}

export interface MessageSender {
    id: string;
    name: string;
    avatar: string;
    role: UserRole;
}

export interface MessageContent {
    text?: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
}

export interface MessageReaction {
    emoji: string;
    count: number;
    users: string[]; // user IDs
}

export type ChatEvent =
    | { type: 'message'; data: ChatMessage }
    | { type: 'typing'; data: { userId: string; isTyping: boolean } }
    | { type: 'pin'; data: { messageId: string } }
    | { type: 'delete'; data: { messageId: string } }
    | { type: 'reaction'; data: { messageId: string; emoji: string; userId: string } };

// ============================================
// Video & Streaming Types
// أنواع الفيديو والبث
// ============================================

export interface VideoStream {
    peerId: string;
    stream: MediaStream;
    userId: string;
    userName: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
}

export interface StreamQuality {
    resolution: VideoResolution;
    frameRate: number;
    bitrate: number;
    codec: string;
}

export type VideoResolution = '360p' | '480p' | '720p' | '1080p' | '4K';

export interface ConnectionQuality {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    bandwidth: number; // Mbps
    latency: number; // ms
    packetLoss: number; // percentage
}

// ============================================
// Engagement & Analytics Types
// أنواع المشاركة والتحليلات
// ============================================

export interface EngagementMetrics {
    attentionSpan: number[]; // percentage over time
    participationRate: number; // percentage
    raiseHandCount: number;
    chatActivity: number; // messages count
    averageViewTime: string; // "HH:MM:SS"
    pollResponses: number;
    questionCount: number;
}

export interface SessionAnalytics {
    sessionId: string;
    totalParticipants: number;
    peakParticipants: number;
    averageDuration: number; // minutes
    completionRate: number; // percentage
    engagement: EngagementMetrics;
    feedback: SessionFeedback[];
    recordingViews: number;
}

export interface SessionFeedback {
    userId: string;
    rating: number; // 1-5
    comment?: string;
    timestamp: Date;
}

// ============================================
// Participant Types
// أنواع المشاركين
// ============================================

export interface Participant {
    id: string;
    user: User;
    joinedAt: Date;
    isHandRaised: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    connectionQuality: ConnectionQuality;
    engagementScore: number; // 0-100
}

export interface ParticipantAction {
    type: ParticipantActionType;
    participantId: string;
    timestamp: Date;
    data?: any;
}

export type ParticipantActionType =
    | 'join'
    | 'leave'
    | 'raise_hand'
    | 'lower_hand'
    | 'mute'
    | 'unmute'
    | 'video_on'
    | 'video_off'
    | 'chat_message'
    | 'reaction';

// ============================================
// Trainer Control Types
// أنواع تحكم المدرب
// ============================================

export interface TrainerControls {
    canRecord: boolean;
    canScreenShare: boolean;
    canUseWhiteboard: boolean;
    canCreatePolls: boolean;
    canManageBreakoutRooms: boolean;
    canMuteParticipants: boolean;
    canRemoveParticipants: boolean;
    canPinMessages: boolean;
    canDeleteMessages: boolean;
    canSendAnnouncements: boolean;
}

export interface WhiteboardState {
    isActive: boolean;
    currentTool: WhiteboardTool;
    color: string;
    strokeWidth: number;
    elements: WhiteboardElement[];
}

export type WhiteboardTool = 'pen' | 'eraser' | 'text' | 'shape' | 'select';

export interface WhiteboardElement {
    id: string;
    type: 'path' | 'text' | 'rectangle' | 'circle' | 'line';
    data: any;
    color: string;
    strokeWidth: number;
}

export interface Poll {
    id: string;
    question: BilingualText;
    options: PollOption[];
    allowMultiple: boolean;
    isAnonymous: boolean;
    duration?: number; // seconds
    createdAt: Date;
    endsAt?: Date;
    status: 'active' | 'ended';
}

export interface PollOption {
    id: string;
    text: BilingualText;
    votes: number;
    voters?: string[]; // user IDs (if not anonymous)
}

export interface BreakoutRoom {
    id: string;
    name: string;
    participants: string[]; // user IDs
    duration: number; // minutes
    startedAt?: Date;
    status: 'pending' | 'active' | 'ended';
}

// ============================================
// Notification Types
// أنواع الإشعارات
// ============================================

export interface Notification {
    id: string;
    type: NotificationType;
    title: BilingualText;
    message: BilingualText;
    timestamp: Date;
    isRead: boolean;
    actionUrl?: string;
    data?: any;
}

export type NotificationType =
    | 'session_starting'
    | 'session_ended'
    | 'new_message'
    | 'hand_raised'
    | 'poll_created'
    | 'breakout_room_assigned'
    | 'recording_ready'
    | 'new_lesson'
    | 'achievement';

// ============================================
// Settings Types
// أنواع الإعدادات
// ============================================

export interface UserSettings {
    language: Language;
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationSettings;
    video: VideoSettings;
    audio: AudioSettings;
    privacy: PrivacySettings;
}

export interface NotificationSettings {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sessionReminders: boolean;
    chatMessages: boolean;
    announcements: boolean;
}

export interface VideoSettings {
    defaultQuality: VideoResolution;
    autoQuality: boolean;
    mirrorVideo: boolean;
    virtualBackground?: string;
}

export interface AudioSettings {
    inputDevice?: string;
    outputDevice?: string;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

export interface PrivacySettings {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    shareProgressWithInstructor: boolean;
}

// ============================================
// API Response Types
// أنواع استجابات API
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: BilingualText;
}

export interface ApiError {
    code: string;
    message: BilingualText;
    details?: any;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// ============================================
// Utility Types
// أنواع مساعدة
// ============================================

export interface BilingualText {
    ar: string;
    en: string;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export interface FileUpload {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    url?: string;
    error?: string;
}

export interface SearchFilters {
    query?: string;
    category?: string;
    tags?: string[];
    dateRange?: DateRange;
    rating?: number;
    instructor?: string;
    sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'alphabetical';
}

// ============================================
// WebSocket Event Types
// أنواع أحداث WebSocket
// ============================================

export type WebSocketEvent =
    | { type: 'session:join'; data: { sessionId: string; userId: string } }
    | { type: 'session:leave'; data: { sessionId: string; userId: string } }
    | { type: 'chat:message'; data: ChatMessage }
    | { type: 'chat:typing'; data: { userId: string; isTyping: boolean } }
    | { type: 'participant:hand_raised'; data: { userId: string } }
    | { type: 'participant:hand_lowered'; data: { userId: string } }
    | { type: 'stream:started'; data: { userId: string; streamId: string } }
    | { type: 'stream:ended'; data: { userId: string; streamId: string } }
    | { type: 'poll:created'; data: Poll }
    | { type: 'poll:vote'; data: { pollId: string; optionId: string; userId: string } }
    | { type: 'whiteboard:update'; data: WhiteboardState }
    | { type: 'breakout:assigned'; data: { roomId: string; participants: string[] } };

// ============================================
// Component Props Types
// أنواع خصائص المكونات
// ============================================

export interface TrainingDashboardProps {
    sessionId?: string;
    isTrainer?: boolean;
    initialLanguage?: Language;
}

export interface LiveChatPanelProps {
    sessionId: string;
    isTrainer?: boolean;
    currentUserId: string;
    onSendMessage: (message: string, imageUrl?: string) => void;
    onPinMessage?: (messageId: string) => void;
    onDeleteMessage?: (messageId: string) => void;
    onMuteParticipant?: (userId: string) => void;
}

export interface TrainerControlPanelProps {
    sessionId: string;
    viewerCount: number;
    isRecording: boolean;
    sessionDuration: string;
    onToggleRecording: () => void;
    onScreenShare: () => void;
    onOpenWhiteboard: () => void;
    onCreatePoll: () => void;
    onManageBreakout: () => void;
}

export interface SavedLessonsProps {
    userId: string;
    filters?: SearchFilters;
    onLessonSelect?: (lessonId: string) => void;
}

// ============================================
// State Management Types
// أنواع إدارة الحالة
// ============================================

export interface AppState {
    user: User | null;
    session: TrainingSession | null;
    participants: Participant[];
    messages: ChatMessage[];
    notifications: Notification[];
    settings: UserSettings;
    isLoading: boolean;
    error: ApiError | null;
}

export interface SessionState {
    id: string;
    status: SessionStatus;
    participants: Participant[];
    streams: VideoStream[];
    chat: ChatMessage[];
    polls: Poll[];
    breakoutRooms: BreakoutRoom[];
    whiteboard: WhiteboardState;
    analytics: EngagementMetrics;
}

// ============================================
// Hook Return Types
// أنواع إرجاع الخطافات
// ============================================

export interface UseSessionReturn {
    session: TrainingSession | null;
    participants: Participant[];
    isLoading: boolean;
    error: ApiError | null;
    joinSession: () => Promise<void>;
    leaveSession: () => Promise<void>;
    raiseHand: () => void;
    lowerHand: () => void;
}

export interface UseChatReturn {
    messages: ChatMessage[];
    sendMessage: (text: string, imageUrl?: string) => void;
    pinMessage: (messageId: string) => void;
    deleteMessage: (messageId: string) => void;
    isTyping: boolean;
    setIsTyping: (isTyping: boolean) => void;
}

export interface UseVideoStreamReturn {
    localStream: MediaStream | null;
    remoteStreams: VideoStream[];
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    toggleAudio: () => void;
    toggleVideo: () => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => void;
}
