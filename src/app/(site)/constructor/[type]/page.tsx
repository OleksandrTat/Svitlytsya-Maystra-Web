import { notFound } from "next/navigation";
import { ConstructorClient } from "@/components/constructor/constructor-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Step = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const STEPS: Record<"door" | "furniture", Step[]> = {
  door: [
    {
      key: "door_type",
      label: "Тип дверей",
      options: [
        { value: "interior", label: "Міжкімнатні" },
        { value: "entry", label: "Вхідні" },
        { value: "pantry", label: "Комора" },
      ],
    },
    {
      key: "material",
      label: "Матеріал",
      options: [
        { value: "oak", label: "Дуб" },
        { value: "ash", label: "Ясен" },
        { value: "pine", label: "Сосна" },
        { value: "mdf", label: "МДФ" },
      ],
    },
    {
      key: "color",
      label: "Колір / покриття",
      options: [
        { value: "natural", label: "Натуральний" },
        { value: "brushed", label: "Браш" },
        { value: "dark-walnut", label: "Темний горіх" },
        { value: "white", label: "Білий" },
      ],
    },
    {
      key: "glass",
      label: "Скло",
      options: [
        { value: "no-glass", label: "Без скла" },
        { value: "frosted", label: "Матове" },
        { value: "clear", label: "Прозоре" },
        { value: "pattern", label: "Візерунок" },
      ],
    },
    {
      key: "hardware",
      label: "Фурнітура",
      options: [
        { value: "classic", label: "Класика" },
        { value: "modern", label: "Модерн" },
        { value: "minimal", label: "Мінімалізм" },
      ],
    },
    {
      key: "size",
      label: "Розмір",
      options: [
        { value: "200x80", label: "200x80 (стандарт)" },
        { value: "200x90", label: "200x90" },
        { value: "custom", label: "Нестандарт" },
      ],
    },
  ],
  furniture: [
    {
      key: "furniture_type",
      label: "Тип меблів",
      options: [
        { value: "wardrobe", label: "Шафа" },
        { value: "table", label: "Стіл" },
        { value: "cabinet", label: "Тумба" },
        { value: "shelf", label: "Стелаж" },
      ],
    },
    {
      key: "material",
      label: "Матеріал",
      options: [
        { value: "oak", label: "Дуб" },
        { value: "ash", label: "Ясен" },
        { value: "mdf", label: "МДФ" },
      ],
    },
    {
      key: "color",
      label: "Колір",
      options: [
        { value: "natural", label: "Натуральний" },
        { value: "dark", label: "Темний" },
        { value: "white", label: "Білий" },
      ],
    },
  ],
};

type SearchParams = Record<string, string | string[] | undefined>;

type Params = {
  type: string;
};

export default async function ConstructorTypePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { type } = await params;
  const query = await searchParams;

  if (type !== "door" && type !== "furniture") {
    notFound();
  }

  const steps = STEPS[type];

  const supabase = await createSupabaseServerClient();
  const { data: configurations } = supabase
    ? await supabase
        .from("product_configurations")
        .select("configuration_key,image_url")
        .eq("product_type", type)
        .eq("is_active", true)
    : { data: [] };

  const photoMap = Object.fromEntries(
    (configurations ?? []).map((item) => [item.configuration_key, item.image_url]),
  );

  const initialConfig = Object.fromEntries(
    steps.map((step) => {
      const raw = query[step.key];
      const value = typeof raw === "string" ? raw : step.options[0]?.value || "";
      return [step.key, value];
    }),
  );

  return (
    <ConstructorClient
      productType={type}
      steps={steps}
      photoMap={photoMap}
      initialConfig={initialConfig}
    />
  );
}
