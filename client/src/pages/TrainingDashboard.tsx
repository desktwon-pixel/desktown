import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import Peer from "peerjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import LiveChatPanel from "@/components/LiveChatPanel";
import TrainerControlPanel from "@/components/TrainerControlPanel";
import {
    Play,
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    Monitor,
    Hand,
    Users,
    Crown,
    Settings,
    Maximize,
    Volume2,
    VolumeX,
    MessageSquare,
    BookOpen,
    ChevronRight,
    Star,
    Clock,
    PhoneOff,
} from "lucide-react";

interface VideoPeer {
    peerId: string;
    stream: MediaStream;
    userName?: string;
}

interface SavedLesson {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    progress: number;
}

const recentLessons: SavedLesson[] = [
    {
        id: "1",
        title: "تطوير القيادة الاستراتيجية / Strategic Leadership",
        thumbnail: "/api/placeholder/200/112",
        duration: "45:30",
        progress: 75,
    },
    {
        id: "2",
        title: "التحليل المالي / Financial Analysis",
        thumbnail: "/api/placeholder/200/112",
        duration: "52:15",
        progress: 23,
    },
    {
        id: "3",
        title: "خصوصية البيانات / Data Privacy",
        thumbnail: "/api/placeholder/200/112",
        duration: "38:45",
        progress: 100,
    },
    {
        id: "4",
        title: "التواصل الفعال / Effective Communication",
        thumbnail: "/api/placeholder/200/112",
        duration: "41:20",
        progress: 60,
    },
    {
        id: "5",
        title: "إدارة المشاريع / Project Management",
        thumbnail: "/api/placeholder/200/112",
        duration: "55:00",
        progress: 0,
    },
];

