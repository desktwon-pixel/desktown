import { SocialPost } from "../SocialPost";

export default function SocialPostExample() {
  return (
    <div className="space-y-4 max-w-xl">
      <SocialPost
        id="1"
        author={{ name: "James Wilson", department: "Product" }}
        content="Excited to announce our new product launch next week! The team has been working incredibly hard on this release."
        likes={24}
        comments={8}
        timestamp="2 hours ago"
      />
      <SocialPost
        id="2"
        author={{ name: "Sarah Chen", department: "Engineering" }}
        content="Great sprint retrospective today. Keep up the amazing work everyone!"
        likes={15}
        comments={3}
        timestamp="5 hours ago"
      />
    </div>
  );
}
