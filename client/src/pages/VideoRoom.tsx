import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import Peer from "peerjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  X,
  Crown,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Meeting } from "@shared/schema";

interface VideoPeer {
  peerId: string;
  stream: MediaStream;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  imageUrl?: string;
}

export default function VideoRoom() {
  const [match, params] = useRoute("/video-room/:meetingId");
  const meetingId = params?.meetingId;
  const { toast } = useToast();

  // Get guest name from URL query param (for employee portal users)
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get('name');

  const [myPeerId, setMyPeerId] = useState<string>("");
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<VideoPeer[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHost, setIsHost] = useState<boolean | null>(null);

  // Fetch current user (may fail for guest users from employee portal)
  const { data: currentUser } = useQuery<{ id: string; firstName?: string; lastName?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Get display name - use authenticated user or guest name from URL
  const displayName = currentUser 
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User'
    : guestName || 'Guest';

  // Fetch meeting data to determine host
  const { data: meeting } = useQuery<Meeting>({
    queryKey: ["/api/meetings", meetingId],
    enabled: !!meetingId && !isNaN(Number(meetingId)),
  });

  // Determine if current user is host
  useEffect(() => {
    if (meeting && currentUser) {
      const isUserHost = meeting.organizerId === currentUser.id;
      setIsHost(isUserHost);
    }
  }, [meeting, currentUser]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "المدير (Manager)",
      text: "صباح الخير يا فريق! دعونا نبدأ بالتحديثات الأسبوعية.\nGood morning team! Let’s start with the weekly updates.",
      timestamp: "10:01 ص",
      isMe: false,
    },
    {
      id: "2",
      sender: "أمل (Amal)",
      text: "صباح النور! لقد أكملت المشروع الأخير وبدأت العمل على التالي...\nGood morning! I’ve completed the recent project...",
      timestamp: "10:02 ص",
      isMe: false,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<Peer | null>(null);
  const callsRef = useRef<any[]>([]);
  const connectionsRef = useRef<any[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [needsPlayClick, setNeedsPlayClick] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Effect to set video srcObject when myStream changes
  useEffect(() => {
    if (myStream && myVideoRef.current && !isVideoOff) {
      console.log("Setting video srcObject from effect");
      myVideoRef.current.srcObject = myStream;
      myVideoRef.current
        .play()
        .then(() => setNeedsPlayClick(false))
        .catch((e) => {
          console.error("Play failed in effect:", e);
          setNeedsPlayClick(true);
        });
    }
  }, [myStream, isVideoOff]);

  // Fix for remote participants: ensure they play when peers list changes
  useEffect(() => {
    // This side-effect is largely handled by RemoteVideo component,
    // but we keep this hook for potential global peer management if needed.
  }, [peers]);

  // Handle manual play button click
  const handlePlayClick = () => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
      myVideoRef.current
        .play()
        .then(() => setNeedsPlayClick(false))
        .catch((e) => console.error("Manual play failed:", e));
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ (Error)",
        description: "يرجى اختيار ملف صورة صالح. (Please select a valid image file)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "الملف كبير جداً (File too large)",
        description: "الحد الأقصى للصورة 5 ميجابايت. (Max 5MB allowed)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const sendImage = () => {
    if (!selectedImage) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: "أنت (You)",
      text: "",
      imageUrl: selectedImage,
      timestamp: new Date().toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    };
    setMessages((prev) => [...prev, msg]);

    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: "chat",
          message: {
            ...msg,
            isMe: false,
            sender: "مشارك " + myPeerId.slice(0, 4),
          },
        });
      }
    });

    setSelectedImage(null);
    toast({
      title: "تم الإرسال (Sent)",
      description: "تم إرسال الصورة بنجاح. (Image sent successfully)",
    });
  };

  const cancelImagePreview = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    if (!meetingId) return;

    // 1. Initialize Peer using PUBLIC PeerJS cloud (no local server needed)
    const peer = new Peer();

    peerInstance.current = peer;

    peer.on("open", (id) => {
      console.log("My Peer ID:", id);
      setMyPeerId(id);

      // 2. Get User Media with HD quality constraints
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const hdConstraints = {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };
        navigator.mediaDevices
          .getUserMedia(hdConstraints)
          .then((stream) => {
            console.log("Got MediaStream:", stream.id);
            setMyStream(stream);
            setCameraError(null);

            // Ensure ref is current before setting srcObject
            if (myVideoRef.current) {
              console.log("Setting myVideoRef srcObject");
              myVideoRef.current.srcObject = stream;
              // Force play() in case autoplay policy blocks it
              myVideoRef.current
                .play()
                .catch((e) => console.error("Auto-play failed:", e));
            } else {
              console.error("myVideoRef is null when setting stream");
            }

            // 3. Join Meeting (Signaling)
            joinMeeting(id, stream);

            // 4. Listen for incoming calls
            peer.on("call", (call) => {
              console.log("Incoming call from:", call.peer);
              call.answer(stream); // Answer with my stream

              call.on("stream", (remoteStream) => {
                addPeer(call.peer, remoteStream);
              });

              callsRef.current.push(call);
            });

            // 5. Listen for incoming data connections (Chat)
            peer.on("connection", (conn) => {
              console.log("Incoming data connection from:", conn.peer);
              setupConnection(conn);
            });
          })
          .catch((err) => {
            console.error("Failed to get video+audio media:", err);
            // Try audio-only mode as fallback
            navigator.mediaDevices
              .getUserMedia({ video: false, audio: true })
              .then((audioStream) => {
                console.log("Got audio-only MediaStream:", audioStream.id);
                setMyStream(audioStream);
                setIsVideoOff(true);
                setCameraError(null);
                toast({
                  title: "وضع الصوت فقط",
                  description: "تعذر الوصول للكاميرا. تم تفعيل الميكروفون فقط.",
                });

                if (myVideoRef.current) {
                  myVideoRef.current.srcObject = audioStream;
                }

                joinMeeting(id, audioStream);

                peer.on("call", (call) => {
                  call.answer(audioStream);
                  call.on("stream", (remoteStream) => {
                    addPeer(call.peer, remoteStream);
                  });
                  callsRef.current.push(call);
                });

                peer.on("connection", (conn) => {
                  setupConnection(conn);
                });
              })
              .catch((audioErr) => {
                console.error("Failed to get audio-only media:", audioErr);
                setCameraError(
                  "تعذر الوصول للكاميرا والميكروفون. يرجى السماح بالوصول من إعدادات المتصفح ثم تحديث الصفحة.",
                );
                toast({
                  title: "خطأ في الوصول",
                  description: "يرجى السماح بالوصول للكاميرا/الميكروفون من إعدادات المتصفح",
                  variant: "destructive",
                });
              });
          });
      } else {
        setCameraError(
          "متصفحك لا يدعم الوصول للكاميرا (Browser not supported)",
        );
      }
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });

    return () => {
      leaveMeeting();
      peer.destroy();
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [meetingId]);

  const joinMeeting = async (peerId: string, stream: MediaStream) => {
    try {
      await apiRequest("POST", `/api/meetings/${meetingId}/join`, { peerId });
      const res = await apiRequest(
        "GET",
        `/api/meetings/${meetingId}/participants`,
      );
      const participants: string[] = await res.json();
      participants.forEach((pid) => {
        if (pid !== peerId) {
          connectToPeer(pid, stream);
          connectDataPeer(pid);
        }
      });
    } catch (err) {
      console.error("Failed to join meeting:", err);
    }
  };

  const connectDataPeer = (remotePeerId: string) => {
    if (!peerInstance.current) return;
    const conn = peerInstance.current.connect(remotePeerId);
    setupConnection(conn);
  };

  const setupConnection = (conn: any) => {
    conn.on("open", () => {
      console.log("Data connection open with:", conn.peer);
      connectionsRef.current.push(conn);
    });
    conn.on("data", (data: any) => {
      console.log("Received data:", data);
      if (data.type === "chat") {
        setMessages((prev) => [...prev, data.message]);
      }
    });
  };

  const connectToPeer = (remotePeerId: string, stream: MediaStream) => {
    if (!peerInstance.current) return;
    const call = peerInstance.current.call(remotePeerId, stream);
    call.on("stream", (remoteStream) => addPeer(remotePeerId, remoteStream));
    callsRef.current.push(call);
  };

  const addPeer = (peerId: string, stream: MediaStream) => {
    setPeers((prev) => {
      if (prev.find((p) => p.peerId === peerId)) return prev;
      return [...prev, { peerId, stream }];
    });
  };

  const leaveMeeting = async () => {
    if (meetingId && myPeerId) {
      await apiRequest("POST", `/api/meetings/${meetingId}/leave`, {
        peerId: myPeerId,
      });
    }
  };

  const toggleMute = () => {
    if (myStream) {
      myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    window.close();
    window.location.href = "/meetings";
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: "أنت (You)",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    };
    setMessages([...messages, msg]);

    // Broadcast message to all peers
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: "chat",
          message: {
            ...msg,
            isMe: false,
            sender: "مشارك " + myPeerId.slice(0, 4),
          },
        });
      }
    });

    setNewMessage("");
  };

  return (
    <div
      className="flex flex-col md:flex-row h-screen bg-gray-900 text-white overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Right Sidebar (Chat) - Dark Theme & Wider (md:w-96) */}
      <div className="w-full md:w-96 bg-gray-800 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 shadow-2xl z-10 order-2 h-1/3 md:h-full">
        {/* Chat Header */}
        <div className="h-10 md:h-16 flex items-center justify-between px-4 border-b border-gray-700 bg-gray-800 sticky top-0 shadow-md">
          <h2 className="text-sm md:text-lg font-bold text-white drop-shadow-md">
            الدردشة (Chat)
          </h2>
          <div className="flex gap-2 text-green-500">
            {/* Icons placeholder */}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 bg-gray-800/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 md:gap-3 ${msg.isMe ? "flex-row-reverse" : ""}`}
            >
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-700 border border-gray-600 flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-300 shadow-inner drop-shadow-sm">
                {msg.sender[0]}
              </div>
              <div className="flex flex-col max-w-[85%] md:max-w-[80%]">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-bold text-gray-300 ml-2 drop-shadow-sm">
                    {msg.sender}
                  </span>
                  <span className="text-[8px] md:text-[10px] text-gray-500">
                    {msg.timestamp}
                  </span>
                </div>
                {msg.imageUrl ? (
                  <div
                    className={`p-1 rounded-2xl shadow-lg overflow-hidden ${msg.isMe ? "bg-green-600 rounded-tr-none shadow-green-900/30" : "bg-gray-700 border border-gray-600 rounded-tl-none shadow-black/30"}`}
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Shared image"
                      className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: "200px", objectFit: "contain" }}
                      onClick={() => window.open(msg.imageUrl, "_blank")}
                      data-testid={`image-message-${msg.id}`}
                    />
                  </div>
                ) : (
                  <div
                    className={`p-2 md:p-3 rounded-2xl text-xs md:text-sm whitespace-pre-line shadow-lg ${msg.isMe ? "bg-green-600 text-white rounded-tr-none shadow-green-900/30" : "bg-gray-700 text-white border border-gray-600 rounded-tl-none shadow-black/30"}`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <div className="p-2 md:p-3 bg-gray-800 border-t border-gray-700">
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-h-24 md:max-h-32 rounded-lg border border-gray-600"
                data-testid="image-preview"
              />
              <button
                onClick={cancelImagePreview}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs hover:bg-red-700 transition-colors shadow-lg"
                data-testid="button-cancel-image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <Button
              onClick={sendImage}
              size="sm"
              className="mt-2 bg-green-600 hover:bg-green-700 text-white gap-2"
              data-testid="button-send-image"
            >
              <Send className="w-3 h-3 rotate-180" />
              إرسال الصورة (Send Image)
            </Button>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-2 md:p-4 bg-gray-800 border-t border-gray-700">
          {/* Hidden file input */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
            data-testid="input-image-file"
          />
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-3 md:px-4 py-1.5 md:py-2 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all shadow-inner">
            <button
              onClick={handleImageUpload}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
              data-testid="button-attach-image-chat"
            >
              <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <Input
              className="bg-transparent border-none shadow-none focus-visible:ring-0 h-8 p-0 text-white placeholder:text-gray-500 text-right text-sm"
              placeholder="اكتب رسالة..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              data-testid="input-chat-message"
            />
            <div className="flex items-center gap-2 text-gray-400">
              <button
                onClick={sendMessage}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-900/50"
                data-testid="button-send-message"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4 ml-0.5 rotate-180 drop-shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Left 3/4) - Now on the RIGHT (order-1 in RTL) */}
      <div className="flex-1 flex flex-col min-w-0 order-1 h-2/3 md:h-full bg-gray-900">
        {/* Top Bar */}
        <div className="h-12 md:h-14 flex items-center justify-between px-3 md:px-4 bg-black border-b border-gray-800 shadow-md z-20">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            <span className="text-xs md:text-sm font-medium text-white truncate max-w-[100px] md:max-w-none drop-shadow-md">
              جاري التسجيل... (Recording)
            </span>
            {/* Host/Participant Badge */}
            {isHost !== null && (
              <Badge
                className={`text-[10px] md:text-xs px-2 py-0.5 gap-1 ${
                  isHost
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/50"
                }`}
                data-testid={isHost ? "badge-host" : "badge-participant"}
              >
                {isHost ? (
                  <>
                    <Crown className="w-3 h-3" />
                    <span>المضيف (Host)</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3" />
                    <span>مشارك (Participant)</span>
                  </>
                )}
              </Badge>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="bg-red-700 hover:bg-red-800 text-white px-3 md:px-4 h-8 md:h-9 text-xs md:text-sm shadow-lg shadow-red-900/30 transition-all hover:scale-105"
            onClick={endCall}
            data-testid="button-leave-meeting"
          >
            مغادرة
          </Button>
        </div>

        {/* Meeting Status Banner */}
        <div className="bg-green-700 text-white px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 overflow-hidden shadow-md relative z-10">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Video className="w-3 h-3 md:w-4 md:h-4 text-white drop-shadow-sm" />
          </div>
          <div className="truncate flex-1">
            <span className="font-bold text-xs md:text-base drop-shadow-sm">
              الاجتماع:{" "}
            </span>
            <span className="font-normal text-xs md:text-sm truncate drop-shadow-sm">
              {meeting?.title || "اجتماع فيديو (Video Meeting)"}
            </span>
          </div>
          <div className="text-[10px] md:text-xs text-white/70">
            {peers.length + 1} {peers.length === 0 ? "مشارك (participant)" : "مشاركين (participants)"}
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex flex-col p-2 md:p-4 gap-2 md:gap-4 overflow-hidden bg-gray-900">
          {/* Main Host Video (Large) - Adjusted flex to 1.8 */}
          <div className="flex-[1.8] bg-black rounded-lg overflow-hidden relative border border-gray-700 shadow-2xl min-h-0">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black text-white p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <VideoOff className="w-8 h-8 md:w-12 md:h-12 text-red-500 drop-shadow-lg" />
                  <p className="text-xs md:text-base drop-shadow-md">
                    {cameraError}
                  </p>
                </div>
              </div>
            ) : isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <VideoOff className="w-16 h-16 md:w-24 md:h-24 text-white drop-shadow-2xl" />
              </div>
            ) : (
              <>
                <video
                  ref={myVideoRef}
                  muted
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    backgroundColor: "#000",
                  }}
                  onLoadedMetadata={() => {
                    console.log("Video metadata loaded");
                    myVideoRef.current
                      ?.play()
                      .then(() => setNeedsPlayClick(false))
                      .catch((e) => {
                        console.error("Play failed:", e);
                        setNeedsPlayClick(true);
                      });
                  }}
                />
                {needsPlayClick && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/70 cursor-pointer z-10"
                    onClick={handlePlayClick}
                  >
                    <div className="flex flex-col items-center gap-2 text-white">
                      <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/50">
                        <Video className="w-8 h-8 drop-shadow-md" />
                      </div>
                      <p className="text-sm drop-shadow-md">
                        اضغط لتشغيل الفيديو
                      </p>
                      <p className="text-xs text-gray-300">
                        Tap to start video
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-black/60 backdrop-blur-sm px-2 md:px-4 py-1 md:py-1.5 rounded-full text-white text-[10px] md:text-sm font-bold border border-gray-600 shadow-lg flex items-center gap-1.5">
              {isHost ? (
                <>
                  <Crown className="w-3 h-3 text-yellow-400" />
                  <span>أنت (المضيف)</span>
                </>
              ) : (
                <>
                  <Users className="w-3 h-3 text-blue-400" />
                  <span>أنت (مشارك)</span>
                </>
              )}
            </div>
          </div>

          {/* Participants Grid (Bottom Strip) */}
          <div className="flex-[1] grid grid-cols-4 gap-2 md:gap-4 min-h-[80px] md:min-h-[150px] max-h-[120px] md:max-h-none">
            {peers.length === 0 ? (
              <div className="col-span-4 flex items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 text-gray-500 text-xs md:text-base shadow-inner">
                في انتظار المشاركين...
              </div>
            ) : (
              peers.map((peer) => <RemoteVideo key={peer.peerId} peer={peer} />)
            )}
            {/* Placeholders to fill grid if needed */}
            {[...Array(Math.max(0, 4 - peers.length))].map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-md"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs md:text-base shadow-inner">
                  {String.fromCharCode(65 + i)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="h-16 md:h-20 bg-black border-t border-gray-800 flex items-center justify-center gap-3 md:gap-6 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.8)] flex-shrink-0 z-30">
          <ControlBtn
            icon={
              isMuted ? (
                <MicOff className="w-5 h-5 drop-shadow-md" />
              ) : (
                <Mic className="w-5 h-5 drop-shadow-md" />
              )
            }
            active={!isMuted}
            onClick={toggleMute}
          />
          <ControlBtn
            icon={
              isVideoOff ? (
                <VideoOff className="w-5 h-5 drop-shadow-md" />
              ) : (
                <Video className="w-5 h-5 drop-shadow-md" />
              )
            }
            active={!isVideoOff}
            onClick={toggleVideo}
          />

          <ControlBtn
            icon={<PhoneOff className="w-5 h-5 drop-shadow-md" />}
            active={false}
            variant="danger"
            onClick={endCall}
          />
        </div>
      </div>
    </div>
  );
}

function ControlBtn({
  icon,
  active,
  variant = "default",
  onClick,
}: {
  icon: any;
  active: boolean;
  variant?: "default" | "danger";
  onClick?: () => void;
}) {
  const baseClass =
    "w-12 h-12 rounded-full flex items-center justify-center transition-all border transform hover:scale-110 duration-200";
  // Added shadow-lg and specific shadow colors for 3D effect
  const activeClass =
    "bg-white text-gray-900 border-gray-400 hover:bg-gray-100 shadow-lg shadow-white/20";
  const inactiveClass =
    "bg-red-900/30 text-red-500 border-red-900/50 hover:bg-red-900/50 shadow-lg shadow-red-900/10";
  const dangerClass =
    "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-lg shadow-red-600/40";

  let className = baseClass;
  if (variant === "danger") {
    className += ` ${dangerClass}`;
  } else {
    className += ` ${active ? activeClass : inactiveClass}`;
  }

  return (
    <button className={className} onClick={onClick}>
      {icon}
    </button>
  );
}

function RemoteVideo({ peer }: { peer: VideoPeer }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && peer.stream) {
      ref.current.srcObject = peer.stream;
      // Force play to ensure video starts
      ref.current
        .play()
        .catch((e) => console.error("Remote video play error:", e));
    }
  }, [peer.stream]);

  return (
    <div className="bg-black rounded-lg overflow-hidden relative border border-gray-700 shadow-lg transition-transform hover:scale-[1.02]">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-white text-xs font-medium border border-gray-600 shadow-sm">
        Peer {peer.peerId.slice(0, 4)}
      </div>
    </div>
  );
}
