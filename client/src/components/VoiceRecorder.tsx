import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, X, Loader2 } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, onCancel, isUploading }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' 
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg" data-testid="voice-recorder">
      {!audioBlob ? (
        <>
          {isRecording ? (
            <>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
              <Button 
                size="icon" 
                variant="destructive" 
                onClick={stopRecording}
                data-testid="button-stop-recording"
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground flex-1">اضغط للتسجيل</span>
              <Button 
                size="icon" 
                variant="default" 
                onClick={startRecording}
                data-testid="button-start-recording"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleCancel}
            data-testid="button-cancel-recording"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <audio 
            src={audioUrl || undefined} 
            controls 
            className="h-8 flex-1"
            data-testid="audio-preview"
          />
          <Button 
            size="icon" 
            variant="default" 
            onClick={handleSend}
            disabled={isUploading}
            data-testid="button-send-voice"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleCancel}
            disabled={isUploading}
            data-testid="button-cancel-voice"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
