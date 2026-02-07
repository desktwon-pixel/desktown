import { useState } from "react";
import { JobPostingCard } from "../JobPostingCard";

export default function JobPostingCardExample() {
  const [jobs, setJobs] = useState([
    { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Remote", type: "Full-time", salary: "$120k - $150k", postedDays: 3, isPublished: true },
    { id: "2", title: "Product Designer", department: "Design", location: "Remote", type: "Full-time", salary: "$90k - $120k", postedDays: 7, isPublished: true },
    { id: "3", title: "Marketing Manager", department: "Marketing", location: "Hybrid", type: "Full-time", salary: "$80k - $100k", postedDays: 1, isPublished: false },
  ]);

  const handleToggle = (id: string, published: boolean) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, isPublished: published } : job));
    console.log(`Job ${id} is now ${published ? "published" : "draft"}`);
  };

  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <JobPostingCard
          key={job.id}
          {...job}
          isEditable
          onTogglePublish={handleToggle}
          onEdit={(id) => console.log("Edit job:", id)}
        />
      ))}
    </div>
  );
}
