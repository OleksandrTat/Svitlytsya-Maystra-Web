import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductsClient } from "@/components/admin/products/products-page-wrapper";
import {
  getAllProductsForAdmin,
  getPriceFormulasForAdmin,
} from "@/lib/data/queries";

export default async function AdminProductsPage() {
  const [t, products, formulas] = await Promise.all([
    getTranslations("admin.pages.products"),
    getAllProductsForAdmin(),
    getPriceFormulasForAdmin(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <AdminProductsClient
        products={products}
        formulas={formulas}
      />
    </AdminShell>
  );
}
