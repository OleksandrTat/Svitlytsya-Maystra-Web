import { CulturalPostForm } from "@/components/admin/cultural/cultural-post-form";
import { Container } from "@/components/ui/container";

export default function AdminCulturalNewPage() {
  return (
    <section className="py-8">
      <Container>
        <CulturalPostForm mode="create" />
      </Container>
    </section>
  );
}
