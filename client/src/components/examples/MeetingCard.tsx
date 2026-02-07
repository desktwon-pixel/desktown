import { MeetingCard } from "../MeetingCard";

export default function MeetingCardExample() {
  return (
    <div className="space-y-3 max-w-md">
      <MeetingCard
        id="1"
        title="Sprint Planning"
        time="10:00 AM - 11:00 AM"
        date="Today"
        participants={[{ name: "Sarah Chen" }, { name: "James Wilson" }, { name: "David Kim" }]}
        room="Virtual Room A"
        onJoin={() => console.log("Join meeting")}
      />
      <MeetingCard
        id="2"
        title="Design Review"
        time="2:00 PM - 3:00 PM"
        date="Today"
        participants={[{ name: "Maria Garcia" }, { name: "James Wilson" }]}
        room="Virtual Room B"
        onJoin={() => console.log("Join meeting")}
      />
      <MeetingCard
        id="3"
        title="1:1 with Manager"
        time="4:00 PM - 4:30 PM"
        date="Tomorrow"
        participants={[{ name: "Sarah Chen" }, { name: "James Wilson" }]}
        room="Virtual Room A"
      />
    </div>
  );
}
