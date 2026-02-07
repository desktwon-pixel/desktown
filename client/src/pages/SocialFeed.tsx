import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Send, Image, Video, X, Search, Play, Film, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SocialPostCard } from "@/components/SocialPostCard";
import type { Post, User } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";
import { useLocation, useSearch } from "wouter";

export default function SocialFeed() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [newPostContent, setNewPostContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [reelDescription, setReelDescription] = useState("");
  const [reelVideoUrl, setReelVideoUrl] = useState<string | null>(null);
  
  // Story upload state
  const [storyCaption, setStoryCaption] = useState("");
  const [storyMediaUrl, setStoryMediaUrl] = useState<string | null>(null);
  const [storyMediaType, setStoryMediaType] = useState<"image" | "video" | null>(null);
  
  // Check URL params for upload mode
  const urlParams = new URLSearchParams(searchString);
  const uploadMode = urlParams.get('upload'); // 'reel' or 'story'
  const [activeUploadMode, setActiveUploadMode] = useState<'reel' | 'story' | null>(null);
  
  useEffect(() => {
    if (uploadMode === 'reel' || uploadMode === 'story') {
      setActiveUploadMode(uploadMode);
    }
  }, [uploadMode]);

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; mediaUrl?: string; mediaType?: string }) => {
      return await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      setMediaUrl(null);
      setMediaType(null);
      toast({ title: t.socialFeed?.posted || "Posted!", description: t.socialFeed?.postedDesc || "Your update has been shared." });
    },
    onError: () => {
      toast({ title: t.socialFeed?.error || "Error", description: t.socialFeed?.failedPost || "Failed to create post.", variant: "destructive" });
    },
  });

  const createReelMutation = useMutation({
    mutationFn: async (data: { content: string; mediaUrl: string; mediaType: string; isReel: boolean }) => {
      return await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setReelDescription("");
      setReelVideoUrl(null);
      toast({ 
        title: language === 'ar' ? 'تم رفع المقطع!' : 'Reel uploaded!', 
        description: language === 'ar' ? 'سيظهر المقطع في صفحة المقاطع بالواجهة الرئيسية' : 'Your reel will appear in the Videos section' 
      });
    },
    onError: () => {
      toast({ title: t.socialFeed?.error || "Error", description: language === 'ar' ? 'فشل رفع المقطع' : 'Failed to upload reel', variant: "destructive" });
    },
  });

  const handleReelUpload = () => {
    if (reelVideoUrl) {
      createReelMutation.mutate({
        content: reelDescription || (language === 'ar' ? 'مقطع جديد' : 'New reel'),
        mediaUrl: reelVideoUrl,
        mediaType: 'video',
        isReel: true,
      });
    }
  };

  // Story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (data: { mediaUrl: string; mediaType: string; caption?: string }) => {
      return await apiRequest("POST", "/api/stories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/stories"] });
      setStoryCaption("");
      setStoryMediaUrl(null);
      setStoryMediaType(null);
      setActiveUploadMode(null);
      toast({ 
        title: language === 'ar' ? 'تم نشر الحالة!' : 'Story published!', 
        description: language === 'ar' ? 'ستظهر الحالة في الواجهة الرئيسية لمدة 24 ساعة' : 'Your story will appear on the homepage for 24 hours' 
      });
    },
    onError: () => {
      toast({ 
        title: language === 'ar' ? 'خطأ' : 'Error', 
        description: language === 'ar' ? 'فشل نشر الحالة' : 'Failed to publish story', 
        variant: "destructive" 
      });
    },
  });

  const handleStoryUpload = () => {
    if (storyMediaUrl && storyMediaType) {
      createStoryMutation.mutate({
        mediaUrl: storyMediaUrl,
        mediaType: storyMediaType,
        caption: storyCaption || undefined,
      });
    }
  };

  const handleStoryMediaComplete = async (result: any, type: "image" | "video") => {
    if (result.successful && result.successful.length > 0) {
      const uploadedUrl = result.successful[0].uploadURL;
      try {
        const response = await apiRequest("PUT", "/api/media", { mediaURL: uploadedUrl });
        const data = await response.json();
        setStoryMediaUrl(data.objectPath);
        setStoryMediaType(type);
        toast({ 
          title: language === 'ar' ? 'تم الرفع!' : 'Uploaded!', 
          description: language === 'ar' ? 'جاهز للنشر كحالة' : 'Ready to publish as story' 
        });
      } catch (error) {
        toast({ title: language === 'ar' ? 'فشل الرفع' : 'Upload Failed', variant: "destructive" });
      }
    }
  };

  const handleReelVideoComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedUrl = result.successful[0].uploadURL;
      try {
        const response = await apiRequest("PUT", "/api/media", { mediaURL: uploadedUrl });
        const data = await response.json();
        setReelVideoUrl(data.objectPath);
        toast({ 
          title: language === 'ar' ? 'تم رفع الفيديو!' : 'Video uploaded!', 
          description: language === 'ar' ? 'جاهز للنشر في المقاطع' : 'Ready to publish as reel' 
        });
      } catch (error) {
        toast({ title: t.socialFeed?.uploadFailed || "Upload Failed", variant: "destructive" });
      }
    }
  };

  const handlePost = () => {
    if (newPostContent.trim() || mediaUrl) {
      createPostMutation.mutate({
        content: newPostContent || "",
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
      });
    }
  };

  const handleMediaUploadComplete = async (result: any, type: "image" | "video") => {
    if (result.successful && result.successful.length > 0) {
      const uploadedUrl = result.successful[0].uploadURL;
      try {
        const response = await apiRequest("PUT", "/api/media", { mediaURL: uploadedUrl });
        const data = await response.json();
        setMediaUrl(data.objectPath);
        setMediaType(type);
        const typeLabel = type === "image" ? (t.socialFeed?.photo || "Photo") : (t.socialFeed?.video || "Video");
        toast({ title: t.socialFeed?.uploaded || "Uploaded!", description: `${typeLabel} ${t.socialFeed?.readyToPost || "ready to post."}` });
      } catch (error) {
        toast({ title: t.socialFeed?.uploadFailed || "Upload Failed", description: t.socialFeed?.uploadFailedDesc || "Could not process the uploaded file. Please try again.", variant: "destructive" });
      }
    }
  };

  const getUploadParams = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    // API returns {uploadURL: {uploadURL: string, objectPath: string}}
    const uploadUrl = data.uploadURL?.uploadURL || data.uploadURL;
    return { method: "PUT" as const, url: uploadUrl };
  };

  const getUserById = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const currentUserName = currentUser 
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || (t.common?.you || 'You')
    : (t.common?.you || 'You');

  const clearMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  // Filter out reels - they should only appear in the Videos page
  const filteredPosts = posts.filter(post => !post.isReel);
  
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
    return bDate - aDate;
  });

  const latestPosts = sortedPosts.slice(0, 4);

  const latestNewsTitle = language === "ar" ? "آخر الأخبار" : "Latest News";
  const officeCommentsTitle = language === "ar" ? "تعليقات أصحاب المكاتب" : "Office Owners Comments";

  const officeOwner =
    users.length > 0
      ? users[0]
      : currentUser
      ? {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          profileImageUrl: currentUser.profileImageUrl,
        }
      : null;

  const officeOwnerName =
    officeOwner && "firstName" in officeOwner
      ? `${officeOwner.firstName || ""} ${officeOwner.lastName || ""}`.trim() ||
        officeOwner.email ||
        (language === "ar" ? "صاحب مكتب" : "Office Owner")
      : language === "ar"
      ? "صاحب مكتب"
      : "Office Owner";

  const officeCommentLines =
    language === "ar"
      ? [
          "في هذا الركن يشارك أصحاب المكاتب",
          "أهم الملاحظات حول أداء الفرق اليومية،",
          "مع نقاط تركّز على تطوير بيئة العمل،",
          "وتحسين التواصل بين الزملاء والأقسام،",
          "ليظل الجميع على نفس المسار بوضوح.",
        ]
      : [
          "In this corner office owners share",
          "their notes about daily team performance,",
          "with ideas to improve the workspace,",
          "and strengthen collaboration across teams,",
          "so everyone stays aligned and focused.",
        ];

  return (
    <div
      className="p-6 md:p-8 max-w-7xl mx-auto"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="bg-slate-900 rounded-t-xl px-6 py-3 flex items-center justify-between text-white shadow-sm">
        <div className="text-sm font-medium">
          {t.socialFeed?.title || "Connect"}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-300" />
          </div>
          <div className="h-7 w-7 rounded-full border border-slate-600 flex items-center justify-center bg-slate-800">
            <span className="text-xs">
              {currentUserName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 px-6 py-5 mt-0">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] gap-6 items-start">
          <div className="space-y-4 md:col-start-2">
            <Card className="border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={currentUserName}
                    avatar={currentUser?.profileImageUrl}
                    size="md"
                  />
                  <div className="flex-1 flex items-center gap-3">
                    <Textarea
                      placeholder={
                        t.socialFeed?.whatsOnMind || "Create Post"
                      }
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="resize-none min-h-[50px] border border-slate-200 bg-white text-sm"
                      data-testid="input-post-content"
                    />
                    <Button
                      onClick={handlePost}
                      disabled={
                        (!newPostContent.trim() && !mediaUrl) ||
                        createPostMutation.isPending
                      }
                      className="whitespace-nowrap"
                      data-testid="button-post"
                    >
                      <Send
                        className={`h-4 w-4 ${
                          language === "ar" ? "ml-2" : "mr-2"
                        }`}
                      />
                      {createPostMutation.isPending
                        ? t.socialFeed?.posting || "Posting..."
                        : t.socialFeed?.post || "Post"}
                    </Button>
                  </div>
                </div>

                {mediaUrl && (
                  <div className="mt-3 relative rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 z-10 h-8 w-8"
                      onClick={clearMedia}
                      data-testid="button-remove-media"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {mediaType === "image" ? (
                      <img
                        src={mediaUrl}
                        alt={
                          t.socialFeed?.uploadPreview || "Upload preview"
                        }
                        className="max-h-64 w-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        controls
                        className="max-h-64 w-full"
                      />
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    allowedFileTypes={["image/*"]}
                    onGetUploadParameters={getUploadParams}
                    onComplete={(result) =>
                      handleMediaUploadComplete(result, "image")
                    }
                    buttonVariant="ghost"
                    buttonSize="sm"
                  >
                    <Image
                      className={`h-4 w-4 ${
                        language === "ar" ? "ml-1" : "mr-1"
                      }`}
                    />
                    {t.socialFeed?.photo || "Photo"}
                  </ObjectUploader>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={52428800}
                    allowedFileTypes={["video/*"]}
                    onGetUploadParameters={getUploadParams}
                    onComplete={(result) =>
                      handleMediaUploadComplete(result, "video")
                    }
                    buttonVariant="ghost"
                    buttonSize="sm"
                  >
                    <Video
                      className={`h-4 w-4 ${
                        language === "ar" ? "ml-1" : "mr-1"
                      }`}
                    />
                    {t.socialFeed?.video || "Video"}
                  </ObjectUploader>
                </div>
              </CardContent>
            </Card>

            {/* Reel Upload Card for Landing Page Videos */}
            <Card className="border-2 border-dashed border-amber-400/50 shadow-md bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-amber-500">
                    <Film className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-700 dark:text-amber-400">
                      {language === 'ar' ? 'رفع مقطع للواجهة الرئيسية' : 'Upload Reel for Landing Page'}
                    </h3>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                      {language === 'ar' ? 'سيظهر في قسم المقاطع بالصفحة الرئيسية' : 'Will appear in Videos section on homepage'}
                    </p>
                  </div>
                </div>

                {reelVideoUrl && (
                  <div className="relative rounded-lg overflow-hidden bg-black mb-3">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 z-10 h-8 w-8"
                      onClick={() => setReelVideoUrl(null)}
                      data-testid="button-remove-reel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <video
                      src={reelVideoUrl}
                      controls
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Textarea
                    placeholder={language === 'ar' ? 'وصف المقطع (اختياري)...' : 'Reel description (optional)...'}
                    value={reelDescription}
                    onChange={(e) => setReelDescription(e.target.value)}
                    className="resize-none min-h-[40px] border border-amber-200 bg-white text-sm flex-1"
                    data-testid="input-reel-description"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={104857600}
                    allowedFileTypes={["video/*"]}
                    onGetUploadParameters={getUploadParams}
                    onComplete={handleReelVideoComplete}
                    buttonVariant="outline"
                    buttonSize="sm"
                  >
                    <Play className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                    {language === 'ar' ? 'اختر فيديو' : 'Choose Video'}
                  </ObjectUploader>

                  <Button
                    onClick={handleReelUpload}
                    disabled={!reelVideoUrl || createReelMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    data-testid="button-upload-reel"
                  >
                    <Film className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                    {createReelMutation.isPending 
                      ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                      : (language === 'ar' ? 'نشر المقطع' : 'Publish Reel')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Story Upload Card for 24-hour Stories */}
            <Card className={`border-2 border-dashed border-pink-400/50 shadow-md bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 ${activeUploadMode === 'story' ? 'ring-2 ring-pink-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-pink-700 dark:text-pink-400">
                      {language === 'ar' ? 'رفع حالة يومية' : 'Upload Daily Story'}
                    </h3>
                    <p className="text-xs text-pink-600/70 dark:text-pink-400/70">
                      {language === 'ar' ? 'ستختفي تلقائياً بعد 24 ساعة' : 'Will automatically disappear after 24 hours'}
                    </p>
                  </div>
                </div>

                {storyMediaUrl && (
                  <div className="relative rounded-lg overflow-hidden bg-black mb-3">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 z-10 h-8 w-8"
                      onClick={() => {
                        setStoryMediaUrl(null);
                        setStoryMediaType(null);
                      }}
                      data-testid="button-remove-story-media"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {storyMediaType === 'video' ? (
                      <video
                        src={storyMediaUrl}
                        controls
                        className="max-h-48 w-full object-contain"
                      />
                    ) : (
                      <img
                        src={storyMediaUrl}
                        alt="Story preview"
                        className="max-h-48 w-full object-contain"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Textarea
                    placeholder={language === 'ar' ? 'تعليق على الحالة (اختياري)...' : 'Story caption (optional)...'}
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    className="resize-none min-h-[40px] border border-pink-200 bg-white text-sm flex-1"
                    data-testid="input-story-caption"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={104857600}
                    allowedFileTypes={["image/*"]}
                    onGetUploadParameters={getUploadParams}
                    onComplete={(result) => handleStoryMediaComplete(result, 'image')}
                    buttonVariant="outline"
                    buttonSize="sm"
                  >
                    <Image className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                    {language === 'ar' ? 'صورة' : 'Image'}
                  </ObjectUploader>

                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={104857600}
                    allowedFileTypes={["video/*"]}
                    onGetUploadParameters={getUploadParams}
                    onComplete={(result) => handleStoryMediaComplete(result, 'video')}
                    buttonVariant="outline"
                    buttonSize="sm"
                  >
                    <Video className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                    {language === 'ar' ? 'فيديو' : 'Video'}
                  </ObjectUploader>

                  <Button
                    onClick={handleStoryUpload}
                    disabled={!storyMediaUrl || createStoryMutation.isPending}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    data-testid="button-upload-story"
                  >
                    <Clock className={`h-4 w-4 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                    {createStoryMutation.isPending 
                      ? (language === 'ar' ? 'جاري النشر...' : 'Publishing...') 
                      : (language === 'ar' ? 'نشر الحالة' : 'Publish Story')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {postsLoading
                ? Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="w-full h-64 rounded-lg" />
                    ))
                : sortedPosts.length > 0
                ? sortedPosts.map((post) => {
                    const author = getUserById(post.authorId);
                    return (
                      <SocialPostCard
                        key={post.id}
                        post={post}
                        author={author}
                        currentUserId={currentUser?.id}
                      />
                    );
                  })
                : (
                  <Card className="md:col-span-2 border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-200 bg-white">
                    <CardContent className="py-12 text-center text-slate-500">
                      <p className="text-sm mb-1">
                        {t.socialFeed?.noPostsYet || "No posts yet"}
                      </p>
                      <p className="text-xs">
                        {t.socialFeed?.beFirst ||
                          "Be the first to share an update with your team!"}
                      </p>
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>

          <div className="space-y-4 md:col-start-1 md:row-start-1 md:flex md:flex-col md:items-start">
            <div className="w-full md:max-w-xs">
              <Card className="border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-200 bg-white h-40 flex flex-col">
                <CardHeader className="pb-2 shrink-0">
                  <CardTitle className="text-sm font-semibold">
                    {latestNewsTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-600 flex-1 overflow-hidden">
                  {latestPosts.length === 0 ? (
                    <p className="text-slate-400">
                      {language === "ar"
                        ? "لا توجد أخبار بعد."
                        : "No news yet."}
                    </p>
                  ) : (
                    latestPosts.map((post) => {
                      const createdAt = post.createdAt
                        ? new Date(post.createdAt as any)
                        : null;
                      const dateLabel = createdAt
                        ? createdAt.toLocaleDateString(language === "ar" ? "ar-EG" : undefined, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "";
                      return (
                        <div
                          key={post.id}
                          className="border-b last:border-b-0 border-slate-100 pb-2 last:pb-0"
                        >
                          <p className="font-medium text-[11px] line-clamp-2">
                            {post.content}
                          </p>
                          {dateLabel && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              {dateLabel}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:max-w-xs">
              <Card className="border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-200 bg-white h-40 flex flex-col">
                <CardHeader className="pb-2 shrink-0">
                  <CardTitle className="text-sm font-semibold">
                    {officeCommentsTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3 items-start text-xs text-slate-600 flex-1 overflow-hidden">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200">
                    <UserAvatar
                      name={officeOwnerName}
                      avatar={
                        officeOwner && "profileImageUrl" in officeOwner
                          ? officeOwner.profileImageUrl
                          : undefined
                      }
                      size="sm"
                    />
                  </div>
                  <div className="space-y-1">
                    {officeCommentLines.map((line, index) => (
                      <p key={index} className="leading-snug">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
