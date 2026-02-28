import Link from "next/link";
import {
  deleteBlogPostAction,
  togglePublishBlogPostAction,
} from "@/actions/admin/blog";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";

export default async function AdminBlogPage() {
  const supabase = await createSupabaseServerClient();
  const { data: posts } = supabase
    ? await supabase
        .from("blog_posts")
        .select(
          "id,title,slug,category,is_published,published_at,updated_at,reading_time_min",
        )
        .order("updated_at", { ascending: false })
    : { data: [] };

  const togglePublish = async (formData: FormData) => {
    "use server";
    await togglePublishBlogPostAction(formData);
  };

  const deletePost = async (formData: FormData) => {
    "use server";
    await deleteBlogPostAction(formData);
  };

  return (
    <AdminShell
      title="Блог компанії"
      description="Управління статтями, публікаціями та SEO полями."
    >
      <div className="flex justify-end">
        <Link
          href="/admin/blog/new"
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Нова стаття
        </Link>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Заголовок</th>
                <th className="px-2 py-2">Категорія</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Оновлено</th>
                <th className="px-2 py-2">Дії</th>
              </tr>
            </thead>
            <tbody>
              {(posts ?? []).map((post) => (
                <tr key={post.id} className="border-b border-[var(--color-border)]/60 align-top">
                  <td className="px-2 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">{post.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      /blog/{post.slug} · {post.reading_time_min} хв
                    </p>
                  </td>
                  <td className="px-2 py-3">{post.category}</td>
                  <td className="px-2 py-3">
                    {post.is_published
                      ? `Опубліковано ${formatInquiryDate(post.published_at || post.updated_at)}`
                      : "Чернетка"}
                  </td>
                  <td className="px-2 py-3">{formatInquiryDate(post.updated_at)}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/blog/${post.id}/edit`} className="text-xs underline">
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
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={post.id} />
                        <button type="submit" className="text-xs text-red-600">
                          Видалити
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
