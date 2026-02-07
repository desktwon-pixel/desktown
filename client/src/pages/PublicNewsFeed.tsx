import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Heart, MessageCircle, Share2, Image, Video, Building2 } from "lucide-react";
import type { Post } from "@shared/schema";

export default function PublicNewsFeed() {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/public/news"],
  });

  const { data: users = [] } = useQuery<{ id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null }[]>({
    queryKey: ["/api/public/users"],
  });

  const { data: offices = [] } = useQuery<any[]>({
    queryKey: ["/api/public/offices"],
  });

  const filteredPosts = posts.filter(post => !post.isReel);

  const getAuthorInfo = (authorId: string) => {
    const user = users.find(u => u.id === authorId);
    if (user) {
      return {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'مستخدم',
        avatar: user.profileImageUrl || ''
      };
    }
    return { name: 'مستخدم', avatar: '' };
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return language === 'ar' ? 'منذ قليل' : 'Just now';
    if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    if (days < 7) return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19]" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/landing">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowRight className={`h-5 w-5 ${isRTL ? '' : 'rotate-180'}`} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">
            {language === 'ar' ? 'آخر الأخبار' : 'Latest News'}
          </h1>
          <div className="w-10" />
        </div>

        <p className="text-gray-400 text-sm text-center mb-6">
          {language === 'ar' 
            ? 'تابع آخر أخبار ومنشورات المكاتب المسجلة في المنصة'
            : 'Follow the latest news and posts from registered offices'}
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-[#1a1f2e] border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="bg-[#1a1f2e] border-white/10">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {language === 'ar' 
                  ? 'لا توجد أخبار حالياً'
                  : 'No news available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => {
              const author = getAuthorInfo(post.authorId);
              return (
                <Card key={post.id} className="bg-[#1a1f2e] border-white/10 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={author.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                          {author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white text-sm">{author.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>

                    {post.content && (
                      <p className="text-gray-200 text-sm mb-3 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}

                    {post.mediaUrl && post.mediaType === 'image' && (
                      <div className="rounded-lg overflow-hidden mb-3">
                        <img 
                          src={post.mediaUrl} 
                          alt="" 
                          className="w-full h-auto object-cover max-h-80"
                        />
                      </div>
                    )}

                    {post.mediaUrl && post.mediaType === 'video' && (
                      <div className="rounded-lg overflow-hidden mb-3">
                        <video 
                          src={post.mediaUrl} 
                          controls 
                          className="w-full max-h-80"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                      <button className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">0</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">0</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-400 hover:text-teal-400 transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