export default function TrainingDashboard() {
    const [match, params] = useRoute("/training/live/:sessionId?");
    const sessionId = params?.sessionId || "default-training";
    const { toast } = useToast();

    const [isTrainer, setIsTrainer] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [volume, setVolume] = useState(80);

    // WebRTC State
    const [myPeerId, setMyPeerId] = useState<string>("");
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<VideoPeer[]>([]);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const peerInstance = useRef<Peer | null>(null);
    const callsRef = useRef<any[]>([]);
    const connectionsRef = useRef<any[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Fetch current user
    const { data: currentUser } = useQuery<{ id: string; firstName?: string; lastName?: string; role?: string }>({
        queryKey: ["/api/auth/user"],
    });

    useEffect(() => {
        if (currentUser?.role === "admin" || currentUser?.role === "manager") {
            setIsTrainer(true);
        }
    }, [currentUser]);

    const displayName = currentUser
        ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User'
        : 'Guest Trainee';

    // Initialize PeerJS
    useEffect(() => {
        const peer = new Peer();
        peerInstance.current = peer;

        peer.on("open", (id) => {
            console.log("My Peer ID:", id);
            setMyPeerId(id);

            // Get Media
            navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            }).then((stream) => {
                setMyStream(stream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }

                // Join Meeting Logic (Signaling)
                joinSession(id, stream);

                // Incoming calls
                peer.on("call", (call) => {
                    call.answer(stream);
                    call.on("stream", (remoteStream) => {
                        addPeer(call.peer, remoteStream);
                    });
                    callsRef.current.push(call);
                });

                // Incoming data (Chat)
                peer.on("connection", (conn) => {
                    setupConnection(conn);
                });
            }).catch(err => {
                console.error("Media Error:", err);
                toast({ title: "خطأ في الوسائط", description: "تعذر الوصول للكاميرا أو الميكروفون", variant: "destructive" });
            });
        });

        return () => {
            leaveSession();
            peer.destroy();
            if (myStream) myStream.getTracks().forEach(t => t.stop());
        };
    }, [sessionId]);

    const joinSession = async (peerId: string, stream: MediaStream) => {
        try {
            // Assuming existing meeting infrastructure handles training
            await apiRequest("POST", `/api/meetings/${sessionId}/join`, { peerId });
            const res = await apiRequest("GET", `/api/meetings/${sessionId}/participants`);
            const participants: string[] = await res.json();
            participants.forEach((pid) => {
                if (pid !== peerId) {
                    connectToPeer(pid, stream);
                    connectDataPeer(pid);
                }
            });
        } catch (err) {
            console.error("Join Error:", err);
        }
    };

    const connectToPeer = (remoteId: string, stream: MediaStream) => {
        const call = peerInstance.current?.call(remoteId, stream);
        call?.on("stream", (remoteStream) => addPeer(remoteId, remoteStream));
        callsRef.current.push(call);
    };

    const connectDataPeer = (remoteId: string) => {
        const conn = peerInstance.current?.connect(remoteId);
        if (conn) setupConnection(conn);
    };

    const setupConnection = (conn: any) => {
        conn.on("open", () => connectionsRef.current.push(conn));
        conn.on("data", (data: any) => {
            if (data.type === "chat") {
                // Handle incoming chat if needed (Chat component handles its own state usually, 
                // but since we passed LiveChatPanel, we might need a way to push messages)
                console.log("Received Chat Data:", data);
            }
        });
    };

    const addPeer = (peerId: string, stream: MediaStream) => {
        setPeers(prev => {
            if (prev.find(p => p.peerId === peerId)) return prev;
            return [...prev, { peerId, stream }];
        });
    };

    const leaveSession = async () => {
        if (myPeerId) {
            await apiRequest("POST", `/api/meetings/${sessionId}/leave`, { peerId: myPeerId });
        }
    };

    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
            setIsVideoOff(!isVideoOff);
        }
    };

    const startRecording = () => {
        if (!myStream) return;

        recordedChunksRef.current = [];
        const options = { mimeType: 'video/webm;codecs=vp9,opus' };

        let recorder: MediaRecorder;
        try {
            // Check for supported types
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : 'video/webm';

            recorder = new MediaRecorder(myStream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                toast({
                    title: "تم حفظ التسجيل / Recording Saved",
                    description: "المحاضرة أصبحت متاحة الآن في مكتبة الدروس المحفوظة.",
                });
                console.log("Recording Saved Blob Size:", blob.size);
            };

            recorder.start();
            setIsRecording(true);
            toast({
                title: "بدأ التسجيل / Recording Started",
                description: "يتم الآن تسجيل الجلسة المباشرة بجودة عالية."
            });
        } catch (e) {
            console.error("Recording Error:", e);
            toast({
                title: "خطأ في التسجيل",
                description: "المتصفح لا يدعم ميزة التسجيل المتقدمة",
                variant: "destructive"
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSendMessage = (message: string, imageUrl?: string) => {
        const msgData = {
            type: "chat",
            message: {
                id: Date.now().toString(),
                sender: { name: displayName, avatar: "/api/placeholder/40/40", role: isTrainer ? "trainer" : "participant" },
                content: { text: message, imageUrl },
                timestamp: new Date()
            }
        };

        connectionsRef.current.forEach(conn => {
            if (conn.open) conn.send(msgData);
        });
    };

    return (
        <div className="h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden" dir="rtl">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navigation Bar */}
                <div className="flex-shrink-0 h-16 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-white">منصة التدريب المؤسسي</h1>
                                <p className="text-xs text-gray-400">Corporate Training Hub</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className={`px-4 py-2 gap-2 ${isTrainer ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : "bg-blue-500/20 text-blue-400 border-blue-500/50"}`}>
                            {isTrainer ? <><Crown className="w-4 h-4" /> <span>المضيف / Host</span></> : <><Users className="w-4 h-4" /> <span>مشارك / Participant</span></>}
                        </Badge>
                        <div className="flex items-center gap-2">
                            <img src="/api/placeholder/40/40" alt="User" className="w-9 h-9 rounded-full border-2 border-teal-500" />
                            <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
                        </div>
                    </div>
                </div>

                {/* Live Banner */}
                <div className="flex-shrink-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 backdrop-blur-md border-b border-white/10 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                                <span className="text-sm font-bold text-red-400">LIVE</span>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">دورة القيادة الاستراتيجية / Strategic Leadership</h2>
                                <p className="text-xs text-gray-400">المتحدث: {isTrainer ? "أنت" : "د. أحمد المنصوري"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                <Clock className="w-4 h-4 text-teal-400" />
                                <span className="font-mono font-bold">00:45:22</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-blue-400">
                                <Users className="w-4 h-4" />
                                <span className="font-bold">{peers.length + 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video & Main Workspace */}
                <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {/* Primary Video Container */}
                        <div className="flex-[2] bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl group">
                            <video
                                ref={myVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`}
                            />

                            {isVideoOff && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                                    <div className="text-center">
                                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-white/10 flex items-center justify-center mx-auto mb-4">
                                            <VideoOff className="w-12 h-12 text-gray-500" />
                                        </div>
                                        <p className="text-white font-medium">الكاميرا مغلقة</p>
                                    </div>
                                </div>
                            )}

                            {/* Top Right Stats */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                {isRecording && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">REC</span>
                                    </div>
                                )}
                                <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10 uppercase text-[10px]">HD 1080p</Badge>
                            </div>

                            {/* Bottom Navigation Controls */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ControlButton
                                            icon={isMuted ? <MicOff /> : <Mic />}
                                            active={!isMuted}
                                            onClick={toggleMute}
                                            variant={isMuted ? 'danger' : 'default'}
                                        />
                                        <ControlButton
                                            icon={isVideoOff ? <VideoOff /> : <VideoIcon />}
                                            active={!isVideoOff}
                                            onClick={toggleVideo}
                                            variant={isVideoOff ? 'danger' : 'default'}
                                        />
                                        {isTrainer && (
                                            <ControlButton
                                                icon={<Monitor />}
                                                active={isScreenSharing}
                                                onClick={() => setIsScreenSharing(!isScreenSharing)}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {!isTrainer && (
                                            <Button
                                                onClick={() => setHandRaised(!handRaised)}
                                                className={`gap-2 h-12 px-6 rounded-xl transition-all ${handRaised ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white/10 hover:bg-white/20 blur-glass border border-white/10'}`}
                                            >
                                                <Hand className={`w-5 h-5 ${handRaised ? 'animate-bounce' : ''}`} />
                                                <span>{handRaised ? "إلغاء رفع اليد" : "رفع اليد"}</span>
                                            </Button>
                                        )}
                                        <Button variant="destructive" className="h-12 px-6 rounded-xl gap-2 shadow-lg shadow-red-500/20" onClick={() => window.close()}>
                                            <PhoneOff className="w-5 h-5" />
                                            <span>مغادرة</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                            <Volume2 className="w-4 h-4 text-teal-400" />
                                            <input
                                                type="range"
                                                value={volume}
                                                onChange={(e) => setVolume(Number(e.target.value))}
                                                className="w-24 accent-teal-500"
                                            />
                                        </div>
                                        <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                            <Maximize className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Participants & Library */}
                        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                            {/* Remote Peers Grid */}
                            <div className="col-span-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-sm font-bold opacity-80">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span>المشاركون النشطون / Active Peers</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-x-auto pb-2 scrollbar-thin">
                                    <div className="flex gap-4 h-full min-w-max">
                                        {peers.map(peer => (
                                            <div key={peer.peerId} className="w-48 h-full bg-black rounded-xl overflow-hidden relative border border-white/5 shadow-xl">
                                                <RemoteVideo peer={peer} />
                                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                                    <span className="text-[10px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 truncate max-w-full">
                                                        مشارك {peer.peerId.slice(0, 4)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Placeholder Peers */}
                                        {peers.length === 0 && Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-48 h-full bg-gray-800/40 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                                                <Users className="w-8 h-8 opacity-10" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Library Quick Access */}
                            <div className="col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-teal-400" />
                                        المكتبة / Library
                                    </h3>
                                    <ChevronRight className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
                                    {recentLessons.map(lesson => (
                                        <div key={lesson.id} className="group bg-white/5 rounded-xl p-2 border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer">
                                            <div className="flex gap-3">
                                                <div className="w-16 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
                                                    <img src={lesson.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Play className="w-3 h-3 text-white fill-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[11px] font-medium truncate mb-1">{lesson.title}</h4>
                                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-teal-500" style={{ width: `${lesson.progress}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Chat Sidebar */}
                    {showChat && (
                        <div className="w-96 flex-shrink-0">
                            <LiveChatPanel
                                isTrainer={isTrainer}
                                currentUserId={currentUser?.id || "guest"}
                                onSendMessage={handleSendMessage}
                            />
                        </div>
                    )}
                </div>

                {/* Floating Trainer Analytics Bar */}
                {isTrainer && (
                    <div className="px-4 pb-4">
                        <TrainerControlPanel
                            viewerCount={peers.length + 1}
                            isRecording={isRecording}
                            sessionDuration="00:45:22"
                            onToggleRecording={handleToggleRecording}
                            onScreenShare={() => setIsScreenSharing(!isScreenSharing)}
                            onOpenWhiteboard={() => { }}
                            onCreatePoll={() => { }}
                            onManageBreakout={() => { }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function ControlButton({
    icon,
    active,
    onClick,
    variant = 'default'
}: {
    icon: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    variant?: 'default' | 'danger';
}) {
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-2xl backdrop-blur-xl transition-all transform hover:scale-105 active:scale-95 border ${variant === 'danger'
                ? 'bg-red-500/20 border-red-500/40 text-red-500 shadow-lg shadow-red-500/10'
                : active
                    ? 'bg-white/10 border-white/20 text-white shadow-xl shadow-white/5'
                    : 'bg-gray-800/40 border-white/5 text-gray-400'
                }`}
        >
            {icon}
        </button>
    );
}

function RemoteVideo({ peer }: { peer: VideoPeer }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
            videoRef.current.play().catch(e => console.error("Remote video failed to play:", e));
        }
    }, [peer.stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
        />
    );
}
