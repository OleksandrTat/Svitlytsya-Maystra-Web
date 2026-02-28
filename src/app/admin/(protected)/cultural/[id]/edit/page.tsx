import { redirect } from "next/navigation";
import { CulturalPostForm } from "@/components/admin/cultural/cultural-post-form";
import { Container } from "@/components/ui/container";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type Params = {
  id: string;
};

export default async function AdminCulturalEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  if (!supabase) {
    redirect("/admin/cultural");
  }

  const { data: post } = await supabase
    .from("cultural_blog_posts")
    .select(
      "id,title,slug,excerpt,content,cover_image,category,tags,seo_title,seo_description,guest_author_name,guest_author_bio,is_published,allow_comments",
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    redirect("/admin/cultural");
  }

  return (
    <section className="py-8">
      <Container>
        <CulturalPostForm mode="edit" initialData={post} />
      </Container>
    </section>
  );
}
