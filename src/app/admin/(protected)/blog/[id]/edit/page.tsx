import { redirect } from "next/navigation";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type Params = {
  id: string;
};

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  if (!supabase) {
    redirect("/admin/blog");
  }

  const { data: post } = await supabase
    .from("blog_posts")
    .select(
      "id,title,slug,excerpt,content,cover_image,category,tags,seo_title,seo_description,is_published",
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    redirect("/admin/blog");
  }

  return (
    <section className="py-8">
      <Container>
        <BlogPostForm mode="edit" initialData={post} />
      </Container>
    </section>
  );
}
