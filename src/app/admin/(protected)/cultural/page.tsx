import Link from "next/link";
import {
  deleteCulturalPostAction,
  togglePublishCulturalPostAction,
} from "@/actions/admin/cultural";
import { approveCommentAction, rejectCommentAction } from "@/actions/comments";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";

export default async function AdminCulturalPage() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  const [{ data: postsRaw }, { data: commentsRaw }] = supabase
    ? await Promise.all([
        supabase
          .from("cultural_blog_posts")
          .select("id,title,slug,is_published,updated_at,comments_count")
          .order("updated_at", { ascending: false }),
        supabase
          .from("blog_comments")
          .select("id,post_id,user_id,content,status,created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  const posts = postsRaw ?? [];
  const comments = commentsRaw ?? [];

  const postMap = new Map(posts.map((post) => [post.id, post]));
  const commenterIds = Array.from(new Set(comments.map((comment) => comment.user_id)));
  const { data: profilesRaw } =
    supabase && commenterIds.length > 0
      ? await supabase
          .from("user_profiles")
          .select("id,display_name")
          .in("id", commenterIds)
      : { data: [] };
  const profileMap = new Map((profilesRaw ?? []).map((profile) => [profile.id, profile]));

  const approve = async (formData: FormData) => {
    "use server";
    await approveCommentAction(formData);
  };

  const reject = async (formData: FormData) => {
    "use server";
    await rejectCommentAction(formData);
  };

  const togglePublish = async (formData: FormData) => {
    "use server";
    await togglePublishCulturalPostAction(formData);
  };

  const deletePost = async (formData: FormData) => {
    "use server";
    await deleteCulturalPostAction(formData);
  };

  return (
    <AdminShell
      title="Культурний блог"
      description="Публікації культурного блогу та модерація коментарів."
    >
      <div className="flex justify-end">
        <Link
          href="/admin/cultural/new"
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Нова стаття
        </Link>
      </div>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Статті</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Заголовок</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Коментарі</th>
                <th className="px-2 py-2">Оновлено</th>
                <th className="px-2 py-2">Дії</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-[var(--color-border)]/60 align-top">
                  <td className="px-2 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">{post.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">/cultural/{post.slug}</p>
                  </td>
                  <td className="px-2 py-3">{post.is_published ? "Опубліковано" : "Чернетка"}</td>
                  <td className="px-2 py-3">{post.comments_count}</td>
                  <td className="px-2 py-3">{formatInquiryDate(post.updated_at)}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/cultural/${post.id}/edit`} className="text-xs underline">
                        Редагувати
                      </Link>
                      <form action={togglePublish}>
                        <input type="hidden" name="id" value={post.id} />
                        <input
                          type="hidden"
                          name="publish"
                          value={post.is_published ? "false" : "true"}
                        />
                        <button type="submit" className="text-xs underline">
                          {post.is_published ? "Зняти з публікації" : "Опублікувати"}
                        </button>
                      </form>
                      <Link href={`/cultural/${post.slug}`} className="text-xs underline">
                        Відкрити
                      </Link>
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={post.id} />
                        <ConfirmDeleteButton confirmMessage="Delete cultural post?" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Коментарі на модерацію</h2>
        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Немає коментарів, що очікують модерацію.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {comments.map((comment) => {
              const post = postMap.get(comment.post_id);
              const profile = profileMap.get(comment.user_id);
              return (
                <article
                  key={comment.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                >
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {profile?.display_name || "Користувач"} · {formatInquiryDate(comment.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                    Стаття: {post?.title || "Невідома стаття"}
                  </p>
                  <p className="mt-3 text-sm text-[var(--color-text-primary)]">{comment.content}</p>
                  <div className="mt-4 flex gap-2">
                    <form action={approve}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="post_slug" value={post?.slug || ""} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Схвалити
                      </button>
                    </form>
                    <form action={reject}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="post_slug" value={post?.slug || ""} />
                      <button
                        type="submit"
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Відхилити
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
