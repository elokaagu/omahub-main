import { getInstagramPosts } from "@/lib/instagram/getInstagramPosts";
import { InstagramFeedRow } from "./InstagramFeedRow";

export async function InstagramFeedSection() {
  const posts = await getInstagramPosts();
  if (posts.length === 0) return null;

  return (
    <section
      aria-label="Latest Instagram posts"
      className="border-t border-oma-cocoa/10 bg-white py-14 sm:py-16"
    >
      <InstagramFeedRow posts={posts} />
    </section>
  );
}
