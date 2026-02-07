import { UserAvatar } from "../UserAvatar";

export default function UserAvatarExample() {
  return (
    <div className="flex items-center gap-4">
      <UserAvatar name="Sarah Chen" size="sm" status="online" />
      <UserAvatar name="James Wilson" size="md" status="away" />
      <UserAvatar name="Maria Garcia" size="lg" status="busy" />
      <UserAvatar name="David Kim" size="md" status="offline" />
    </div>
  );
}
