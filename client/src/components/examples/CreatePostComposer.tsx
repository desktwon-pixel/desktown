import { CreatePostComposer } from "../CreatePostComposer";

export default function CreatePostComposerExample() {
  return (
    <div className="max-w-xl">
      <CreatePostComposer
        user={{ name: "Sarah Chen" }}
        onPost={(content) => console.log("Posted:", content)}
      />
    </div>
  );
}
