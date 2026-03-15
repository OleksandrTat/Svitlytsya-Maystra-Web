import Link from "next/link";
import { CommentForm } from "@/components/blog/comment-form";
import { CommentItem } from "@/components/blog/comment-item";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type CommentSectionProps = {
  postId: string;
  postSlug: string;
};

export async function CommentSection({ postId, postSlug }: CommentSectionProps) {
  const serverSupabase = await createSupabaseServerClient();
  const readSupabase = createSupabaseServiceClient() ?? serverSupabase;

  if (!readSupabase) {
    return null;
  }

  const [{ data: commentsRaw }, authDataResult] = await Promise.all([
    readSupabase
      .from("blog_comments")
      .select("id,content,created_at,parent_id,user_id")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
    serverSupabase?.auth.getUser(),
  ]);

  const comments = commentsRaw ?? [];
  const userIds = Array.from(new Set(comments.map((comment) => comment.user_id)));

  const { data: profilesRaw } =
    userIds.length > 0
      ? await readSupabase
          .from("user_profiles")
          .select("id,display_name,avatar_url")
          .in("id", userIds)
      : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };

  const profileMap = new Map((profilesRaw ?? []).map((profile) => [profile.id, profile]));

  const normalizedComments = comments.map((comment) => {
    const profile = profileMap.get(comment.user_id);
    return {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      parent_id: comment.parent_id,
      author_name: profile?.display_name || "Користувач",
      author_avatar: profile?.avatar_url || null,
    };
  });

  const currentUser = authDataResult?.data.user ?? null;

  return (
    <section className="mt-14 border-t border-[var(--color-border)] pt-8">
      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        Коментарі ({normalizedComments.length})
      </h2>

      <div className="mt-5 space-y-3">
        {normalizedComments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">
            Поки що коментарів немає.
          </p>
        ) : (
          normalizedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      <div className="mt-6">
        {currentUser ? (
          <CommentForm postId={postId} postSlug={postSlug} />
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            <Link href="/auth/login" className="text-[var(--color-primary)] underline">
              Увійдіть
            </Link>{" "}
            щоб залишити коментар.
          </p>
        )}
      </div>
    </section>
  );
}
