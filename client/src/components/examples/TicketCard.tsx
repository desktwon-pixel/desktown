import { TicketCard } from "../TicketCard";

export default function TicketCardExample() {
  return (
    <div className="space-y-3">
      <TicketCard
        id="T-001"
        title="Cannot access reports module"
        reporter={{ name: "Emma Thompson" }}
        assignee={{ name: "Sarah Chen" }}
        priority="high"
        status="open"
        onClick={() => console.log("Ticket clicked")}
      />
      <TicketCard
        id="T-002"
        title="Slow loading on dashboard"
        reporter={{ name: "James Wilson" }}
        assignee={{ name: "David Kim" }}
        priority="medium"
        status="in_progress"
        onClick={() => console.log("Ticket clicked")}
      />
      <TicketCard
        id="T-003"
        title="Export feature not working"
        reporter={{ name: "Maria Garcia" }}
        assignee={null}
        priority="low"
        status="open"
        onClick={() => console.log("Ticket clicked")}
      />
    </div>
  );
}
