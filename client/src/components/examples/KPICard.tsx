import { KPICard } from "../KPICard";
import { CheckCircle, Users, FolderOpen, Clock } from "lucide-react";

export default function KPICardExample() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <KPICard
        label="Tasks Completed"
        value={47}
        trend={12}
        trendUp={true}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <KPICard
        label="Active Projects"
        value={8}
        trend={2}
        trendUp={true}
        icon={<FolderOpen className="h-5 w-5" />}
      />
      <KPICard
        label="Team Members"
        value={24}
        icon={<Users className="h-5 w-5" />}
      />
      <KPICard
        label="Pending Reviews"
        value={5}
        trend={-3}
        trendUp={false}
        icon={<Clock className="h-5 w-5" />}
      />
    </div>
  );
}
