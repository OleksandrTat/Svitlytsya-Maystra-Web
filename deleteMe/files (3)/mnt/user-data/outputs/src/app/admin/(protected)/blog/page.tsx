import { AdminShell } from "@/components/admin/admin-shell";
import { BlogAdminClient } from "@/components/admin/blog/blog-admin-client";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";

async function getBlogPosts() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return [];
  const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((p: any) => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : [], content: p.content ?? "" }));
}

export default async function AdminBlogPage() {
  const posts = await getBlogPosts();
  return (
    <AdminShell title="Блог" description="Статті, поради та новини від майстерні.">
      <BlogAdminClient posts={posts as any} />
    </AdminShell>
  );
}
