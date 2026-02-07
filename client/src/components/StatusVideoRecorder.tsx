import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Video,
  VideoOff,
  Download,
  Sparkles,
  Sun,
  Moon,
  Heart,
  Star,
  Zap,
  RefreshCw,
  X,
  Camera,
  Mic,
  MicOff,
  Type,
  Link2,
  Image,
  Trash2,
  Flame,
  Snowflake,
  SwitchCamera,
  Lock,
  Unlock,
  Wand2,
  Eye,
  Smile,
  CircleDot,
  MessageCircle,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FaceMesh, Results as FaceMeshResults } from "@mediapipe/face_mesh";
import { WebGLBeautyFilter, createFilterSettings, defaultSettings } from "@/lib/webgl-beauty-filter";


interface TextOverlay {
  id: string;
  type: "text";
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface LinkOverlay {
  id: string;
  type: "link";
  url: string;
  label: string;
  x: number;
  y: number;
}

interface ImageOverlay {
  id: string;
  type: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StickerOverlay {
  id: string;
  type: "sticker";
  stickerId: string;
  x: number;
  y: number;
  scale: number;
}

type Overlay = TextOverlay | LinkOverlay | ImageOverlay | StickerOverlay;

interface InteractiveSticker {
  id: string;
  name: string;
  icon: string;
  IconComponent: LucideIcon;
  gradient: string;
}

const interactiveStickers: InteractiveSticker[] = [
  { id: "heart", name: "إعجاب", icon: "heart", IconComponent: Heart, gradient: "from-red-500 to-pink-500" },
  { id: "fire", name: "نار", icon: "flame", IconComponent: Flame, gradient: "from-orange-500 to-red-500" },
  { id: "star", name: "نجمة", icon: "star", IconComponent: Star, gradient: "from-yellow-400 to-amber-500" },
  { id: "chat", name: "تعليق", icon: "message-circle", IconComponent: MessageCircle, gradient: "from-blue-500 to-cyan-500" },
  { id: "thumbsup", name: "رائع", icon: "thumbs-up", IconComponent: ThumbsUp, gradient: "from-blue-500 to-indigo-500" },
  { id: "sparkle", name: "تألق", icon: "sparkles", IconComponent: Sparkles, gradient: "from-pink-500 to-rose-500" },
  { id: "zap", name: "قوة", icon: "zap", IconComponent: Zap, gradient: "from-amber-500 to-yellow-500" },
  { id: "eye", name: "مشاهدة", icon: "eye", IconComponent: Eye, gradient: "from-purple-500 to-indigo-500" },
];

interface SnapFilter {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  gradient: string;
  effects: {
    smooth?: number;
    brighten?: number;
    lipTint?: { intensity: number; color: string };
    lipGloss?: { intensity: number; color: string };
    blush?: { intensity: number; color: string };
    eyeShadow?: { intensity: number; color: string };
    eyeliner?: { intensity: number; color: string };
    colorFilter?: React.CSSProperties;
  };
}

const snapFilters: SnapFilter[] = [
  {
    id: "none",
    name: "Normal",
    nameAr: "عادي",
    emoji: "📷",
    gradient: "from-gray-400 to-gray-600",
    effects: {}
  }
];

const FACE_MESH_LANDMARKS = {
  lips: {
    outer: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
    inner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191],
  },
  leftCheek: [116, 123, 147, 187, 207, 206, 205, 36, 142, 126],
  rightCheek: [345, 352, 376, 411, 427, 426, 425, 266, 371, 355],
  leftEye: {
    outline: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    upper: [159, 145, 144, 163, 7, 33, 246, 161, 160],
    lower: [33, 133, 155, 154, 153, 145, 144],
  },
  rightEye: {
    outline: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
    upper: [386, 374, 373, 390, 249, 263, 466, 388, 387],
    lower: [263, 362, 382, 381, 380, 374, 373],
  },
  faceContour: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  nose: [1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 19, 94, 2],
};


interface StatusVideoRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusVideoRecorder({ open, onOpenChange }: StatusVideoRecorderProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beautyCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number>(0);
  const previewAnimationRef = useRef<number>(0);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const faceLandmarksRef = useRef<FaceMeshResults | null>(null);
  const beautyAnimationRef = useRef<number>(0);
  const webglFilterRef = useRef<WebGLBeautyFilter | null>(null);
  const [webglReady, setWebglReady] = useState(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: "image" | "video"; file?: File } | null>(null);
  const [mode, setMode] = useState<"camera" | "upload">("upload");
  const [isPublishing, setIsPublishing] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const [showTextInput, setShowTextInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showStickerInput, setShowStickerInput] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTextColor, setNewTextColor] = useState("#ffffff");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  
  const [selectedSnapFilter, setSelectedSnapFilter] = useState<SnapFilter>(snapFilters[0]);
  const [faceMeshReady, setFaceMeshReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setCameraError(null);
      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: facing
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          const video = videoRef.current;
          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            if (!webglFilterRef.current) {
              const filter = new WebGLBeautyFilter();
              const success = filter.initialize(video.videoWidth, video.videoHeight);
              if (success) {
                webglFilterRef.current = filter;
                setWebglReady(true);
                console.log("WebGL Beauty Filter initialized:", video.videoWidth, "x", video.videoHeight);
              }
            }
          }
        };
        
        await videoRef.current.play();
      }
      setIsStreaming(true);
      setCameraLoading(false);
      
      if (isMuted) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraLoading(false);
      setMode("upload");
      setCameraError(null);
      toast({
        title: "خطأ في الكاميرا",
        description: "تعذر الوصول للكاميرا. يرجى التحقق من الأذونات.",
        variant: "destructive",
      });
    }
  }, [facingMode, isMuted, toast]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (previewAnimationRef.current) {
      cancelAnimationFrame(previewAnimationRef.current);
    }
    if (beautyAnimationRef.current) {
      cancelAnimationFrame(beautyAnimationRef.current);
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
      setFaceMeshReady(false);
    }
    if (webglFilterRef.current) {
      webglFilterRef.current.destroy();
      webglFilterRef.current = null;
      setWebglReady(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
    setRecordingTime(0);
    setFaceDetected(false);
    setCameraLoading(false);
    faceLandmarksRef.current = null;
  }, []);

  const initFaceMesh = useCallback(() => {
    if (faceMeshRef.current) return;
    
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: FaceMeshResults) => {
      faceLandmarksRef.current = results;
      setFaceDetected(results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0);
    });

    faceMeshRef.current = faceMesh;
    setFaceMeshReady(true);
  }, []);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const drawLips = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number,
    color: string,
    intensity: number
  ) => {
    const alpha = (intensity / 100) * 0.7;
    ctx.save();
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.beginPath();
    
    const outerLips = FACE_MESH_LANDMARKS.lips.outer;
    const firstPoint = landmarks[outerLips[0]];
    ctx.moveTo(firstPoint.x * width, firstPoint.y * height);
    
    for (let i = 1; i < outerLips.length; i++) {
      const point = landmarks[outerLips[i]];
      ctx.lineTo(point.x * width, point.y * height);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const drawBlush = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number,
    color: string,
    intensity: number
  ) => {
    const alpha = (intensity / 100) * 0.4;
    
    const drawCheek = (cheekPoints: number[]) => {
      let centerX = 0, centerY = 0;
      cheekPoints.forEach(idx => {
        centerX += landmarks[idx].x;
        centerY += landmarks[idx].y;
      });
      centerX = (centerX / cheekPoints.length) * width;
      centerY = (centerY / cheekPoints.length) * height;
      
      const radius = width * 0.06;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, hexToRgba(color, alpha));
      gradient.addColorStop(1, hexToRgba(color, 0));
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    
    drawCheek(FACE_MESH_LANDMARKS.leftCheek);
    drawCheek(FACE_MESH_LANDMARKS.rightCheek);
  }, []);

  const drawEyeShadow = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number,
    color: string,
    intensity: number
  ) => {
    const alpha = (intensity / 100) * 0.5;
    
    const drawEyeLid = (eyePoints: number[]) => {
      ctx.save();
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.beginPath();
      
      const firstPoint = landmarks[eyePoints[0]];
      ctx.moveTo(firstPoint.x * width, firstPoint.y * height);
      
      for (let i = 1; i < eyePoints.length; i++) {
        const point = landmarks[eyePoints[i]];
        ctx.lineTo(point.x * width, point.y * height);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    
    drawEyeLid(FACE_MESH_LANDMARKS.leftEye.upper);
    drawEyeLid(FACE_MESH_LANDMARKS.rightEye.upper);
  }, []);

  const drawEyeliner = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    width: number,
    height: number,
    color: string,
    intensity: number
  ) => {
    const lineWidth = (intensity / 100) * 3 + 1;
    
    const drawLine = (eyePoints: number[]) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      
      const firstPoint = landmarks[eyePoints[0]];
      ctx.moveTo(firstPoint.x * width, firstPoint.y * height);
      
      for (let i = 1; i < eyePoints.length; i++) {
        const point = landmarks[eyePoints[i]];
        ctx.lineTo(point.x * width, point.y * height);
      }
      ctx.stroke();
      ctx.restore();
    };
    
    drawLine(FACE_MESH_LANDMARKS.leftEye.upper);
    drawLine(FACE_MESH_LANDMARKS.rightEye.upper);
  }, []);

  const applySnapFilterEffects = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (!faceLandmarksRef.current?.multiFaceLandmarks?.[0]) return;
    if (selectedSnapFilter.id === "none") return;
    
    const landmarks = faceLandmarksRef.current.multiFaceLandmarks[0];
    const effects = selectedSnapFilter.effects;
    
    if (effects.lipTint) {
      drawLips(ctx, landmarks, width, height, effects.lipTint.color, effects.lipTint.intensity);
    }
    
    if (effects.lipGloss) {
      drawLips(ctx, landmarks, width, height, effects.lipGloss.color, effects.lipGloss.intensity * 0.5);
    }
    
    if (effects.blush) {
      drawBlush(ctx, landmarks, width, height, effects.blush.color, effects.blush.intensity);
    }
    
    if (effects.eyeShadow) {
      drawEyeShadow(ctx, landmarks, width, height, effects.eyeShadow.color, effects.eyeShadow.intensity);
    }
    
    if (effects.eyeliner) {
      drawEyeliner(ctx, landmarks, width, height, effects.eyeliner.color, effects.eyeliner.intensity);
    }
  }, [selectedSnapFilter, drawLips, drawBlush, drawEyeShadow, drawEyeliner]);

  const hasBeautyEffects = useCallback(() => {
    // Filters disabled - always return false for better performance
    return false;
  }, []);

  const lastFaceMeshTimeRef = useRef<number>(0);
  const FACE_MESH_INTERVAL = 150; // Run face mesh every 150ms (~7 FPS) for better performance
  const lowResCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const runFaceMesh = useCallback(async () => {
    if (!faceMeshRef.current || !videoRef.current || !isStreaming) return;
    
    // Skip FaceMesh during recording - use cached landmarks
    if (isRecording && faceLandmarksRef.current) {
      if (isStreaming && !isRecording) {
        beautyAnimationRef.current = requestAnimationFrame(runFaceMesh);
      }
      return;
    }
    
    const now = performance.now();
    const elapsed = now - lastFaceMeshTimeRef.current;
    
    // Only process face mesh at reduced frame rate
    if (elapsed >= FACE_MESH_INTERVAL) {
      lastFaceMeshTimeRef.current = now;
      
      try {
        // Use low-res canvas for FaceMesh (faster processing)
        if (!lowResCanvasRef.current) {
          lowResCanvasRef.current = document.createElement('canvas');
          lowResCanvasRef.current.width = 320;
          lowResCanvasRef.current.height = 180;
        }
        const lowResCtx = lowResCanvasRef.current.getContext('2d');
        if (lowResCtx && videoRef.current.readyState >= 2) {
          lowResCtx.drawImage(videoRef.current, 0, 0, 320, 180);
          await faceMeshRef.current.send({ image: lowResCanvasRef.current });
        }
        
        if (webglFilterRef.current && faceLandmarksRef.current) {
          webglFilterRef.current.updateFaceMesh(faceLandmarksRef.current);
        }
      } catch (err) {
        // Silent error - don't spam console
      }
    }
    
    if (isStreaming && !isRecording) {
      beautyAnimationRef.current = requestAnimationFrame(runFaceMesh);
    }
  }, [isStreaming, isRecording]);

  useEffect(() => {
    if (isStreaming && hasBeautyEffects()) {
      initFaceMesh();
      const startFaceMesh = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        runFaceMesh();
      };
      startFaceMesh();
    }
    
    return () => {
      if (beautyAnimationRef.current) {
        cancelAnimationFrame(beautyAnimationRef.current);
      }
    };
  }, [isStreaming, hasBeautyEffects, initFaceMesh, runFaceMesh]);

  useEffect(() => {
    if (webglFilterRef.current && selectedSnapFilter) {
      const filterSettings = createFilterSettings(selectedSnapFilter.effects);
      webglFilterRef.current.updateSettings({
        ...defaultSettings,
        ...filterSettings
      });
    }
  }, [selectedSnapFilter]);

  const lastPreviewTimeRef = useRef<number>(0);
  const PREVIEW_INTERVAL = 40; // Run preview at 25 FPS for smooth performance
  const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const processCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const runPreviewLoop = useCallback(() => {
    if (!videoRef.current || !previewCanvasRef.current || !isStreaming) {
      return;
    }
    
    const now = performance.now();
    const elapsed = now - lastPreviewTimeRef.current;
    
    // Throttle to reduce CPU usage
    if (elapsed < PREVIEW_INTERVAL) {
      previewAnimationRef.current = requestAnimationFrame(runPreviewLoop);
      return;
    }
    
    lastPreviewTimeRef.current = now;
    
    const video = videoRef.current;
    const previewCanvas = previewCanvasRef.current;
    
    // Cache context reference
    if (!previewCtxRef.current) {
      previewCtxRef.current = previewCanvas.getContext('2d', { alpha: false, willReadFrequently: false });
    }
    const ctx = previewCtxRef.current;
    
    if (!ctx || video.readyState < 2) {
      previewAnimationRef.current = requestAnimationFrame(runPreviewLoop);
      return;
    }
    
    // Use reduced resolution for processing (0.75x)
    const processWidth = Math.round(video.videoWidth * 0.75);
    const processHeight = Math.round(video.videoHeight * 0.75);
    
    if (previewCanvas.width !== processWidth || previewCanvas.height !== processHeight) {
      previewCanvas.width = processWidth;
      previewCanvas.height = processHeight;
    }
    
    try {
      // Check if we have WebGL filter and beauty effects
      if (webglFilterRef.current && hasBeautyEffects() && selectedSnapFilter.id !== "none") {
        // Create low-res processing canvas if needed
        if (!processCanvasRef.current) {
          processCanvasRef.current = document.createElement('canvas');
        }
        processCanvasRef.current.width = processWidth;
        processCanvasRef.current.height = processHeight;
        
        const processCtx = processCanvasRef.current.getContext('2d', { alpha: false });
        if (processCtx) {
          processCtx.drawImage(video, 0, 0, processWidth, processHeight);
          const filteredCanvas = webglFilterRef.current.render(processCanvasRef.current);
          ctx.drawImage(filteredCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
        }
      } else {
        // No filter - just draw video directly
        ctx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
      }
      
      // Apply CSS color filter if present
      if (selectedSnapFilter.effects.colorFilter) {
        previewCanvas.style.filter = selectedSnapFilter.effects.colorFilter.filter as string || '';
      } else {
        previewCanvas.style.filter = '';
      }
    } catch (err) {
      // Silent error
    }
    
    if (isStreaming) {
      previewAnimationRef.current = requestAnimationFrame(runPreviewLoop);
    }
  }, [isStreaming, hasBeautyEffects, selectedSnapFilter]);

  useEffect(() => {
    if (isStreaming && webglReady && hasBeautyEffects()) {
      runPreviewLoop();
    }
    
    return () => {
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
      }
    };
  }, [isStreaming, webglReady, hasBeautyEffects, runPreviewLoop]);

  const flipCamera = useCallback(async () => {
    if (isRecording) return;
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    await startCamera(newFacing);
    toast({ title: newFacing === "user" ? "Front Camera" : "Back Camera" });
  }, [facingMode, isRecording, startCamera, toast]);

  const toggleLock = useCallback(() => {
    setIsLocked(!isLocked);
    toast({ title: isLocked ? "Screen Unlocked" : "Screen Locked" });
  }, [isLocked, toast]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const addTextOverlay = useCallback(() => {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id: `text-${Date.now()}`,
      type: "text",
      content: newText,
      x: 50,
      y: 30,
      fontSize: 28,
      color: newTextColor,
    };
    setOverlays(prev => [...prev, overlay]);
    setNewText("");
    setShowTextInput(false);
    toast({ title: "Text Added" });
  }, [newText, newTextColor, toast]);

  const addLinkOverlay = useCallback(() => {
    if (!newLinkUrl.trim() || !newLinkLabel.trim()) return;
    const overlay: LinkOverlay = {
      id: `link-${Date.now()}`,
      type: "link",
      url: newLinkUrl,
      label: newLinkLabel,
      x: 50,
      y: 85,
    };
    setOverlays(prev => [...prev, overlay]);
    setNewLinkUrl("");
    setNewLinkLabel("");
    setShowLinkInput(false);
    toast({ title: "Link Added" });
  }, [newLinkUrl, newLinkLabel, toast]);

  const addImageOverlay = useCallback(() => {
    if (!newImageUrl.trim()) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.current.set(newImageUrl, img);
      const overlay: ImageOverlay = {
        id: `img-${Date.now()}`,
        type: "image",
        src: newImageUrl,
        x: 80,
        y: 20,
        width: Math.min(img.width, 100),
        height: Math.min(img.height, 100),
      };
      setOverlays(prev => [...prev, overlay]);
      setNewImageUrl("");
      setShowImageInput(false);
      toast({ title: "Sticker Added" });
    };
    img.onerror = () => {
      toast({ title: "Error", description: "Failed to load image.", variant: "destructive" });
    };
    img.src = newImageUrl;
  }, [newImageUrl, toast]);

  const addStickerOverlay = useCallback((sticker: InteractiveSticker) => {
    const overlay: StickerOverlay = {
      id: `sticker-${Date.now()}`,
      type: "sticker",
      stickerId: sticker.id,
      x: 50,
      y: 50,
      scale: 1,
    };
    setOverlays(prev => [...prev, overlay]);
    setShowStickerInput(false);
    toast({ title: `تمت إضافة ${sticker.name}` });
  }, [toast]);

  const clearOverlays = useCallback(() => {
    setOverlays([]);
  }, []);

  const handleGallerySelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({ title: "خطأ", description: "يرجى اختيار صورة أو فيديو", variant: "destructive" });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الملف كبير جداً (الحد الأقصى 100MB)", variant: "destructive" });
      return;
    }

    // Revoke previous URL to prevent memory leak
    if (uploadedMedia?.url) {
      URL.revokeObjectURL(uploadedMedia.url);
    }

    const url = URL.createObjectURL(file);
    setUploadedMedia({ url, type: isImage ? "image" : "video", file });
    stopCamera();
    toast({ title: "تم التحميل", description: isImage ? "تم تحميل الصورة" : "تم تحميل الفيديو" });
    
    if (e.target) {
      e.target.value = '';
    }
  }, [stopCamera, toast, uploadedMedia]);

  const clearUploadedMedia = useCallback(() => {
    if (uploadedMedia?.url) {
      URL.revokeObjectURL(uploadedMedia.url);
    }
    setUploadedMedia(null);
  }, [uploadedMedia]);

  const publishStatus = useCallback(async () => {
    if (!uploadedMedia?.file) {
      toast({ title: "خطأ", description: "لا يوجد ملف للنشر", variant: "destructive" });
      return;
    }

    setIsPublishing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedMedia.file!);
      });

      const mediaUrl = await base64Promise;
      
      await apiRequest('POST', '/api/statuses', {
        mediaUrl,
        mediaType: uploadedMedia.type,
        text: ''
      });

      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      toast({ title: "تم نشر الحالة بنجاح" });
      clearUploadedMedia();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to publish status:', error);
      toast({ title: "خطأ", description: "فشل في نشر الحالة", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  }, [uploadedMedia, toast, queryClient, clearUploadedMedia, onOpenChange]);

  const openGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const switchToCamera = useCallback(() => {
    clearUploadedMedia();
    setMode("camera");
    startCamera();
  }, [clearUploadedMedia, startCamera]);

  const switchToUpload = useCallback(() => {
    stopCamera();
    setMode("upload");
  }, [stopCamera]);

  const drawOverlays = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    overlays.forEach(overlay => {
      const x = (overlay.x / 100) * width;
      const y = (overlay.y / 100) * height;

      if (overlay.type === "text") {
        ctx.save();
        ctx.font = `bold ${overlay.fontSize}px Inter, sans-serif`;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(overlay.content, x, y);
        ctx.restore();
      } else if (overlay.type === "link") {
        ctx.save();
        ctx.font = "bold 20px Inter, sans-serif";
        ctx.textAlign = "center";
        const padding = 12;
        const textWidth = ctx.measureText(overlay.label).width;
        
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.roundRect(x - textWidth/2 - padding, y - 18, textWidth + padding * 2, 32, 16);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.fillText(overlay.label, x, y + 4);
        
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - textWidth/2, y + 8);
        ctx.lineTo(x + textWidth/2, y + 8);
        ctx.stroke();
        ctx.restore();
      } else if (overlay.type === "image") {
        const cachedImg = imageCache.current.get(overlay.src);
        if (cachedImg) {
          ctx.drawImage(cachedImg, x, y, overlay.width, overlay.height);
        }
      } else if (overlay.type === "sticker") {
        const sticker = interactiveStickers.find(s => s.id === overlay.stickerId);
        if (sticker) {
          ctx.save();
          const size = 50 * overlay.scale;
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          
          if (sticker.icon === "heart") {
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            const heartX = x;
            const heartY = y;
            const heartSize = size * 0.6;
            ctx.moveTo(heartX, heartY + heartSize * 0.3);
            ctx.bezierCurveTo(heartX, heartY, heartX - heartSize, heartY, heartX - heartSize, heartY + heartSize * 0.3);
            ctx.bezierCurveTo(heartX - heartSize, heartY + heartSize * 0.6, heartX, heartY + heartSize, heartX, heartY + heartSize);
            ctx.bezierCurveTo(heartX, heartY + heartSize, heartX + heartSize, heartY + heartSize * 0.6, heartX + heartSize, heartY + heartSize * 0.3);
            ctx.bezierCurveTo(heartX + heartSize, heartY, heartX, heartY, heartX, heartY + heartSize * 0.3);
            ctx.fill();
          } else if (sticker.icon === "star") {
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = size * 0.5;
            const innerRadius = size * 0.25;
            for (let i = 0; i < spikes * 2; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (i * Math.PI) / spikes - Math.PI / 2;
              const px = x + Math.cos(angle) * radius;
              const py = y + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          } else if (sticker.icon === "flame") {
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.moveTo(x, y - size * 0.5);
            ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.2, x + size * 0.3, y + size * 0.3);
            ctx.quadraticCurveTo(x + size * 0.1, y + size * 0.1, x, y + size * 0.5);
            ctx.quadraticCurveTo(x - size * 0.1, y + size * 0.1, x - size * 0.3, y + size * 0.3);
            ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.2, x, y - size * 0.5);
            ctx.fill();
          } else if (sticker.icon === "message-circle") {
            ctx.fillStyle = "#3b82f6";
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - size * 0.15, y + size * 0.3);
            ctx.lineTo(x - size * 0.3, y + size * 0.5);
            ctx.lineTo(x, y + size * 0.35);
            ctx.fill();
          } else if (sticker.icon === "thumbs-up") {
            ctx.fillStyle = "#3b82f6";
            ctx.beginPath();
            ctx.roundRect(x - size * 0.35, y, size * 0.2, size * 0.4, 4);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(x - size * 0.1, y - size * 0.3, size * 0.45, size * 0.7, 8);
            ctx.fill();
          } else if (sticker.icon === "sparkles") {
            ctx.fillStyle = "#ec4899";
            const drawSparkle = (sx: number, sy: number, sparkleSize: number) => {
              ctx.beginPath();
              ctx.moveTo(sx, sy - sparkleSize);
              ctx.lineTo(sx + sparkleSize * 0.3, sy);
              ctx.lineTo(sx, sy + sparkleSize);
              ctx.lineTo(sx - sparkleSize * 0.3, sy);
              ctx.closePath();
              ctx.fill();
            };
            drawSparkle(x, y, size * 0.4);
            drawSparkle(x + size * 0.35, y - size * 0.2, size * 0.25);
            drawSparkle(x - size * 0.3, y + size * 0.25, size * 0.2);
          } else if (sticker.icon === "zap") {
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            ctx.moveTo(x + size * 0.1, y - size * 0.5);
            ctx.lineTo(x - size * 0.2, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x - size * 0.1, y + size * 0.5);
            ctx.lineTo(x + size * 0.2, y);
            ctx.lineTo(x, y);
            ctx.closePath();
            ctx.fill();
          } else if (sticker.icon === "eye") {
            ctx.fillStyle = "#8b5cf6";
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.45, size * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#1e1b4b";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        }
      }
    });
  }, [overlays]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || isLocked) return;

    chunksRef.current = [];
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    setIsRecording(true);

    const drawFrame = () => {
      if (!video || !ctx) return;
      
      ctx.save();
      
      if (webglFilterRef.current && webglReady && hasBeautyEffects()) {
        const filteredCanvas = webglFilterRef.current.render(video);
        
        if (facingMode === "user") {
          ctx.scale(-1, 1);
          ctx.drawImage(filteredCanvas, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(filteredCanvas, 0, 0, canvas.width, canvas.height);
        }
      } else {
        const effects = selectedSnapFilter.effects;
        let filterString = "";
        
        if (effects.colorFilter?.filter) {
          filterString = effects.colorFilter.filter as string;
        }
        
        if (effects.smooth) {
          const blurAmount = (effects.smooth / 100) * 1.5;
          filterString += ` blur(${blurAmount}px)`;
        }
        if (effects.brighten) {
          const brightnessAmount = 1 + (effects.brighten / 100) * 0.3;
          filterString += ` brightness(${brightnessAmount})`;
        }
        
        if (filterString.trim()) {
          ctx.filter = filterString.trim();
        }
        
        if (facingMode === "user") {
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      ctx.restore();
      
      ctx.filter = "none";
      
      if (!webglReady || !hasBeautyEffects()) {
        applySnapFilterEffects(ctx, canvas.width, canvas.height);
      }
      
      drawOverlays(ctx, canvas.width, canvas.height);
      
      animationRef.current = requestAnimationFrame(drawFrame);
    };

    const canvasStream = canvas.captureStream(30);
    if (!isMuted) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
    }

    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideo(url);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    
    drawFrame();
  }, [selectedSnapFilter, isMuted, drawOverlays, facingMode, isLocked, applySnapFilterEffects, webglReady, hasBeautyEffects]);

  const stopRecording = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  const downloadVideo = useCallback(() => {
    if (!recordedVideo) return;
    
    const a = document.createElement('a');
    a.href = recordedVideo;
    a.download = `status-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({ title: "Video Saved" });
  }, [recordedVideo, toast]);

  const resetRecording = useCallback(() => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    setRecordedVideo(null);
    setRecordingTime(0);
  }, [recordedVideo]);

  useEffect(() => {
    if (open) {
      if (mode === "camera") {
        startCamera();
      }
    } else {
      stopCamera();
      resetRecording();
      clearUploadedMedia();
      setOverlays([]);
      setShowTextInput(false);
      setShowLinkInput(false);
      setShowImageInput(false);
      setShowStickerInput(false);
      setIsLocked(false);
      setMode("upload");
    }
    
    return () => {
      stopCamera();
    };
  }, [open, mode, startCamera, stopCamera, resetRecording, clearUploadedMedia]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 m-0 rounded-none border-0 bg-black">
        <DialogTitle className="sr-only">Daily Status Video Recorder</DialogTitle>
        <DialogDescription className="sr-only">Record a video status update with filters and overlays</DialogDescription>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleGallerySelect}
          className="hidden"
          data-testid="input-gallery-file"
        />
        <div className="relative flex flex-col h-full">
          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleLock}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full h-20 w-20"
                data-testid="button-unlock-screen"
              >
                <Lock className="h-10 w-10" />
              </Button>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => !isLocked && onOpenChange(false)}
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full h-10 w-10"
              disabled={isLocked}
              data-testid="button-close-recorder"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {isRecording && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-semibold text-sm">{formatTime(recordingTime)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {overlays.length > 0 && !isLocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearOverlays}
                  className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
                  data-testid="button-clear-overlays"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Main video area */}
          <div className="flex-1 relative overflow-hidden">
            {recordedVideo ? (
              <video 
                src={recordedVideo} 
                controls 
                autoPlay
                loop
                className="w-full h-full object-cover"
                data-testid="video-preview"
              />
            ) : uploadedMedia ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-4">
                <div className="flex-1 flex items-center justify-center w-full max-h-[60vh]">
                  {uploadedMedia.type === "image" ? (
                    <img 
                      src={uploadedMedia.url} 
                      alt="Uploaded" 
                      className="max-w-full max-h-full object-contain rounded-lg"
                      data-testid="uploaded-image-preview"
                    />
                  ) : (
                    <video 
                      src={uploadedMedia.url} 
                      controls 
                      autoPlay
                      loop
                      className="max-w-full max-h-full object-contain rounded-lg"
                      data-testid="uploaded-video-preview"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
                  <Button 
                    onClick={publishStatus}
                    disabled={isPublishing}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-white rounded-full px-8 w-full"
                    data-testid="button-publish-status"
                  >
                    {isPublishing ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري النشر...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        إضافة إلى الحالة
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => {
                      clearUploadedMedia();
                      openGallery();
                    }}
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 w-full"
                    data-testid="button-choose-another"
                  >
                    <Image className="h-5 w-5 mr-2" />
                    اختيار ملف آخر
                  </Button>
                </div>
              </div>
            ) : mode === "upload" ? (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                    <Image className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">إضافة حالة</h3>
                  <p className="text-white/70 mb-6">اختر صورة أو فيديو من المعرض</p>
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={openGallery}
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 rounded-full px-8"
                      data-testid="button-open-gallery"
                    >
                      <Image className="h-5 w-5 mr-2" />
                      اختيار من المعرض
                    </Button>
                    <Button 
                      onClick={switchToCamera}
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
                      data-testid="button-switch-to-camera"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      التقاط بالكاميرا
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {cameraLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      <p className="text-lg">جاري تشغيل الكاميرا...</p>
                    </div>
                  </div>
                ) : cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center p-4">
                      <VideoOff className="h-20 w-20 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-4">{cameraError}</p>
                      <Button 
                        onClick={() => startCamera()}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                        data-testid="button-retry-camera"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${webglReady && hasBeautyEffects() ? 'hidden' : ''}`}
                      style={{ 
                        transform: facingMode === "user" ? 'scaleX(-1)' : 'none',
                        ...(selectedSnapFilter.effects.colorFilter || {})
                      }}
                      data-testid="video-stream"
                    />
                    <canvas 
                      ref={previewCanvasRef} 
                      className={`w-full h-full object-cover ${webglReady && hasBeautyEffects() ? '' : 'hidden'}`}
                      style={{ 
                        transform: facingMode === "user" ? 'scaleX(-1)' : 'none'
                      }}
                      data-testid="canvas-preview"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlays preview */}
                    <div className="absolute inset-0 pointer-events-none">
                      {overlays.map(overlay => {
                        const style: React.CSSProperties = {
                          position: 'absolute',
                          left: `${overlay.x}%`,
                          top: `${overlay.y}%`,
                          transform: 'translate(-50%, -50%)',
                        };

                        if (overlay.type === "text") {
                          return (
                            <div
                              key={overlay.id}
                              style={{
                                ...style,
                                fontSize: overlay.fontSize,
                                color: overlay.color,
                                fontWeight: 'bold',
                                textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {overlay.content}
                            </div>
                          );
                        } else if (overlay.type === "link") {
                          return (
                            <div
                              key={overlay.id}
                              className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full"
                              style={style}
                            >
                              <span className="text-white font-semibold text-sm underline">
                                {overlay.label}
                              </span>
                            </div>
                          );
                        } else if (overlay.type === "image") {
                          return (
                            <img
                              key={overlay.id}
                              src={overlay.src}
                              alt=""
                              style={{
                                ...style,
                                width: overlay.width,
                                height: overlay.height,
                                objectFit: 'contain',
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>

                  </>
                )}
              </>
            )}
          </div>

          {/* Left side controls - Flip & Lock */}
          {!recordedVideo && isStreaming && !isLocked && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
              {/* Flip camera button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={flipCamera}
                disabled={isRecording}
                className={`h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white ${isRecording ? 'opacity-50' : ''}`}
                data-testid="button-flip-camera"
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>

              {/* Lock screen button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLock}
                className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                data-testid="button-lock-screen"
              >
                <Unlock className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Right side controls */}
          {!recordedVideo && isStreaming && !isLocked && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
              {/* Mute button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className={`h-12 w-12 rounded-full backdrop-blur-sm ${isMuted ? 'bg-red-500/80 hover:bg-red-500' : 'bg-black/40 hover:bg-black/60'} text-white`}
                data-testid="button-mute"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              {/* Text button */}
              <Popover open={showTextInput} onOpenChange={setShowTextInput}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                    data-testid="button-add-text"
                  >
                    <Type className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 bg-black/90 backdrop-blur-md border-white/20">
                  <div className="space-y-3">
                    <Input
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Type text..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      data-testid="input-text-content"
                      onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newTextColor}
                        onChange={(e) => setNewTextColor(e.target.value)}
                        className="w-12 h-9 p-1 bg-transparent border-white/20"
                        data-testid="input-text-color"
                      />
                      <Button onClick={addTextOverlay} disabled={!newText.trim()} className="flex-1" data-testid="button-confirm-text">
                        Add
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Link button */}
              <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                    data-testid="button-add-link"
                  >
                    <Link2 className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 bg-black/90 backdrop-blur-md border-white/20">
                  <div className="space-y-3">
                    <Input
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="Swipe up"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      data-testid="input-link-label"
                    />
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      data-testid="input-link-url"
                    />
                    <Button onClick={addLinkOverlay} disabled={!newLinkUrl.trim() || !newLinkLabel.trim()} className="w-full" data-testid="button-confirm-link">
                      Add Link
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Sticker/Image button */}
              <Popover open={showImageInput} onOpenChange={setShowImageInput}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                    data-testid="button-add-sticker"
                  >
                    <Image className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 bg-black/90 backdrop-blur-md border-white/20">
                  <div className="space-y-3">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Image URL..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      data-testid="input-sticker-url"
                    />
                    <Button onClick={addImageOverlay} disabled={!newImageUrl.trim()} className="w-full" data-testid="button-confirm-sticker">
                      Add Sticker
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Interactive Reactions Stickers button */}
              <Popover open={showStickerInput} onOpenChange={setShowStickerInput}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 backdrop-blur-sm hover:opacity-90 text-white"
                    data-testid="button-add-reactions"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-72 bg-black/90 backdrop-blur-md border-white/20 p-3">
                  <div className="space-y-3">
                    <p className="text-white/80 text-sm font-medium text-center">تفاعلات وملصقات</p>
                    <div className="grid grid-cols-4 gap-2">
                      {interactiveStickers.map((sticker) => {
                        const IconComp = sticker.IconComponent;
                        return (
                          <button
                            key={sticker.id}
                            onClick={() => addStickerOverlay(sticker)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-br ${sticker.gradient} hover:opacity-80 transition-opacity`}
                            data-testid={`button-sticker-${sticker.id}`}
                          >
                            <IconComp className="h-6 w-6 text-white" />
                            <span className="text-[10px] text-white font-medium">{sticker.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Bottom controls */}
          {!isLocked && (
            <div className="absolute bottom-0 left-0 right-0 z-20 pb-6">
              {recordedVideo ? (
                /* Post-recording controls */
                <div className="flex items-center justify-center gap-6 px-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={resetRecording}
                    className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full h-14 px-6"
                    data-testid="button-retake"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Retake
                  </Button>
                  <Button
                    size="lg"
                    onClick={downloadVideo}
                    className="bg-white hover:bg-white/90 text-black rounded-full h-14 px-8 font-semibold"
                    data-testid="button-save"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Save
                  </Button>
                </div>
              ) : uploadedMedia ? (
                /* Uploaded media controls */
                <div className="flex items-center justify-center gap-6 px-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={clearUploadedMedia}
                    className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full h-14 px-6"
                    data-testid="button-choose-another"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    اختيار آخر
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      toast({ title: "تم نشر الحالة", description: "تم نشر حالتك بنجاح" });
                      onOpenChange(false);
                    }}
                    className="bg-white hover:bg-white/90 text-black rounded-full h-14 px-8 font-semibold"
                    data-testid="button-share-status"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    نشر الحالة
                  </Button>
                </div>
              ) : mode === "camera" && isStreaming ? (
                <>
                  {/* Record button */}
                  <div className="flex items-center justify-center">
                    {isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="relative"
                        data-testid="button-stop-recording"
                      >
                        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent">
                          <div className="w-8 h-8 rounded-sm bg-red-500" />
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="relative group"
                        data-testid="button-start-recording"
                      >
                        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95">
                          <div className="w-16 h-16 rounded-full bg-red-500 group-hover:bg-red-400 transition-colors" />
                        </div>
                      </button>
                    )}
                  </div>
                  {/* Switch to upload mode button */}
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={switchToUpload}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                      data-testid="button-switch-to-upload"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      أو اختر من المعرض
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FloatingVideoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-primary to-primary/80"
      data-testid="button-floating-video"
    >
      <Video className="h-6 w-6" />
    </Button>
  );
}
