import { StatusStoriesRow } from "../StatusStory";

const mockStories = [
  { id: "1", user: { name: "Sarah Chen" }, isViewed: false },
  { id: "2", user: { name: "James Wilson" }, isViewed: false },
  { id: "3", user: { name: "Maria Garcia" }, isViewed: true },
  { id: "4", user: { name: "David Kim" }, isViewed: true },
];

export default function StatusStoryExample() {
  return (
    <StatusStoriesRow
      stories={mockStories}
      currentUser={{ name: "You" }}
      onStoryClick={(id) => console.log("View story:", id)}
      onAddStory={() => console.log("Add story")}
    />
  );
}
