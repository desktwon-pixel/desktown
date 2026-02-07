// todo: remove mock functionality - replace with real API data

export const mockUser = {
  id: "1",
  name: "Sarah Chen",
  email: "sarah.chen@company.com",
  role: "admin" as const,
  avatar: null,
  department: "Engineering",
  status: "online" as const,
};

export const mockUsers = [
  { id: "1", name: "Sarah Chen", role: "admin", avatar: null, department: "Engineering", status: "online" as const },
  { id: "2", name: "James Wilson", role: "manager", avatar: null, department: "Product", status: "online" as const },
  { id: "3", name: "Maria Garcia", role: "employee", avatar: null, department: "Design", status: "away" as const },
  { id: "4", name: "David Kim", role: "employee", avatar: null, department: "Engineering", status: "busy" as const },
  { id: "5", name: "Emma Thompson", role: "employee", avatar: null, department: "Marketing", status: "offline" as const },
];

export const mockTasks = [
  { id: "1", title: "Review Q4 reports", assignee: mockUsers[0], priority: "high" as const, status: "in_progress" as const, dueDate: "2024-12-10" },
  { id: "2", title: "Update user documentation", assignee: mockUsers[2], priority: "medium" as const, status: "pending" as const, dueDate: "2024-12-15" },
  { id: "3", title: "Fix login authentication bug", assignee: mockUsers[3], priority: "high" as const, status: "completed" as const, dueDate: "2024-12-05" },
  { id: "4", title: "Design new dashboard layout", assignee: mockUsers[2], priority: "low" as const, status: "pending" as const, dueDate: "2024-12-20" },
];

export const mockTickets = [
  { id: "T-001", title: "Cannot access reports module", reporter: mockUsers[4], assignee: mockUsers[0], priority: "high" as const, status: "open" as const },
  { id: "T-002", title: "Slow loading on dashboard", reporter: mockUsers[1], assignee: mockUsers[3], priority: "medium" as const, status: "in_progress" as const },
  { id: "T-003", title: "Export feature not working", reporter: mockUsers[2], assignee: null, priority: "low" as const, status: "open" as const },
];

export const mockPosts = [
  { id: "1", author: mockUsers[1], content: "Excited to announce our new product launch next week! The team has been working incredibly hard.", likes: 24, comments: 8, timestamp: "2 hours ago" },
  { id: "2", author: mockUsers[0], content: "Great sprint retrospective today. Keep up the amazing work everyone!", likes: 15, comments: 3, timestamp: "5 hours ago" },
  { id: "3", author: mockUsers[2], content: "Just completed the new design system documentation. Check it out in the shared drive.", likes: 32, comments: 12, timestamp: "1 day ago" },
];

export const mockStories = [
  { id: "1", user: mockUsers[0], content: "Working on API integration", isViewed: false },
  { id: "2", user: mockUsers[1], content: "Team meeting at 3pm", isViewed: false },
  { id: "3", user: mockUsers[2], content: "Designing new components", isViewed: true },
  { id: "4", user: mockUsers[3], content: "Code review session", isViewed: true },
];

export const mockMessages = [
  { id: "1", sender: mockUsers[1], content: "Hey team, how's the progress on the new feature?", timestamp: "10:30 AM", isOwn: false },
  { id: "2", sender: mockUsers[0], content: "Going well! Should be done by end of day.", timestamp: "10:32 AM", isOwn: true },
  { id: "3", sender: mockUsers[2], content: "I'll have the designs ready for review in an hour.", timestamp: "10:35 AM", isOwn: false },
];

export const mockChatThreads = [
  { id: "1", name: "Engineering Team", lastMessage: "Great work on the release!", participants: [mockUsers[0], mockUsers[3]], unread: 2, timestamp: "10 min ago" },
  { id: "2", name: "Product Discussion", lastMessage: "Let's schedule a sync", participants: [mockUsers[1], mockUsers[2]], unread: 0, timestamp: "1 hour ago" },
  { id: "3", name: "All Hands", lastMessage: "Reminder: Town hall tomorrow", participants: mockUsers, unread: 5, timestamp: "3 hours ago" },
];

export const mockMeetings = [
  { id: "1", title: "Sprint Planning", time: "10:00 AM - 11:00 AM", date: "Today", participants: [mockUsers[0], mockUsers[1], mockUsers[3]], room: "Virtual Room A" },
  { id: "2", title: "Design Review", time: "2:00 PM - 3:00 PM", date: "Today", participants: [mockUsers[2], mockUsers[1]], room: "Virtual Room B" },
  { id: "3", title: "1:1 with Manager", time: "4:00 PM - 4:30 PM", date: "Tomorrow", participants: [mockUsers[0], mockUsers[1]], room: "Virtual Room A" },
];

export const mockJobs = [
  { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Remote", type: "Full-time", salary: "$120k - $150k", postedDays: 3, isPublished: true },
  { id: "2", title: "Product Designer", department: "Design", location: "Remote", type: "Full-time", salary: "$90k - $120k", postedDays: 7, isPublished: true },
  { id: "3", title: "Marketing Manager", department: "Marketing", location: "Hybrid", type: "Full-time", salary: "$80k - $100k", postedDays: 1, isPublished: false },
];

export const mockTransactions = [
  { id: "1", description: "Software subscription", amount: -299.00, category: "Software", date: "Dec 1, 2024", status: "approved" as const },
  { id: "2", description: "Team lunch expense", amount: -156.50, category: "Meals", date: "Nov 28, 2024", status: "pending" as const },
  { id: "3", description: "Client payment received", amount: 5000.00, category: "Revenue", date: "Nov 25, 2024", status: "approved" as const },
  { id: "4", description: "Office supplies", amount: -89.99, category: "Supplies", date: "Nov 20, 2024", status: "pending" as const },
];

export const mockKPIs = [
  { label: "Tasks Completed", value: 47, trend: 12, trendUp: true },
  { label: "Active Projects", value: 8, trend: 2, trendUp: true },
  { label: "Team Members", value: 24, trend: 0, trendUp: true },
  { label: "Pending Reviews", value: 5, trend: -3, trendUp: false },
];

export const mockNotifications = [
  { id: "1", title: "New task assigned", message: "You have been assigned to 'Review Q4 reports'", time: "5 min ago", isRead: false },
  { id: "2", title: "Meeting reminder", message: "Sprint Planning starts in 30 minutes", time: "25 min ago", isRead: false },
  { id: "3", title: "Comment on your post", message: "James Wilson commented on your update", time: "1 hour ago", isRead: true },
];
