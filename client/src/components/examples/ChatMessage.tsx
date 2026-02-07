import { ChatMessage } from "../ChatMessage";

export default function ChatMessageExample() {
  return (
    <div className="space-y-4 p-4 max-w-md">
      <ChatMessage
        id="1"
        sender={{ name: "James Wilson" }}
        content="Hey team, how's the progress on the new feature?"
        timestamp="10:30 AM"
        isOwn={false}
      />
      <ChatMessage
        id="2"
        sender={{ name: "You" }}
        content="Going well! Should be done by end of day."
        timestamp="10:32 AM"
        isOwn={true}
      />
      <ChatMessage
        id="3"
        sender={{ name: "Maria Garcia" }}
        content="I'll have the designs ready for review in an hour."
        timestamp="10:35 AM"
        isOwn={false}
      />
    </div>
  );
}
