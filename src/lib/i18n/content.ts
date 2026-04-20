import type { Product, Service, BlogPost, FaqItem, Certificate, Testimonial } from "@/lib/types";

type Locale = "uk" | "en";

/** Returns the EN translation if locale=en and the value is non-empty, otherwise falls back to the base (UK) value. */
function localizeField(base: string, translated: string | null | undefined, locale: Locale): string {
  if (locale === "en" && translated && translated.trim()) {
    return translated.trim();
  }
  return base;
}

function localizeFieldNullable(
  base: string | null,
  translated: string | null | undefined,
  locale: Locale,
): string | null {
  if (locale === "en" && translated && translated.trim()) {
    return translated.trim();
  }
  return base;
}

export function localizeProduct(product: Product, locale: Locale): Product {
  if (locale === "uk") return product;
  return {
    ...product,
    title: localizeField(product.title, product.title_en, locale),
    description: localizeField(product.description, product.description_en, locale),
    short_description: localizeFieldNullable(product.short_description, product.short_description_en, locale),
    seo_title: localizeFieldNullable(product.seo_title, product.seo_title_en, locale),
    seo_description: localizeFieldNullable(product.seo_description, product.seo_description_en, locale),
  };
}

export function localizeService(service: Service, locale: Locale): Service {
  if (locale === "uk") return service;
  return {
    ...service,
    title: localizeField(service.title, service.title_en, locale),
    tagline: localizeFieldNullable(service.tagline, service.tagline_en, locale),
    short_description: localizeField(service.short_description, service.short_description_en, locale),
    description: localizeField(service.description, service.description_en, locale),
    seo_title: localizeFieldNullable(service.seo_title, service.seo_title_en, locale),
    seo_description: localizeFieldNullable(service.seo_description, service.seo_description_en, locale),
  };
}

export function localizeBlogPost(post: BlogPost, locale: Locale): BlogPost {
  if (locale === "uk") return post;
  return {
    ...post,
    title: localizeField(post.title, post.title_en, locale),
    excerpt: localizeField(post.excerpt, post.excerpt_en, locale),
    content: localizeField(post.content, post.content_en, locale),
    seo_title: localizeFieldNullable(post.seo_title, post.seo_title_en, locale),
    seo_description: localizeFieldNullable(post.seo_description, post.seo_description_en, locale),
  };
}

export function localizeFaqItem(item: FaqItem, locale: Locale): FaqItem {
  if (locale === "uk") return item;
  return {
    ...item,
    question: localizeField(item.question, item.question_en, locale),
    answer: localizeField(item.answer, item.answer_en, locale),
  };
}

export function localizeTestimonial(testimonial: Testimonial, locale: Locale): Testimonial {
  if (locale === "uk") return testimonial;
  return {
    ...testimonial,
    content: localizeField(testimonial.content, testimonial.content_en, locale),
  };
}

export function localizeCertificate(cert: Certificate, locale: Locale): Certificate {
  if (locale === "uk") return cert;
  return {
    ...cert,
    title: localizeField(cert.title, cert.title_en, locale),
    issuer: localizeField(cert.issuer, cert.issuer_en, locale),
    description: localizeFieldNullable(cert.description, cert.description_en, locale),
  };
}
