import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home, Building2, UserCircle, Briefcase, Play, 
  Heart, MessageCircle, Share2, Music2, ChevronLeft,
  Volume2, VolumeX, Pause, Film
} from "lucide-react";
import type { Post, User } from "@shared/schema";

interface VideoReel {
  id: number;
  videoUrl: string;
  username: string;
  userAvatar: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  musicName: string;
}

// Fallback sample videos (shown when no reels in database)
const sampleVideos: VideoReel[] = [
  {
    id: 1,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    username: "مكتب_الريادة",
    userAvatar: "",
    description: "جولة في مكتبنا الافتراضي الجديد! #مكتب_افتراضي #عمل_عن_بعد",
    likes: 1250,
    comments: 89,
    shares: 45,
    musicName: "صوت أصلي - مكتب الريادة"
  },
  {
    id: 2,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    username: "شركة_التقنية",
    userAvatar: "",
    description: "كيف نعمل عن بعد بكفاءة عالية #تقنية #إنتاجية",
    likes: 3420,
    comments: 156,
    shares: 89,
    musicName: "صوت أصلي - شركة التقنية"
  },
  {
    id: 3,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    username: "استشارات_الأعمال",
    userAvatar: "",
    description: "نصائح للنجاح في العمل الحر #ريادة_أعمال #نصائح",
    likes: 5670,
    comments: 234,
    shares: 123,
    musicName: "صوت أصلي - استشارات الأعمال"
  },
  {
    id: 4,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    username: "مكتب_الابداع",
    userAvatar: "",
    description: "يوم في حياة مستقل ناجح #فريلانسر #عمل_حر",
    likes: 2890,
    comments: 167,
    shares: 78,
    musicName: "صوت أصلي - مكتب الابداع"
  }
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function Videos() {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Fetch video posts (reels) from public API (for landing page)
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/public/reels"],
  });

  const { data: users = [] } = useQuery<{ id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null }[]>({
    queryKey: ["/api/public/users"],
  });

  // Convert reels to VideoReel format (API already returns only isReel=true posts)
  const videoReels: VideoReel[] = (posts || [])
    .map(post => {
      const author = users.find(u => u.id === post.authorId);
      const authorName = author 
        ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'مستخدم'
        : 'مستخدم';
      return {
        id: post.id,
        videoUrl: post.mediaUrl!,
        username: authorName.replace(/\s+/g, '_'),
        userAvatar: author?.profileImageUrl || '',
        description: post.content || '',
        likes: 0,
        comments: 0,
        shares: 0,
        musicName: language === 'ar' ? `صوت أصلي - ${authorName}` : `Original sound - ${authorName}`
      };
    });

  // Use database reels if available, otherwise show sample videos
  const displayVideos = videoReels.length > 0 ? videoReels : sampleVideos;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 50;

    if (diff > threshold && currentIndex < displayVideos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (diff < -threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentIndex < displayVideos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, displayVideos.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const toggleLike = (videoId: number) => {
    setLiked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRefs.current.forEach(video => {
      if (video) video.muted = !isMuted;
    });
  };

  const togglePlay = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
      } else {
        currentVideo.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Film className="h-12 w-12 text-amber-400 animate-pulse mx-auto mb-4" />
          <p className="text-white">{language === 'ar' ? 'جاري تحميل المقاطع...' : 'Loading reels...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-white font-bold text-lg">
          {language === 'ar' ? 'المقاطع' : 'Reels'}
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20"
          onClick={toggleMute}
          data-testid="button-mute"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Videos Container */}
      <div 
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {displayVideos.map((video, index) => (
          <div 
            key={video.id} 
            className="h-full w-full relative flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={el => videoRefs.current[index] = el}
              src={video.videoUrl}
              className="h-full w-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              data-testid={`video-${video.id}`}
            />

            {/* Play/Pause Overlay */}
            {!isPlaying && index === currentIndex && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20"
                onClick={togglePlay}
              >
                <Play className="h-20 w-20 text-white/80" fill="white" />
              </div>
            )}

            {/* Right Side Actions */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
              {/* Like */}
              <button 
                onClick={() => toggleLike(video.id)}
                className="flex flex-col items-center gap-1"
                data-testid={`button-like-${video.id}`}
              >
                <div className={`p-2 rounded-full ${liked.has(video.id) ? 'bg-red-500' : 'bg-white/20'}`}>
                  <Heart 
                    className={`h-7 w-7 ${liked.has(video.id) ? 'text-white fill-white' : 'text-white'}`} 
                  />
                </div>
                <span className="text-white text-xs font-medium">
                  {formatNumber(video.likes + (liked.has(video.id) ? 1 : 0))}
                </span>
              </button>

              {/* Comments */}
              <button 
                className="flex flex-col items-center gap-1"
                data-testid={`button-comment-${video.id}`}
              >
                <div className="p-2 rounded-full bg-white/20">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-medium">
                  {formatNumber(video.comments)}
                </span>
              </button>

              {/* Share */}
              <button 
                className="flex flex-col items-center gap-1"
                data-testid={`button-share-${video.id}`}
              >
                <div className="p-2 rounded-full bg-white/20">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-medium">
                  {formatNumber(video.shares)}
                </span>
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-20 left-4 right-16">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {video.username.charAt(0)}
                  </span>
                </div>
                <span className="text-white font-bold text-base">
                  @{video.username}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-3 text-xs border-white/50 text-white hover:bg-white/20 rounded-full"
                  data-testid={`button-follow-${video.id}`}
                >
                  {language === 'ar' ? 'متابعة' : 'Follow'}
                </Button>
              </div>

              {/* Description */}
              <p className="text-white text-sm mb-2 line-clamp-2">
                {video.description}
              </p>

              {/* Music */}
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-white" />
                <span className="text-white/80 text-xs">
                  {video.musicName}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
        {displayVideos.map((_, index) => (
          <div 
            key={index}
            className={`w-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'h-6 bg-amber-400' 
                : 'h-2 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-black/90 backdrop-blur-md border-t border-white/10">
          <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
            <Link 
              href="/"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-home"
            >
              <Home className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <Link 
              href="/storefront"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-offices"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
            </Link>
            <Link 
              href="/profile"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-profile"
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'حسابي' : 'Profile'}</span>
            </Link>
            <Link 
              href="/careers"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-careers"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'الوظائف' : 'Jobs'}</span>
            </Link>
            <Link 
              href="/videos"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-videos"
            >
              <Play className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'المقاطع' : 'Reels'}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
