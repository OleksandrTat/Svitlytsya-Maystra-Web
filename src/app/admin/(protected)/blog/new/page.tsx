import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { Container } from "@/components/ui/container";

export default function AdminBlogNewPage() {
  return (
    <section className="py-8">
      <Container>
        <BlogPostForm mode="create" />
      </Container>
    </section>
  );
}
