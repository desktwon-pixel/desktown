import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Smile, Send } from "lucide-react";

interface ChatInputProps {
  onSend?: (message: string) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = "Type a message..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend?.(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t bg-background">
      <Button type="button" variant="ghost" size="icon" data-testid="button-attach">
        <Paperclip className="h-5 w-5" />
      </Button>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
        data-testid="input-chat-message"
      />
      <Button type="button" variant="ghost" size="icon" data-testid="button-emoji">
        <Smile className="h-5 w-5" />
      </Button>
      <Button type="submit" size="icon" disabled={!message.trim()} data-testid="button-send">
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
