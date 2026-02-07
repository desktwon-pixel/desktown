import { useState } from "react";
import { TaskCard } from "../TaskCard";

type TaskType = {
  id: string;
  title: string;
  assignee: { name: string };
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
};

export default function TaskCardExample() {
  const [tasks, setTasks] = useState<TaskType[]>([
    { id: "1", title: "Review Q4 reports", assignee: { name: "Sarah Chen" }, priority: "high", status: "in_progress", dueDate: "Dec 10" },
    { id: "2", title: "Update user documentation", assignee: { name: "Maria Garcia" }, priority: "medium", status: "pending", dueDate: "Dec 15" },
    { id: "3", title: "Fix login authentication bug", assignee: { name: "David Kim" }, priority: "high", status: "completed", dueDate: "Dec 5" },
  ]);

  const handleToggle = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, status: (task.status === "completed" ? "pending" : "completed") as "pending" | "in_progress" | "completed" }
          : task
      )
    );
  };

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskCard key={task.id} {...task} onToggle={handleToggle} />
      ))}
    </div>
  );
}
