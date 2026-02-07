import { ChatInput } from "../ChatInput";

export default function ChatInputExample() {
  return (
    <div className="max-w-md border rounded-md">
      <ChatInput onSend={(msg) => console.log("Send:", msg)} />
    </div>
  );
}
