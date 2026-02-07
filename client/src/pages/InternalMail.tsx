import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Send, 
  Mail, 
  Inbox, 
  SendHorizontal,
  Star,
  Archive,
  Trash2,
  FileEdit,
  Plus,
  ArrowLeft,
  MoreVertical,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { InternalEmail, User } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguage, translations } from "@/lib/i18n";

type EmailWithUsers = InternalEmail & {
  sender?: User | null;
  recipient?: User | null;
};

type MailboxView = "inbox" | "sent" | "drafts" | "starred" | "archived";

export default function InternalMail() {
  const { language } = useLanguage();
  const t = translations[language];
  const dateLocale = language === 'ar' ? ar : enUS;
  const { user: currentUser } = useAuth();
  const [activeView, setActiveView] = useState<MailboxView>("inbox");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailWithUsers | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  
  const [composeData, setComposeData] = useState({
    recipientId: "",
    subject: "",
    body: "",
    isDraft: false,
  });

  const { data: inboxEmails = [], isLoading: inboxLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ["/api/emails/inbox"],
  });

  const { data: sentEmails = [], isLoading: sentLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ["/api/emails/sent"],
  });

  const { data: draftEmails = [], isLoading: draftsLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ["/api/emails/drafts"],
  });

  const { data: starredEmails = [], isLoading: starredLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ["/api/emails/starred"],
  });

  const { data: archivedEmails = [], isLoading: archivedLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ["/api/emails/archived"],
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/emails/unread-count"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const invalidateAllEmailQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/emails/inbox"] });
    queryClient.invalidateQueries({ queryKey: ["/api/emails/sent"] });
    queryClient.invalidateQueries({ queryKey: ["/api/emails/drafts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/emails/starred"] });
    queryClient.invalidateQueries({ queryKey: ["/api/emails/archived"] });
    queryClient.invalidateQueries({ queryKey: ["/api/emails/unread-count"] });
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof composeData) => {
      return await apiRequest("POST", "/api/emails", data);
    },
    onSuccess: () => {
      invalidateAllEmailQueries();
      setShowCompose(false);
      setComposeData({ recipientId: "", subject: "", body: "", isDraft: false });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: async (emailId: number) => {
      return await apiRequest("POST", `/api/emails/${emailId}/star`, {});
    },
    onSuccess: () => {
      invalidateAllEmailQueries();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (emailId: number) => {
      return await apiRequest("POST", `/api/emails/${emailId}/archive`, {});
    },
    onSuccess: () => {
      invalidateAllEmailQueries();
      setSelectedEmail(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (emailId: number) => {
      return await apiRequest("DELETE", `/api/emails/${emailId}`, {});
    },
    onSuccess: () => {
      invalidateAllEmailQueries();
      setSelectedEmail(null);
    },
  });

  const getCurrentEmails = (): EmailWithUsers[] => {
    switch (activeView) {
      case "inbox": return inboxEmails;
      case "sent": return sentEmails;
      case "drafts": return draftEmails;
      case "starred": return starredEmails;
      case "archived": return archivedEmails;
      default: return inboxEmails;
    }
  };

  const isLoading = () => {
    switch (activeView) {
      case "inbox": return inboxLoading;
      case "sent": return sentLoading;
      case "drafts": return draftsLoading;
      case "starred": return starredLoading;
      case "archived": return archivedLoading;
      default: return false;
    }
  };

  const getDisplayUser = (email: EmailWithUsers) => {
    if (activeView === "sent" || activeView === "drafts") {
      return email.recipient;
    }
    return email.sender;
  };

  const filteredEmails = getCurrentEmails().filter((email) => {
    const user = getDisplayUser(email);
    const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase() : "";
    return (
      email.subject.toLowerCase().includes(search.toLowerCase()) ||
      email.body.toLowerCase().includes(search.toLowerCase()) ||
      userName.includes(search.toLowerCase())
    );
  });

  const handleSend = () => {
    if (composeData.recipientId && composeData.subject) {
      sendEmailMutation.mutate(composeData);
    }
  };

  const handleSaveDraft = () => {
    if (composeData.recipientId && composeData.subject) {
      sendEmailMutation.mutate({ ...composeData, isDraft: true });
    }
  };

  const mailboxItems = [
    { id: "inbox" as MailboxView, label: t.internalMail?.inbox || "Inbox", icon: Inbox, count: unreadCount.count },
    { id: "sent" as MailboxView, label: t.internalMail?.sent || "Sent", icon: SendHorizontal, count: 0 },
    { id: "drafts" as MailboxView, label: t.internalMail?.drafts || "Drafts", icon: FileEdit, count: draftEmails.length },
    { id: "starred" as MailboxView, label: t.internalMail?.starred || "Starred", icon: Star, count: 0 },
    { id: "archived" as MailboxView, label: t.internalMail?.archived || "Archived", icon: Archive, count: 0 },
  ];

  const iconMargin = language === 'ar' ? 'ml-2' : 'mr-2';

  return (
    <div className="flex h-[calc(100vh-4rem)]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-64 border-r border-white/5 flex flex-col bg-sidebar">
        <div className="p-4 border-b border-white/5">
          <Button 
            onClick={() => setShowCompose(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            data-testid="button-compose-email"
          >
            <Plus className={`h-4 w-4 ${iconMargin}`} />
            {t.internalMail?.newMessage || "New Message"}
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {mailboxItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSelectedEmail(null);
                }}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center justify-between",
                  activeView === item.id
                    ? "bg-white/10 border border-cyan-500/30"
                    : "hover:bg-white/5 border border-transparent"
                )}
                data-testid={`button-mailbox-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "h-4 w-4",
                    activeView === item.id ? "text-cyan-400" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm",
                    activeView === item.id && "text-cyan-400 font-medium"
                  )}>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <Badge variant="secondary" className="text-xs px-2">
                    {item.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="w-80 border-r border-white/5 flex flex-col bg-background">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-semibold">
              {mailboxItems.find(i => i.id === activeView)?.label || (t.internalMail?.mail || "Mail")}
            </h2>
          </div>
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t.internalMail?.searchMessages || "Search messages..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${language === 'ar' ? 'pr-9' : 'pl-9'} bg-white/5 border-white/10 focus:border-cyan-500/50`}
              data-testid="input-search-emails"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading() ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-white/5" />
              ))
            ) : filteredEmails.length > 0 ? (
              filteredEmails.map((email) => {
                const displayUser = getDisplayUser(email);
                return (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={cn(
                      "w-full p-3 rounded-xl text-left transition-all duration-200",
                      selectedEmail?.id === email.id
                        ? "bg-white/10 border border-cyan-500/30"
                        : "hover:bg-white/5 border border-transparent",
                      !email.isRead && activeView === "inbox" && "bg-white/5"
                    )}
                    data-testid={`button-email-${email.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar 
                        name={displayUser ? `${displayUser.firstName || ""} ${displayUser.lastName || ""}` : "User"} 
                        avatar={displayUser?.profileImageUrl}
                        size="sm" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            !email.isRead && activeView === "inbox" && "text-cyan-400"
                          )}>
                            {displayUser ? `${displayUser.firstName || ""} ${displayUser.lastName || ""}` : "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {email.createdAt && formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: dateLocale })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm truncate",
                          !email.isRead && activeView === "inbox" ? "font-medium" : "text-muted-foreground"
                        )}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {email.body.substring(0, 50)}...
                        </p>
                      </div>
                      {email.isStarred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{search ? (t.internalMail?.noMatchingMessages || "No matching messages") : (t.internalMail?.noMessages || "No messages")}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-background">
        {selectedEmail ? (
          <>
            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEmail(null)}
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="font-semibold">{selectedEmail.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeView === "sent" || activeView === "drafts" ? (t.internalMail?.to || "To") + ": " : (t.internalMail?.from || "From") + ": "}
                    {getDisplayUser(selectedEmail) ? 
                      `${getDisplayUser(selectedEmail)?.firstName || ""} ${getDisplayUser(selectedEmail)?.lastName || ""}` : 
                      "Unknown"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleStarMutation.mutate(selectedEmail.id)}
                  data-testid="button-toggle-star"
                >
                  <Star className={cn(
                    "h-4 w-4",
                    selectedEmail.isStarred && "text-yellow-500 fill-yellow-500"
                  )} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveMutation.mutate(selectedEmail.id)}
                  data-testid="button-archive-email"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(selectedEmail.id)}
                  data-testid="button-delete-email"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 max-w-3xl mx-auto">
                <div className="glass rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <UserAvatar 
                      name={selectedEmail.sender ? `${selectedEmail.sender.firstName || ""} ${selectedEmail.sender.lastName || ""}` : "User"} 
                      avatar={selectedEmail.sender?.profileImageUrl}
                      size="md" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {selectedEmail.sender ? `${selectedEmail.sender.firstName || ""} ${selectedEmail.sender.lastName || ""}` : "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedEmail.sender?.email || ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {selectedEmail.createdAt && format(new Date(selectedEmail.createdAt), "d MMM yyyy, HH:mm")}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">{t.internalMail?.to || "To"}: </span>
                        <span className="text-xs">
                          {selectedEmail.recipient ? `${selectedEmail.recipient.firstName || ""} ${selectedEmail.recipient.lastName || ""}` : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="font-semibold text-lg mb-4">{selectedEmail.subject}</h3>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      {selectedEmail.body}
                    </div>
                  </div>
                </div>

                {activeView === "inbox" && (
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        const replyPrefix = language === 'ar' ? 'رد: ' : 'Re: ';
                        setComposeData({
                          recipientId: selectedEmail.senderId,
                          subject: `${replyPrefix}${selectedEmail.subject}`,
                          body: "",
                          isDraft: false,
                        });
                        setShowCompose(true);
                      }}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500"
                      data-testid="button-reply"
                    >
                      <Send className={`h-4 w-4 ${iconMargin}`} />
                      {t.internalMail?.replyToMessage || "Reply"}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-1">{t.internalMail?.selectMessage || "Select a message"}</h3>
              <p className="text-sm">{t.internalMail?.selectMessageDesc || "Select a message from the list to view its contents"}</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="sm:max-w-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-500" />
              {t.internalMail?.newMessage || "New Message"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t.internalMail?.to || "To"}</label>
              <Select
                value={composeData.recipientId}
                onValueChange={(value) => setComposeData({ ...composeData, recipientId: value })}
              >
                <SelectTrigger data-testid="select-recipient">
                  <SelectValue placeholder={t.internalMail?.selectRecipient || "Select recipient..."} />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.id !== currentUser?.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <UserAvatar 
                            name={`${user.firstName || ""} ${user.lastName || ""}`} 
                            avatar={user.profileImageUrl}
                            size="sm" 
                          />
                          <span>{user.firstName} {user.lastName}</span>
                          <span className="text-xs text-muted-foreground">({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t.internalMail?.subject || "Subject"}</label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder={t.internalMail?.subjectPlaceholder || "Message subject..."}
                data-testid="input-subject"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t.internalMail?.content || "Content"}</label>
              <Textarea
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                placeholder={t.internalMail?.contentPlaceholder || "Write your message here..."}
                rows={8}
                className="resize-none"
                data-testid="input-body"
              />
            </div>

            <div className="flex justify-between gap-4 flex-wrap pt-4">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={sendEmailMutation.isPending}
                data-testid="button-save-draft"
              >
                <FileEdit className={`h-4 w-4 ${iconMargin}`} />
                {t.internalMail?.saveDraft || "Save as Draft"}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!composeData.recipientId || !composeData.subject || sendEmailMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-teal-500"
                data-testid="button-send-email"
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className={`h-4 w-4 ${iconMargin} animate-spin`} />
                ) : (
                  <Send className={`h-4 w-4 ${iconMargin}`} />
                )}
                {t.internalMail?.send || "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
